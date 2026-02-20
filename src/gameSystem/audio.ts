import { loadSettings } from './settings';
import bgmFile from '../Sound/Sound_main.mp3';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private bgmGainNode: GainNode | null = null;
  private bgmVolumeNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmBuffer: AudioBuffer | null = null;
  private initialized = false;
  private userUnlockedAudio = false;

  markUserInteraction() {
    this.userUnlockedAudio = true;
    this.resume();
  }

  canPlayAudioNow(): boolean {
    return this.userUnlockedAudio;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // BGM 게인 노드
      this.bgmGainNode = this.audioContext.createGain();
      this.bgmGainNode.connect(this.audioContext.destination);

      this.bgmVolumeNode = this.audioContext.createGain();
      this.bgmVolumeNode.gain.value = 0.4;
      this.bgmVolumeNode.connect(this.bgmGainNode);
      
      // SFX 게인 노드
      this.sfxGainNode = this.audioContext.createGain();
      this.sfxGainNode.connect(this.audioContext.destination);
      
      this.updateVolumes();
      this.initialized = true;

      if (this.userUnlockedAudio) {
        this.resume();
      }

      // BGM 로드 (재생은 하지 않음)
      await this.loadBGM();
    } catch (error) {
      console.warn('AudioContext initialization failed:', error);
    }
  }

  updateVolumes() {
    const settings = loadSettings();
    
    if (this.bgmGainNode) {
      const bgmVolume = settings.audio.bgmEnabled ? settings.audio.bgmVolume / 100 : 0;
      this.bgmGainNode.gain.value = bgmVolume;

      // BGM 활성화 상태에 따라 재생/정지
      if (settings.audio.bgmEnabled && !this.bgmSource && this.bgmBuffer && this.userUnlockedAudio) {
        this.playBGM();
      } else if (!settings.audio.bgmEnabled && this.bgmSource) {
        this.stopBGM();
      }
    }
    
    if (this.sfxGainNode) {
      const sfxVolume = settings.audio.sfxEnabled ? settings.audio.sfxVolume / 100 : 0;
      this.sfxGainNode.gain.value = sfxVolume;
    }
  }

  playHitSound() {
    if (!this.audioContext || !this.sfxGainNode) return;
    
    const settings = loadSettings();
    if (!settings.audio.sfxEnabled) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGainNode);
      
      oscillator.frequency.value = 200;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Failed to play hit sound:', error);
    }
  }

  playGameOverSound() {
    if (!this.audioContext || !this.sfxGainNode) return;
    
    const settings = loadSettings();
    if (!settings.audio.sfxEnabled) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGainNode);
      
      oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Failed to play game over sound:', error);
    }
  }

  playScoreSound() {
    // TODO: 10초 또는 20초 돌파 시 효과음 추가 예정
  }

  async loadBGM() {
    if (!this.audioContext) return;

    try {
      const response = await fetch(bgmFile);
      const arrayBuffer = await response.arrayBuffer();
      this.bgmBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn('Failed to load BGM:', error);
    }
  }

  playBGM() {
    if (!this.audioContext || !this.bgmGainNode || !this.bgmBuffer) return;
    if (!this.userUnlockedAudio) return;

    const settings = loadSettings();
    if (!settings.audio.bgmEnabled) return;
    if (this.bgmSource) return;

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.bgmBuffer;
      source.loop = true; // 반복 재생
      source.connect(this.bgmVolumeNode || this.bgmGainNode);
      source.onended = () => {
        if (this.bgmSource === source) {
          this.bgmSource = null;
        }
        try {
          source.disconnect();
        } catch (error) {
          // Already disconnected
        }
        source.onended = null;
      };
      this.bgmSource = source;
      source.start(0);

    } catch (error) {
      console.warn('Failed to play BGM:', error);
    }
  }

  stopBGM() {
    if (this.bgmSource) {
      const source = this.bgmSource;
      this.bgmSource = null;

      try {
        source.stop();
      } catch (error) {
        // Already stopped
      }
      source.onended = null;
      try {
        source.disconnect();
      } catch (error) {
        // Ignore disconnect errors on already disconnected nodes.
      }
    }
  }

  resume() {
    if (!this.audioContext) return;
    if (!this.userUnlockedAudio) return;
    if (this.audioContext.state !== 'running') {
      void this.audioContext.resume().catch(() => {
        // Browser may block until a valid user gesture.
      });
    }
  }
}

// 싱글톤 인스턴스
export const audioManager = new AudioManager();

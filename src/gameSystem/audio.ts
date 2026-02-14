import { loadSettings } from './settings';
import bgmFile from '../Sound/Sound_main.mp3';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private bgmGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmBuffer: AudioBuffer | null = null;
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // BGM 게인 노드
      this.bgmGainNode = this.audioContext.createGain();
      this.bgmGainNode.connect(this.audioContext.destination);
      
      // SFX 게인 노드
      this.sfxGainNode = this.audioContext.createGain();
      this.sfxGainNode.connect(this.audioContext.destination);
      
      this.updateVolumes();
      this.initialized = true;

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
      if (settings.audio.bgmEnabled && !this.bgmSource && this.bgmBuffer) {
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

    const settings = loadSettings();
    if (!settings.audio.bgmEnabled) return;

    try {
      // 기존 BGM이 재생 중이면 중지
      this.stopBGM();

      // 추가 게인 노드로 볼륨 절반으로 조절
      const bgmVolumeGain = this.audioContext.createGain();
      bgmVolumeGain.gain.value = 0.4; // 볼륨 50%로 설정
      bgmVolumeGain.connect(this.bgmGainNode);

      // 새로운 소스 생성
      this.bgmSource = this.audioContext.createBufferSource();
      this.bgmSource.buffer = this.bgmBuffer;
      this.bgmSource.loop = true; // 반복 재생
      this.bgmSource.connect(bgmVolumeGain);

      // BGM이 끝나면 자동으로 다시 재생 (루프 보장)
      this.bgmSource.onended = () => {
        if (this.bgmSource) {
          this.playBGM();
        }
      };

      this.bgmSource.start(0);
    } catch (error) {
      console.warn('Failed to play BGM:', error);
    }
  }

  stopBGM() {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
      } catch (error) {
        // Already stopped
      }
      this.bgmSource = null;
    }
  }

  resume() {
    if (!this.audioContext) return;
    if (this.audioContext.state !== 'running') {
      void this.audioContext.resume().catch(() => {
        // Browser may block until a valid user gesture.
      });
    }
  }
}

// 싱글톤 인스턴스
export const audioManager = new AudioManager();

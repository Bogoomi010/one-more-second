import { loadSettings } from './settings';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private bgmGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private initialized = false;

  init() {
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
    } catch (error) {
      console.warn('AudioContext initialization failed:', error);
    }
  }

  updateVolumes() {
    const settings = loadSettings();
    
    if (this.bgmGainNode) {
      const bgmVolume = settings.audio.bgmEnabled ? settings.audio.bgmVolume / 100 : 0;
      this.bgmGainNode.gain.value = bgmVolume;
    }
    
    if (this.sfxGainNode) {
      const sfxVolume = settings.audio.sfxEnabled ? settings.audio.sfxVolume / 100 : 0;
      this.sfxGainNode.gain.value = sfxVolume;
    }
  }

  // 간단한 톤 생성 (실제 게임에서는 오디오 파일 사용)
  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer | null {
    if (!this.audioContext) return null;
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 2);
    }
    
    return buffer;
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
    if (!this.audioContext || !this.sfxGainNode) return;
    
    const settings = loadSettings();
    if (!settings.audio.sfxEnabled) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGainNode);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Failed to play score sound:', error);
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
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// 싱글톤 인스턴스
export const audioManager = new AudioManager();

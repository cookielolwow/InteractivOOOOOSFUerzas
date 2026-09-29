// Audio Companion: Pre-loaded PinkPantheress "Girl Like Me" + 138 BPM 2-step drum generator
// Provides musical reference for live interpretation without automatic visual takeover

import defaultSongUrl from '../sonido/PinkPantheress - Girl Like Me (Official Video).mp3';

export class AudioCompanion {
  constructor(onBeatCallback) {
    this.onBeatCallback = onBeatCallback;
    this.audioCtx = null;
    this.bpm = 138;
    this.isPlayingDrum = false;
    this.step = 0;
    this.timerId = null;

    // Official track loaded automatically
    this.audioElement = new Audio(defaultSongUrl);
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';
    this.hasCustomAudio = true;
    this.isCustomAudioPlaying = false;

    this.setupAudioListeners();
  }

  setupAudioListeners() {
    this.audioElement.addEventListener('ended', () => {
      this.isCustomAudioPlaying = false;
    });
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play synthesized Kick drum (fallback practice track)
  playKick(time) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.17);
  }

  // Play synthesized 2-step Snare/Clap
  playSnare(time) {
    const bufferSize = this.audioCtx.sampleRate * 0.12;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(time);
  }

  // Play Hi-Hat
  playHat(time, open = false) {
    const osc = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const dur = open ? 0.08 : 0.03;
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + dur + 0.01);
  }

  // 16-step UK Garage 2-step beat loop
  scheduleBeat() {
    if (!this.isPlayingDrum) return;

    const stepTime = (60 / this.bpm) / 4; // 16th note
    const now = this.audioCtx.currentTime;

    if (this.step === 0 || this.step === 10) {
      this.playKick(now);
    }
    if (this.step === 4 || this.step === 12) {
      this.playSnare(now);
    }
    if (this.step % 2 === 0 || this.step === 3 || this.step === 7 || this.step === 11) {
      this.playHat(now, this.step === 14);
    }

    this.step = (this.step + 1) % 16;
    this.timerId = setTimeout(() => this.scheduleBeat(), stepTime * 1000);
  }

  toggleDrumTrack() {
    this.initContext();
    this.isPlayingDrum = !this.isPlayingDrum;
    if (this.isPlayingDrum) {
      this.step = 0;
      this.scheduleBeat();
    } else if (this.timerId) {
      clearTimeout(this.timerId);
    }
    return this.isPlayingDrum;
  }

  loadAudioFile(file) {
    const url = URL.createObjectURL(file);
    this.audioElement.src = url;
    this.hasCustomAudio = true;
  }

  seek(seconds) {
    if (this.hasCustomAudio) {
      this.audioElement.currentTime = Math.max(0, Math.min(this.audioElement.duration || 145, seconds));
    }
  }

  toggleSongAudio() {
    if (!this.hasCustomAudio) return false;

    if (this.audioElement.paused) {
      this.audioElement.play().catch((err) => {
        console.warn('Audio playback error (user interaction needed):', err);
      });
      this.isCustomAudioPlaying = true;
    } else {
      this.audioElement.pause();
      this.isCustomAudioPlaying = false;
    }
    return this.isCustomAudioPlaying;
  }

  getSongTime() {
    if (this.hasCustomAudio && !this.audioElement.paused) {
      return this.audioElement.currentTime;
    }
    return null;
  }
}

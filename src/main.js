import './styles.css';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { gsap } from 'gsap';
import { HolographicStickerDOMManager } from './HolographicStickerDOMManager.js';
import { PALETTE, colorDistance, rotationDistance } from './abdGameLogic.js';

const LETTER_SEQUENCE = ['A', 'B', 'D'];
const publicAssetUrl = (filename) => `${import.meta.env.BASE_URL}${encodeURIComponent(filename)}`;
const PAINT_COLORS = [
  '#ff3d00', '#ff6d00', '#ff1744', '#ff006e', '#ff2e9f',
  '#ffd600', '#b8ff00', '#00e676', '#00c853', '#00f5d4',
  '#00d1ff', '#00a8ff', '#0057ff', '#4833ff', '#a100ff',
];
const LETTER_CONFIRMATION_COLOR = new THREE.Color('#22c55e');
const TARGET_SCALE = 2.6;
const LETTER_TARGET_SCALES = { A: TARGET_SCALE * 0.85, B: TARGET_SCALE, D: TARGET_SCALE * 1.15 };
const ROTATION_TOLERANCE = 0.35;
const VICTORY_BOUNCE_ORDER = ['A', 'B', 'D', 'A', 'B', 'D', 'A', 'B', 'D'];
const GOAL_POSITIONS = {
  A: { x: -1.15 * TARGET_SCALE, y: -0.95 * TARGET_SCALE },
  B: { x: 0.05 * TARGET_SCALE, y: -0.95 * TARGET_SCALE },
  D: { x: 1.08 * TARGET_SCALE, y: -0.95 * TARGET_SCALE },
};
const GOAL_ROTATION = { x: 0, y: -Math.PI * 0.15, z: 0 };
const START_POSITIONS = {
  A: { x: -4.4, y: -2.1 },
  B: { x: 0, y: 0.1 },
  D: { x: 4.4, y: -2.1 },
};
const START_SCALES = { A: 0.72, B: 0.88, D: 0.66 };

class FrutigerAudioEngine {
  constructor() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    this.ctx = AudioCtor ? new AudioCtor() : null;

    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.76;
    this.masterGain.connect(this.ctx.destination);
    this.letterBus = this.createBus(0.92);
    this.foleyBus = this.createBus(0.54);
    this.musicBus = this.createBus(0.88);
    this.soundMap = {};
    this.activeLetterVoices = new Map();
    this.activeDragVoices = new Map();
    this.trackBuffer = null;
    this.trackSource = null;
    this.ducked = false;
    this.moveVoice = null;
    this.scaleVoice = null;
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this.createReverbImpulse(2.4, 2.1);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.38;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.foleyBus);
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  createBus(level) {
    const bus = this.ctx.createGain();
    bus.gain.value = level;
    bus.connect(this.masterGain);
    return bus;
  }

  createReverbImpulse(duration, decay) {
    const length = Math.floor(this.ctx.sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const samples = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const progress = index / length;
        const softNoise = (Math.random() * 2 - 1) * 0.35;
        samples[index] = softNoise * (1 - progress) ** decay;
      }
    }
    return impulse;
  }

  async loadLetterEffects() {
    if (!this.ctx) return;
    const audioUrls = {
      A: publicAssetUrl('a.MP3'),
      B: publicAssetUrl('b.MP3'),
      D: publicAssetUrl('d.MP3'),
    };

    for (const [id, url] of Object.entries(audioUrls)) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        this.soundMap[id] = await this.ctx.decodeAudioData((await response.arrayBuffer()).slice(0));
      } catch (error) {
        console.warn(`No se pudo cargar el sonido de ${id}.`, error);
      }
    }
  }

  playLetterSound(letterId, letter, progress = 0) {
    if (!this.ctx) return;
    const buffer = this.soundMap[letterId];
    if (!buffer) return;
    const previous = this.activeLetterVoices.get(letterId);
    if (previous) this.fadeVoice(previous, 0.045);

    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const scalePitch = 1.04 - ((letter?.scale ?? TARGET_SCALE) - TARGET_SCALE) * 0.12;
    const playbackRate = THREE.MathUtils.clamp(scalePitch, 0.85, 1.25);
    const now = this.ctx.currentTime;
    const duration = buffer.duration / playbackRate;
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(playbackRate, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(THREE.MathUtils.lerp(1900, 5600, progress), now);
    filter.Q.setValueAtTime(0.7 + progress * 0.5, now);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.letterBus);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.42, now + 0.035);
    gain.gain.setValueAtTime(0.42, now + Math.max(0.06, duration - 0.09));
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);

    const voice = { source, filter, gain };
    this.activeLetterVoices.set(letterId, voice);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      if (this.activeLetterVoices.get(letterId) === voice) this.activeLetterVoices.delete(letterId);
    };
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  updateLetter(letter, progress) {
    const voice = this.activeLetterVoices.get(letter?.id);
    if (!this.ctx || !voice) return;
    const now = this.ctx.currentTime;
    voice.filter.frequency.setTargetAtTime(THREE.MathUtils.lerp(1900, 5600, progress), now, 0.12);
    voice.filter.Q.setTargetAtTime(0.7 + progress * 0.5, now, 0.14);
  }

  playGrab() {
    if (!this.ctx) return;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(520, now);
    oscillator.frequency.exponentialRampToValueAtTime(190, now + 0.12);
    oscillator.connect(gain);
    gain.connect(this.foleyBus);
    this.envelope(gain, now, 0.0001, 0.065, 0.035, 0.19);
    oscillator.start(now);
    oscillator.stop(now + 0.19);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  async loadFinalTrack() {
    if (!this.ctx) return null;
    try {
      const response = await fetch(publicAssetUrl('cansioncita fina.MP3'));
      if (!response.ok) return null;
      this.trackBuffer = await this.ctx.decodeAudioData((await response.arrayBuffer()).slice(0));
      return this.trackBuffer;
    } catch (error) {
      console.warn('No se pudo cargar la canción final.', error);
      return null;
    }
  }

  createGuideVoice(frequency, cutoff, level, type = 'sine') {
    const oscillator = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);
    filter.Q.value = 0.65;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(level, now + 0.12);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.foleyBus);
    oscillator.start(now);
    return { oscillator, filter, gain };
  }

  fadeGuideVoice(voice, duration = 0.16) {
    if (!this.ctx || !voice) return;
    const now = this.ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
    voice.gain.gain.linearRampToValueAtTime(0.0001, now + duration);
    voice.oscillator.stop(now + duration + 0.02);
    voice.oscillator.onended = () => {
      voice.oscillator.disconnect();
      voice.filter.disconnect();
      voice.gain.disconnect();
    };
  }

  startMoveAudio(letterId) {
    if (!this.ctx || (this.moveVoice && this.moveVoice.letterId === letterId)) return;
    this.stopMoveAudio();
    this.resume().catch(() => {});
    const voice = this.createGuideVoice(190, 300, 0.052);
    voice.letterId = letterId;
    this.moveVoice = voice;
  }

  updateMoveAudio(distance) {
    if (!this.ctx || !this.moveVoice) return;
    const proximity = 1 - THREE.MathUtils.clamp(distance / 6, 0, 1);
    const now = this.ctx.currentTime;
    this.moveVoice.filter.frequency.setTargetAtTime(THREE.MathUtils.lerp(300, 5200, proximity), now, 0.12);
    this.moveVoice.oscillator.frequency.setTargetAtTime(THREE.MathUtils.lerp(175, 285, proximity), now, 0.16);
    this.moveVoice.gain.gain.setTargetAtTime(0.028 + proximity * 0.034, now, 0.16);
  }

  stopMoveAudio() {
    if (!this.moveVoice) return;
    this.fadeGuideVoice(this.moveVoice);
    this.moveVoice = null;
  }

  startScaleAudio(letterId) {
    if (!this.ctx || (this.scaleVoice && this.scaleVoice.letterId === letterId)) return;
    this.stopScaleAudio();
    this.resume().catch(() => {});
    const voice = this.createGuideVoice(523.25, 1100, 0.06, 'sine');
    voice.letterId = letterId;
    this.scaleVoice = voice;
  }

  updateScaleAudio(deltaScale) {
    if (!this.ctx || !this.scaleVoice) return;
    const semitones = THREE.MathUtils.clamp(deltaScale * 9, -12, 12);
    const proximity = 1 - THREE.MathUtils.clamp(Math.abs(deltaScale) / 0.8, 0, 1);
    const now = this.ctx.currentTime;
    this.scaleVoice.oscillator.frequency.setTargetAtTime(523.25 * (2 ** (semitones / 12)), now, 0.18);
    this.scaleVoice.filter.frequency.setTargetAtTime(THREE.MathUtils.lerp(850, 4200, proximity), now, 0.18);
    this.scaleVoice.gain.gain.setTargetAtTime(0.035 + proximity * 0.04, now, 0.18);
  }

  stopScaleAudio() {
    if (!this.scaleVoice) return;
    this.fadeGuideVoice(this.scaleVoice);
    this.scaleVoice = null;
  }

  startDrag(letter) {
    if (!this.ctx || !letter || this.activeDragVoices.has(letter.id)) return;
    const oscillator = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(155, now);
    filter.type = 'lowpass';
    filter.frequency.value = 1150;
    filter.Q.value = 0.65;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.045);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.foleyBus);
    oscillator.start(now);
    this.activeDragVoices.set(letter.id, { oscillator, filter, gain });
  }

  updateDrag(letter, speed, stretch) {
    const voice = this.activeDragVoices.get(letter?.id);
    if (!this.ctx || !voice) return;
    const now = this.ctx.currentTime;
    const motion = THREE.MathUtils.clamp(speed / 24, 0, 1);
    const rate = THREE.MathUtils.clamp(165 + motion * 115 + stretch * 45, 150, 330);
    voice.oscillator.frequency.setTargetAtTime(rate, now, 0.055);
    voice.filter.frequency.setTargetAtTime(950 + motion * 1650 + stretch * 750, now, 0.08);
    voice.gain.gain.setTargetAtTime(0.018 + motion * 0.032, now, 0.07);
  }

  stopDrag(letter) {
    const voice = this.activeDragVoices.get(letter?.id);
    if (!this.ctx || !voice) return;
    const now = this.ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
    voice.gain.gain.linearRampToValueAtTime(0.0001, now + 0.13);
    voice.oscillator.stop(now + 0.16);
    voice.oscillator.onended = () => {
      voice.oscillator.disconnect();
      voice.filter.disconnect();
      voice.gain.disconnect();
    };
    this.activeDragVoices.delete(letter.id);
  }

  playDrop() {
    if (!this.ctx) return;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(390, now);
    oscillator.frequency.exponentialRampToValueAtTime(88, now + 0.32);
    oscillator.connect(gain);
    gain.connect(this.foleyBus);
    this.envelope(gain, now, 0.0001, 0.085, 0.36, 0.48);
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  playSparkle() {
    if (!this.ctx) return;
    [1046.5, 1568, 2093].forEach((frequency, index) => {
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + index * 0.025;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.connect(gain);
      gain.connect(this.foleyBus);
      this.envelope(gain, now, 0.0001, 0.026, 0.12, 0.28);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
    });
  }

  playParameterCheck(parameter) {
    if (!this.ctx) return;
    const roots = { position: 659.25, scale: 783.99, rotation: 987.77, color: 1046.5 };
    const root = roots[parameter];
    if (!root) return;
    if (this.ctx.state === 'suspended') {
      this.resume()
        .then(() => this.playParameterCheck(parameter))
        .catch((error) => console.warn('No se pudo reanudar el audio de confirmación.', error));
      return;
    }
    const now = this.ctx.currentTime;
    [root, root * 1.5].forEach((frequency, index) => {
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + index * 0.006;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.connect(gain);
      gain.connect(this.foleyBus);
      this.envelope(gain, start, 0.0001, index === 0 ? 0.1 : 0.065, 0.004, 0.14);
      oscillator.start(start);
      oscillator.stop(start + 0.15);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }

  playProgressDing() {
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 987.77].forEach((frequency, index) => {
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + index * 0.018;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.connect(gain);
      gain.connect(this.foleyBus);
      this.envelope(gain, now, 0.0001, 0.03, 0.12, 1.1);
      oscillator.start(now);
      oscillator.stop(now + 1.15);
    });
  }

  envelope(gain, start, floor, peak, attack, release) {
    gain.gain.setValueAtTime(floor, start);
    gain.gain.linearRampToValueAtTime(peak, start + attack);
    gain.gain.setValueAtTime(peak, start + Math.max(attack + 0.01, release - 0.08));
    gain.gain.linearRampToValueAtTime(0.0001, start + release);
  }

  fadeVoice(voice, duration = 0.12) {
    if (!this.ctx || !voice) return;
    const now = this.ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
    voice.gain.gain.linearRampToValueAtTime(0.0001, now + duration);
    voice.source.stop(now + duration + 0.02);
  }

  startFinalSong() {
    if (!this.ctx || !this.trackBuffer) return;
    this.stopFinalSong();

    const source = this.ctx.createBufferSource();
    source.buffer = this.trackBuffer;
    source.connect(this.musicBus);
    source.loop = false;

    const now = this.ctx.currentTime;
    this.letterBus.gain.cancelScheduledValues(now);
    this.letterBus.gain.setTargetAtTime(0.34, now, 0.08);
    this.foleyBus.gain.cancelScheduledValues(now);
    this.foleyBus.gain.setTargetAtTime(0.28, now, 0.08);
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setValueAtTime(0.0001, now);
    this.musicBus.gain.linearRampToValueAtTime(0.74, now + 2.2);
    this.ducked = true;

    source.start(now);
    this.trackSource = source;
    this.trackDuration = this.trackBuffer.duration;
    source.onended = () => {
      source.disconnect();
      const endedAt = this.ctx.currentTime;
      if (this.trackSource === source) this.trackSource = null;
      this.musicBus.gain.cancelScheduledValues(endedAt);
      this.musicBus.gain.setValueAtTime(Math.max(this.musicBus.gain.value, 0.0001), endedAt);
      this.musicBus.gain.linearRampToValueAtTime(0.0001, endedAt + 0.35);
      this.letterBus.gain.setTargetAtTime(0.92, endedAt, 0.12);
      this.foleyBus.gain.setTargetAtTime(0.54, endedAt, 0.12);
      this.ducked = false;
    };
  }

  stopFinalSong() {
    if (!this.trackSource || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setValueAtTime(Math.max(this.musicBus.gain.value, 0.0001), now);
    this.musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    const source = this.trackSource;
    source.onended = () => source.disconnect();
    source.stop(now + 0.42);
    this.trackSource = null;
    this.letterBus.gain.setTargetAtTime(0.92, now + 0.38, 0.12);
    this.foleyBus.gain.setTargetAtTime(0.54, now + 0.38, 0.12);
    this.ducked = false;
  }
}

class ABDApp {
  constructor() {
    this.canvas = document.getElementById('abdCanvas');
    this.paletteEl = document.getElementById('colorPalette');
    this.currentColorEl = document.getElementById('currentColor');
    this.statusText = document.getElementById('statusText');
    this.selectedColor = null;
    this.selectedLetter = null;
    this.draggedLetter = null;
    this.pressedLetter = null;
    this.pressCandidate = null;
    this.autoSolveTimeline = null;
    this.victoryTimeline = null;
    this.confirmedLetters = new Set();
    this.pointer = new THREE.Vector2();
    this.particlePointer = new THREE.Vector3(100, 100, -2.8);
    this.particlePointerActive = false;
    this.particlePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 2.8);
    this.raycaster = new THREE.Raycaster();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.state = 'playing';
    this.goalColors = this.createGoalColors();
    this.activeTool = 'select';
    this.letters = [];

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xfdf7ef, 8, 34);
    this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    this.camera.position.set(0, 0, 22);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.78;
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.transformControls = new TransformControls(this.camera, this.canvas);
    this.scene.add(this.transformControls.getHelper());
    this.transformControls.setSize(0.9);
    this.transformControls.addEventListener('dragging-changed', (event) => {
      if (event.value) {
        this.draggedLetter = null;
        if (this.selectedLetter) {
          this.selectedLetter.isPressed = true;
          this.selectedLetter.isInteracting = true;
          this.selectedLetter.isManualTransform = this.activeTool === 'scale' || this.activeTool === 'rotate';
          this.selectedLetter.scaleVelocity.set(0, 0, 0);
          gsap.killTweensOf(this.selectedLetter.mesh.scale);
          this.selectedLetter.scaleTweenActive = false;
          this.pressedLetter = this.selectedLetter;
          if (this.activeTool === 'move') this.audio.startMoveAudio(this.selectedLetter.id);
          if (this.activeTool === 'scale') this.audio.startScaleAudio(this.selectedLetter.id);
        }
        this.audio.startDrag(this.selectedLetter);
      } else if (this.selectedLetter) {
        this.selectedLetter.isPressed = false;
        this.selectedLetter.isInteracting = false;
        this.selectedLetter.isManualTransform = false;
        this.pressedLetter = null;
        this.audio.stopDrag(this.selectedLetter);
        this.audio.stopMoveAudio();
        this.audio.stopScaleAudio();
        this.audio.playDrop();
        this.playJellyBounce(this.selectedLetter, 0.18);
      }
    });
    this.transformControls.addEventListener('objectChange', () => this.syncSelectedTransform());

    this.loader = new FBXLoader();
    this.audio = new FrutigerAudioEngine();
    this.stickerManager = new HolographicStickerDOMManager({
      mount: document.getElementById('uiStickerField'),
    });

    this.buildPalette();
    this.setupLights();
    this.bindUI();
    this.resize();
    this.loadLetters();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildPalette() {
    PAINT_COLORS.forEach((color) => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'color-swatch';
      swatch.style.color = color;
      swatch.title = color;
      swatch.setAttribute('aria-label', `Seleccionar color ${color}`);
      swatch.addEventListener('click', () => {
        this.selectedColor = color;
        this.currentColorEl.style.backgroundColor = color;
        if (this.activeTool === 'paint') {
          this.statusText.textContent = `Balde · ${color} · toca una letra`;
        } else {
          this.statusText.textContent = `Color ${color} listo · activa el balde para pintar`;
        }
      });
      this.paletteEl.appendChild(swatch);
    });
  }

  createGoalColors(previousColors = {}) {
    const availableColors = [...PALETTE];
    return Object.fromEntries(LETTER_SEQUENCE.map((id) => {
      const choices = availableColors.filter((color) => color !== previousColors[id]);
      const color = choices[Math.floor(Math.random() * choices.length)];
      const colorIndex = availableColors.indexOf(color);
      availableColors.splice(colorIndex, 1);
      return [id, color];
    }));
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffe3b0, 1.8);
    keyLight.position.set(5, 8, 12);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x74d9ff, 0.7);
    rimLight.position.set(-8, 5, -6);
    this.scene.add(rimLight);

    const bounceLight = new THREE.PointLight(0xff6db7, 0.5, 18);
    bounceLight.position.set(0, -4, 7);
    this.scene.add(bounceLight);

    this.glitterLights = [
      new THREE.PointLight(0x28e4ff, 4.5, 18, 2),
      new THREE.PointLight(0xff31a8, 4, 18, 2),
      new THREE.PointLight(0xc8ff24, 3.5, 18, 2),
    ];
    this.glitterLights.forEach((light) => this.scene.add(light));
  }

  createBalloonMaterial(hexColor) {
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(hexColor),
      emissive: new THREE.Color(hexColor).multiplyScalar(0.08),
      emissiveIntensity: 0.4,
      roughness: 0.16,
      metalness: 0,
      transmission: 0.62,
      thickness: 1,
      ior: 1.2,
      clearcoat: 0.95,
      clearcoatRoughness: 0.1,
      attenuationColor: new THREE.Color(hexColor),
      attenuationDistance: 1.6,
      envMapIntensity: 0.85,
      transparent: false,
      opacity: 1,
    });

    material.onBeforeCompile = (shader) => {
      const fresnelVaryings = '\nvarying vec3 vABDBalloonWorldNormal;\nvarying vec3 vABDBalloonWorldPosition;';
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>${fresnelVaryings}`)
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvABDBalloonWorldNormal = normalize(mat3(modelMatrix) * objectNormal);')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvABDBalloonWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>${fresnelVaryings}`)
        .replace(
          '#include <output_fragment>',
          'float abdFresnel = pow(1.0 - max(dot(normalize(vABDBalloonWorldNormal), normalize(cameraPosition - vABDBalloonWorldPosition)), 0.0), 2.8);\noutgoingLight += vec3(0.82, 0.94, 1.0) * abdFresnel * 0.38;\n#include <output_fragment>',
        );
    };
    material.customProgramCacheKey = () => 'abd-balloon-fresnel-v1';
    return material;
  }

  createGlitterNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    const image = context.createImageData(512, 512);
    for (let index = 0; index < image.data.length; index += 4) {
      image.data[index] = 124 + Math.floor(Math.random() * 9);
      image.data[index + 1] = 124 + Math.floor(Math.random() * 9);
      image.data[index + 2] = 246 + Math.floor(Math.random() * 10);
      image.data[index + 3] = 255;
    }
    context.putImageData(image, 0, 0);

    for (let flake = 0; flake < 10; flake += 1) {
      const centerX = Math.random() * 512;
      const centerY = Math.random() * 512;
      const radius = 28 + Math.random() * 30;
      const sides = 4 + Math.floor(Math.random() * 4);
      let normalX = Math.random() * 1.1 - 0.55;
      let normalY = Math.random() * 1.1 - 0.55;
      const normalLength = Math.hypot(normalX, normalY);
      if (normalLength > 0.72) {
        normalX *= 0.72 / normalLength;
        normalY *= 0.72 / normalLength;
      }
      const normalZ = Math.sqrt(1 - normalX ** 2 - normalY ** 2);
      const normalColor = [normalX, normalY, normalZ]
        .map((component) => Math.round((component * 0.5 + 0.5) * 255));
      const rotation = Math.random() * Math.PI;
      context.beginPath();
      for (let side = 0; side < sides; side += 1) {
        const angle = rotation + side * Math.PI * 2 / sides;
        const distance = radius * (0.72 + Math.random() * 0.28);
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        if (side === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fillStyle = `rgb(${normalColor.join(',')})`;
      context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.colorSpace = THREE.NoColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  createGlitterAlbedoMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = '#b8b8b8';
    context.fillRect(0, 0, 512, 512);

    for (let flake = 0; flake < 8; flake += 1) {
      const centerX = Math.random() * 512;
      const centerY = Math.random() * 512;
      const radius = 22 + Math.random() * 16;
      const sides = 4 + Math.floor(Math.random() * 3);
      const rotation = Math.random() * Math.PI;
      context.beginPath();
      for (let side = 0; side < sides; side += 1) {
        const angle = rotation + side * Math.PI * 2 / sides;
        const distance = radius * (0.68 + Math.random() * 0.32);
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        if (side === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fillStyle = `rgba(255, 255, 255, ${0.72 + Math.random() * 0.28})`;
      context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  createDitherTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const context = canvas.getContext('2d');
    const pattern = [
      [0, 48, 12, 60, 3, 51, 15, 63],
      [32, 16, 44, 28, 35, 19, 47, 31],
      [8, 56, 4, 52, 11, 59, 7, 55],
      [40, 24, 36, 20, 43, 27, 39, 23],
      [2, 50, 14, 62, 1, 49, 13, 61],
      [34, 18, 46, 30, 33, 17, 45, 29],
      [10, 58, 6, 54, 9, 57, 5, 53],
      [42, 26, 38, 22, 41, 25, 37, 21],
    ];
    const image = context.createImageData(8, 8);

    pattern.forEach((row, y) => row.forEach((value, x) => {
      const index = (y * 8 + x) * 4;
      const gray = Math.round((0.5 + (value + 1) / 128) * 255);
      image.data[index] = gray;
      image.data[index + 1] = gray;
      image.data[index + 2] = gray;
      image.data[index + 3] = 255;
    }));
    context.putImageData(image, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  getTransformTarget(letter) {
    if (!letter) return null;
    return this.activeTool === 'scale' || this.activeTool === 'rotate' ? letter.mesh : letter.group;
  }

  syncSelectedTransform() {
    const letter = this.selectedLetter;
    if (!letter) return;
    letter.x = letter.group.position.x;
    letter.y = letter.group.position.y;
    const scaleX = letter.mesh.scale.x / letter.baseModelScale;
    const scaleY = letter.mesh.scale.y / letter.baseModelScale;
    const scaleZ = letter.mesh.scale.z / letter.baseModelScale;
    letter.restScale = (scaleX + scaleY + scaleZ) / 3;
    letter.scale = (scaleX + scaleY) * 0.5;
    letter.targetScale.set(scaleX, scaleY, scaleZ);
    letter.scaleVelocity.set(0, 0, 0);

    if (letter.audioPose) {
      const movement = letter.group.position.distanceTo(letter.audioPose.position);
      const angleDelta = (current, previous) => Math.atan2(Math.sin(current - previous), Math.cos(current - previous));
      const rotation = Math.hypot(
        angleDelta(letter.mesh.rotation.x, letter.audioPose.rotation.x),
        angleDelta(letter.mesh.rotation.y, letter.audioPose.rotation.y),
        angleDelta(letter.mesh.rotation.z, letter.audioPose.rotation.z),
      );
      const scaleChange = Math.max(
        Math.abs(scaleX - letter.audioPose.scale.x / letter.baseModelScale),
        Math.abs(scaleY - letter.audioPose.scale.y / letter.baseModelScale),
        Math.abs(scaleZ - letter.audioPose.scale.z / letter.baseModelScale),
      );
      const intensity = THREE.MathUtils.clamp(movement * 2 + rotation * 1.4 + scaleChange, 0, 1);
      this.audio.updateDrag(letter, movement * 24, intensity);
      this.audio.updateLetter(letter, this.getLetterProgress(letter));
      if (this.activeTool === 'move') {
        const goal = GOAL_POSITIONS[letter.id];
        this.audio.updateMoveAudio(Math.hypot(letter.group.position.x - goal.x, letter.group.position.y - goal.y));
      } else if (this.activeTool === 'scale') {
        this.audio.updateScaleAudio(letter.scale - TARGET_SCALE);
      }
      letter.audioPose.position.copy(letter.group.position);
      letter.audioPose.rotation.set(letter.mesh.rotation.x, letter.mesh.rotation.y, letter.mesh.rotation.z);
      letter.audioPose.scale.copy(letter.mesh.scale);
    }
  }

  async loadLetters() {
    const letterAssets = {
      A: publicAssetUrl('A.fbx'),
      B: publicAssetUrl('B.fbx'),
      D: publicAssetUrl('D.fbx'),
    };

    for (const id of LETTER_SEQUENCE) {
      const object = await this.loader.loadAsync(letterAssets[id]);
      const initialColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object);
      object.traverse((child) => {
        if (!(child.isMesh && child.material)) return;

        const material = this.createBalloonMaterial(initialColor);
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = material;
      });

      const initialScale = START_SCALES[id];
      const initialPosition = START_POSITIONS[id];
      const modelSize = bounds.getSize(new THREE.Vector3());
      const modelCenter = bounds.getCenter(new THREE.Vector3());
      const baseModelScale = 1.65 / Math.max(modelSize.x, modelSize.y, modelSize.z);
      object.position.set(-modelCenter.x, -bounds.min.y, -modelCenter.z);
      object.scale.z = 1.2;

      const letterGroup = new THREE.Group();
      const visualGroup = new THREE.Group();
      visualGroup.add(object);
      visualGroup.scale.setScalar(baseModelScale * initialScale);
      visualGroup.rotation.set(0, -Math.PI * 0.15, (Math.random() - 0.5) * 0.8);
      letterGroup.add(visualGroup);
      letterGroup.position.set(initialPosition.x, initialPosition.y, 0);

      const letter = {
        id,
        group: letterGroup,
        mesh: visualGroup,
        targetColor: new THREE.Color(initialColor),
        baseModelScale,
        modelSize,
        restScale: initialScale,
        wobbleSeed: Math.random() * Math.PI * 2,
        jellyAt: -10,
        jellyStrength: 0,
        isDragging: false,
        isPressed: false,
        isInteracting: false,
        isManualTransform: false,
        scaleTweenActive: false,
        correctParameters: new Set(),
        lastDragPoint: new THREE.Vector3(),
        dragOffset: new THREE.Vector3(),
        targetScale: new THREE.Vector3(initialScale, initialScale, initialScale),
        scaleVelocity: new THREE.Vector3(),
        locked: false,
        confirmedPose: null,
        x: initialPosition.x,
        y: initialPosition.y,
        scale: initialScale,
        color: initialColor,
        confirmationProgress: 0,
      };

      this.letters.push(letter);
      letter.audioPose = {
        position: letter.group.position.clone(),
        rotation: new THREE.Vector3(letter.mesh.rotation.x, letter.mesh.rotation.y, letter.mesh.rotation.z),
        scale: letter.mesh.scale.clone(),
      };
      this.scene.add(letterGroup);
    }

    this.scrambleLetters();

    await Promise.all([this.audio.loadLetterEffects(), this.audio.loadFinalTrack()]);
    this.bindCanvasInteraction();
    this.letters.forEach((letter) => this.applyColorToLetter(letter, letter.color));
    this.statusText.textContent = '3 letras · 1 lienzo';
  }

  randomBoardPosition(letterId) {
    let point;
    const home = GOAL_POSITIONS[letterId];
    do {
      point = { x: (Math.random() - 0.5) * 10.2, y: (Math.random() - 0.5) * 5.8 };
    } while (
      Math.hypot(point.x - home.x, point.y - home.y) < 1.8 ||
      this.letters.some((letter) => Math.hypot(point.x - letter.x, point.y - letter.y) < 2.6)
    );
    return point;
  }

  scrambleLetters() {
    if (!this.letters?.length) return;
    this.confirmedLetters.clear();
    const spawnScales = [0.6, 1.7, THREE.MathUtils.randFloat(0.85, 1.25)];
    for (let index = spawnScales.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [spawnScales[index], spawnScales[swapIndex]] = [spawnScales[swapIndex], spawnScales[index]];
    }

    const cameraDistance = Math.abs(this.camera.position.z);
    const frustumHalfHeight = Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * cameraDistance;
    const frustumHalfWidth = frustumHalfHeight * this.camera.aspect;
    const edgePadding = 0.4;

    this.letters.forEach((letter, index) => {
      gsap.killTweensOf(letter.group.position);
      gsap.killTweensOf(letter.mesh.scale);
      gsap.killTweensOf(letter, 'confirmationProgress');
      const randomX = THREE.MathUtils.randFloat(-Math.PI, Math.PI);
      const randomY = THREE.MathUtils.randFloat(-Math.PI, Math.PI);
      const randomZ = THREE.MathUtils.randFloat(-Math.PI, Math.PI);
      let scale = spawnScales[index];

      letter.group.position.set(0, 0, 0);
      letter.group.rotation.set(0, 0, 0);
      letter.mesh.rotation.set(randomX, randomY, randomZ);
      letter.mesh.scale.setScalar(letter.baseModelScale * scale);
      letter.group.updateMatrixWorld(true);
      let visualBounds = new THREE.Box3().setFromObject(letter.mesh);
      const availableWidth = Math.max(0.1, frustumHalfWidth * 2 - edgePadding * 2);
      const availableHeight = Math.max(0.1, frustumHalfHeight * 2 - edgePadding * 2);
      const fitRatio = Math.min(
        1,
        availableWidth / Math.max(visualBounds.max.x - visualBounds.min.x, 0.0001),
        availableHeight / Math.max(visualBounds.max.y - visualBounds.min.y, 0.0001),
      );
      scale = THREE.MathUtils.clamp(scale * fitRatio, 0.55, 1.7);
      letter.mesh.scale.setScalar(letter.baseModelScale * scale);
      letter.group.updateMatrixWorld(true);
      visualBounds = new THREE.Box3().setFromObject(letter.mesh);

      const nearestDistance = Math.max(this.camera.near + 0.1, this.camera.position.z - visualBounds.max.z);
      const halfHeight = Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * nearestDistance;
      const halfWidth = halfHeight * this.camera.aspect;
      const minX = -halfWidth + edgePadding - visualBounds.min.x;
      const maxX = halfWidth - edgePadding - visualBounds.max.x;
      const minY = -halfHeight + edgePadding - visualBounds.min.y;
      const maxY = halfHeight - edgePadding - visualBounds.max.y;
      const randX = THREE.MathUtils.clamp(THREE.MathUtils.randFloat(-halfWidth, halfWidth), minX, maxX);
      const randY = THREE.MathUtils.clamp(THREE.MathUtils.randFloat(-halfHeight, halfHeight), minY, maxY);

      letter.group.position.set(randX, randY, 0);
      letter.x = randX;
      letter.y = randY;
      letter.scale = scale;
      letter.restScale = scale;
      letter.targetScale.setScalar(scale);
      letter.isDragging = false;
      letter.isPressed = false;
      letter.isInteracting = false;
      letter.isManualTransform = false;
      letter.locked = false;
      letter.confirmedPose = null;
      letter.confirmationProgress = 0;
      letter.correctParameters.clear();
      letter.jellyStrength = 0;
      letter.jellyAt = -10;
      this.applyColorToLetter(letter, letter.color || PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    });
  }

  bindUI() {
    window.addEventListener('resize', () => this.resize());
    const helpButton = document.getElementById('helpMenuButton');
    const helpDropdown = document.getElementById('helpDropdown');
    const imageButton = document.getElementById('imageMenuButton');
    const imageDropdown = document.getElementById('imageMenuDropdown');
    const pistaModal = document.getElementById('pistaModal');
    const closePista = () => {
      if (pistaModal) pistaModal.hidden = true;
    };
    const closeImageMenu = () => {
      imageDropdown.hidden = true;
      imageButton.setAttribute('aria-expanded', 'false');
    };
    const closeHelp = () => {
      helpDropdown.hidden = true;
      helpButton.setAttribute('aria-expanded', 'false');
    };

    helpButton.addEventListener('click', (event) => {
      event.stopPropagation();
      closeImageMenu();
      helpDropdown.hidden = !helpDropdown.hidden;
      helpButton.setAttribute('aria-expanded', String(!helpDropdown.hidden));
    });
    helpDropdown.addEventListener('pointerdown', (event) => event.stopPropagation());
    imageButton.addEventListener('click', (event) => {
      event.stopPropagation();
      closeHelp();
      imageDropdown.hidden = !imageDropdown.hidden;
      imageButton.setAttribute('aria-expanded', String(!imageDropdown.hidden));
    });
    imageDropdown.addEventListener('pointerdown', (event) => event.stopPropagation());
    document.getElementById('openPistaButton').addEventListener('click', () => {
      closeImageMenu();
      if (pistaModal) pistaModal.hidden = false;
    });
    document.getElementById('closePistaModal').addEventListener('click', closePista);
    pistaModal.addEventListener('click', (event) => {
      if (event.target === pistaModal) closePista();
    });
    document.addEventListener('pointerdown', (event) => {
      if (!helpDropdown.hidden && !helpDropdown.contains(event.target) && !helpButton.contains(event.target)) closeHelp();
      if (!imageDropdown.hidden && !imageDropdown.contains(event.target) && !imageButton.contains(event.target)) closeImageMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeHelp();
        closeImageMenu();
        closePista();
      }
    });
    document.getElementById('autoSolveButton').addEventListener('click', () => {
      closeHelp();
      this.autoSolvePuzzle();
    });

    document.querySelectorAll('.tool-button').forEach((button) => {
      button.addEventListener('click', () => {
        const tool = button.dataset.tool;
        this.activeTool = tool;
        document.querySelectorAll('.tool-button').forEach((item) => item.classList.toggle('is-active', item === button));
        this.transformControls.showZ = tool !== 'move';
        this.transformControls.showE = tool !== 'rotate';
        this.transformControls.showXYZE = tool !== 'rotate';
        if (tool === 'paint') {
          this.transformControls.detach();
          this.statusText.textContent = this.selectedColor
            ? `Balde · ${this.selectedColor} · toca una letra`
            : 'Balde · selecciona un color y toca una letra';
          return;
        }
        if (tool === 'select') {
          this.transformControls.detach();
          this.statusText.textContent = this.selectedLetter ? `Letra ${this.selectedLetter.id} · arrastrar` : 'Seleccionar letra';
          return;
        }
        if (!this.selectedLetter) {
          this.statusText.textContent = 'Toca una letra para usar el gizmo';
          return;
        }
        this.transformControls.attach(this.getTransformTarget(this.selectedLetter));
        this.transformControls.setMode(tool === 'move' ? 'translate' : tool);
        this.statusText.textContent = `${this.selectedLetter.id} · ${tool === 'scale' ? 'escalar' : tool === 'rotate' ? 'rotar' : 'mover'}`;
      });
    });
  }

  bindCanvasInteraction() {
    this.canvas.addEventListener('pointermove', (event) => this.updateParticlePointer(event), { passive: true });
    this.canvas.addEventListener('pointerleave', () => { this.particlePointerActive = false; });
    this.canvas.addEventListener('pointerdown', (event) => {
      if (this.state !== 'playing' || this.autoSolveTimeline) return;
      if (this.transformControls.axis !== null) return;
      const hit = this.pickLetter(event);
      if (!hit) return;
      if (this.activeTool === 'paint') {
        if (!this.selectedColor) {
          this.statusText.textContent = 'Balde · selecciona un color primero';
          return;
        }
        this.applyColorToLetter(hit, this.selectedColor, true);
        this.statusText.textContent = `${hit.id} pintada de ${this.selectedColor}`;
        return;
      }
      this.selectedLetter = hit;
      this.pressedLetter = hit;
      hit.isPressed = true;
      this.audio.resume().then(() => {
        this.audio.playLetterSound(hit.id, hit, this.getLetterProgress(hit));
        this.audio.playGrab();
      });
      this.statusText.textContent = `Letra ${hit.id} seleccionada`;
      if (this.activeTool === 'select') {
        this.transformControls.detach();
        const pointerWorld = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.dragPlane, pointerWorld);
        this.pressCandidate = {
          letter: hit,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          dragOffset: hit.group.position.clone().sub(pointerWorld),
        };
      } else {
        this.transformControls.attach(this.getTransformTarget(hit));
        this.transformControls.setMode(this.activeTool === 'move' ? 'translate' : this.activeTool);
      }
    });

    this.canvas.addEventListener('pointermove', (event) => {
      if (this.pressCandidate && !this.draggedLetter) {
        const distance = Math.hypot(event.clientX - this.pressCandidate.startX, event.clientY - this.pressCandidate.startY);
        if (this.activeTool !== 'select' || distance < 6) return;
        const candidate = this.pressCandidate;
        this.pressCandidate = null;
        this.draggedLetter = candidate.letter;
        this.draggedLetter.dragOffset.copy(candidate.dragOffset);
        this.draggedLetter.isPressed = false;
        this.draggedLetter.isDragging = true;
        this.draggedLetter.isInteracting = true;
        this.draggedLetter.isManualTransform = false;
        this.draggedLetter.lastDragPoint.copy(this.draggedLetter.group.position);
        this.canvas.setPointerCapture(candidate.pointerId);
        this.audio.startMoveAudio(this.draggedLetter.id);
        this.audio.startDrag(this.draggedLetter);
      }
      if (!this.draggedLetter || this.transformControls.dragging) return;
      const rect = this.canvas.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      this.pointer.set(nx, ny);

      const next = new THREE.Vector3();
      this.raycaster.setFromCamera(this.pointer, this.camera);
      this.raycaster.ray.intersectPlane(this.dragPlane, next);
      next.add(this.draggedLetter.dragOffset);

      const dx = next.x - this.draggedLetter.lastDragPoint.x;
      const dy = next.y - this.draggedLetter.lastDragPoint.y;
      const speed = Math.hypot(dx, dy);
      const directionX = speed > 0 ? dx / speed : 0;
      const directionY = speed > 0 ? dy / speed : 0;
      const stretch = Math.min(speed * 0.22, 0.7);
      const squash = Math.min(speed * 0.1, 0.28);

      this.draggedLetter.group.position.set(next.x, next.y, 0);
      this.draggedLetter.lastDragPoint.copy(next);
      this.draggedLetter.x = next.x;
      this.draggedLetter.y = next.y;
      const moveGoal = GOAL_POSITIONS[this.draggedLetter.id];
      this.audio.updateMoveAudio(Math.hypot(next.x - moveGoal.x, next.y - moveGoal.y));
      const scaleX = this.draggedLetter.restScale * (1 + stretch * directionX ** 2 - squash * directionY ** 2);
      const scaleY = this.draggedLetter.restScale * (1 + stretch * directionY ** 2 - squash * directionX ** 2);
      this.draggedLetter.targetScale.set(scaleX, scaleY, this.draggedLetter.restScale);
      this.draggedLetter.scale = (scaleX + scaleY) * 0.5;
      const dragAmount = Math.min(speed * 3, 1);
      this.audio.updateDrag(this.draggedLetter, speed, dragAmount);
      this.audio.updateLetter(this.draggedLetter, this.getLetterProgress(this.draggedLetter));
    });

    const endPointer = () => {
      if (this.draggedLetter) {
        const letter = this.draggedLetter;
        letter.isDragging = false;
        letter.isPressed = false;
        letter.isInteracting = false;
        letter.targetScale.setScalar(letter.restScale);
        this.audio.stopDrag(letter);
        this.audio.stopMoveAudio();
        this.audio.playDrop();
        this.playJellyBounce(letter, 0.22);
        this.draggedLetter = null;
      } else if (this.pressedLetter && !this.transformControls.dragging) {
        const letter = this.pressedLetter;
        letter.isPressed = false;
        this.playJellyBounce(letter, 0.1);
      }
      this.pressCandidate = null;
      this.pressedLetter = null;
    };

    this.canvas.addEventListener('pointerup', endPointer);
    this.canvas.addEventListener('pointerleave', endPointer);
    this.canvas.addEventListener('pointercancel', endPointer);
  }

  pickLetter(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.pointer.set(x, y);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects(this.letters.map((letter) => letter.mesh), true);
    for (const intersection of intersections) {
      if (!intersection.object.isMesh) continue;
      for (let object = intersection.object; object; object = object.parent) {
        const letter = this.letters.find((item) => item.mesh === object);
        if (letter) {
          if (!letter.locked) return letter;
          break;
        }
      }
    }
    return null;
  }

  applyColorToLetter(letter, color, playSound = false) {
    if (!letter) return;
    const visualColor = this.getDisplayColor(color);
    letter.targetColor.copy(visualColor);
    letter.color = color;
    letter.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.copy(visualColor);
        child.material.emissive = new THREE.Color(color).multiplyScalar(0.18);
        child.material.emissiveIntensity = 0.42;
      }
    });
    if (playSound) {
      this.audio.resume().then(() => this.audio.playSparkle()).catch(() => {});
      this.playJellyBounce(letter, 0.11, 0.24);
    }
  }

  getDisplayColor(color) {
    const visualColor = new THREE.Color(color);
    const hsl = {};
    visualColor.getHSL(hsl);
    visualColor.setHSL(
      hsl.h,
      THREE.MathUtils.clamp(hsl.s, 0.92, 1),
      THREE.MathUtils.clamp(hsl.l, 0.42, 0.55),
    );
    return visualColor;
  }

  playJellyBounce(letter, amount = 0.14, driftX = 0.14) {
    if (!letter?.mesh || letter.isManualTransform) return;
    const baseScale = letter.baseModelScale * letter.restScale;
    const baseX = letter.group.position.x;
    gsap.killTweensOf(letter.mesh.scale);
    gsap.killTweensOf(letter.group.position);
    letter.scaleTweenActive = true;
    letter.scaleVelocity.set(0, 0, 0);
    letter.mesh.scale.setScalar(baseScale);

    gsap.timeline({
      onComplete: () => {
        letter.group.position.x = baseX;
        letter.mesh.scale.setScalar(baseScale);
        letter.targetScale.setScalar(letter.restScale);
        letter.scale = letter.restScale;
        letter.scaleTweenActive = false;
      },
    }).to(letter.group.position, {
      x: baseX + driftX,
      duration: 0.12,
      ease: 'power2.out',
    }, 0).to(letter.mesh.scale, {
      x: baseScale * (1 + amount),
      y: baseScale * (1 - amount * 0.72),
      z: baseScale * (1 + amount * 0.12),
      duration: 0.12,
      ease: 'power2.out',
    }, 0).to(letter.group.position, {
      x: baseX,
      duration: 0.55,
      ease: 'power3.out',
    }, 0.08).to(letter.mesh.scale, {
      x: baseScale,
      y: baseScale,
      z: baseScale,
      duration: 0.62,
      ease: 'elastic.out(1, 0.34)',
    }, 0.08);
  }

  autoSolvePuzzle() {
    if (this.state !== 'playing' || this.autoSolveTimeline || this.letters.length !== 3) return;

    this.state = 'autoSolving';
    this.canvas.style.pointerEvents = 'none';
    this.transformControls.detach();
    this.pressCandidate = null;
    this.pressedLetter = null;
    this.draggedLetter = null;
    this.selectedLetter = null;
    this.letters.forEach((letter) => {
      letter.isInteracting = false;
      letter.isManualTransform = false;
      letter.scaleTweenActive = true;
      letter.scaleVelocity.set(0, 0, 0);
    });
    this.statusText.textContent = 'Solucionador mágico…';
    const solveButton = document.getElementById('autoSolveButton');
    solveButton.disabled = true;

    const timeline = gsap.timeline({
      onComplete: () => {
        for (const letter of this.letters) {
          const target = GOAL_POSITIONS[letter.id];
          const targetScale = LETTER_TARGET_SCALES[letter.id];
          letter.group.position.set(target.x, target.y, 0);
          letter.mesh.rotation.set(GOAL_ROTATION.x, GOAL_ROTATION.y, GOAL_ROTATION.z);
          letter.mesh.scale.setScalar(letter.baseModelScale * targetScale);
          letter.x = target.x;
          letter.y = target.y;
          letter.scale = targetScale;
          letter.restScale = targetScale;
          letter.targetScale.setScalar(targetScale);
          letter.scaleVelocity.set(0, 0, 0);
          const goalColor = this.goalColors[letter.id];
          letter.color = goalColor;
          letter.targetColor.copy(this.getDisplayColor(goalColor));
          letter.isPressed = false;
          letter.isDragging = false;
          letter.isInteracting = false;
          letter.scaleTweenActive = false;
          this.applyColorToLetter(letter, goalColor);
          this.playLetterConfirmation(letter);
        }

        this.autoSolveTimeline = null;
        solveButton.disabled = false;
      },
    });
    this.autoSolveTimeline = timeline;

    LETTER_SEQUENCE.forEach((id, index) => {
      const letter = this.letters.find((item) => item.id === id);
      const goal = GOAL_POSITIONS[id];
      const startAt = index * 0.28;
      const targetColor = this.getDisplayColor(this.goalColors[id]);
      const colorStart = letter.targetColor.clone();
      const colorBlend = { progress: 0 };
      const baseScale = letter.baseModelScale * LETTER_TARGET_SCALES[id];
      const baseX = letter.group.position.x;

      timeline.to(letter.group.position, {
        x: goal.x + 0.34 + index * 0.18,
        y: goal.y + 0.28,
        z: 0,
        duration: 0.52,
        ease: 'power2.out',
      }, startAt);
      timeline.to(letter.mesh.scale, {
        x: baseScale * 1.7,
        y: baseScale * 0.66,
        z: baseScale * 1.3,
        duration: 0.18,
        ease: 'power2.out',
      }, startAt + 0.04).to(letter.mesh.scale, {
        x: baseScale,
        y: baseScale,
        z: baseScale,
        duration: 0.34,
        ease: 'elastic.out(1, 0.35)',
      }, startAt + 0.18);
      timeline.to(letter.group.position, {
        x: goal.x,
        y: goal.y,
        z: 0,
        duration: 0.7,
        ease: 'power3.inOut',
      }, startAt + 0.22);
      timeline.to(letter.mesh.rotation, {
        x: GOAL_ROTATION.x,
        y: GOAL_ROTATION.y,
        z: GOAL_ROTATION.z,
        duration: 0.65,
        ease: 'power2.inOut',
      }, startAt + 0.12);
      timeline.to(colorBlend, {
        progress: 1,
        duration: 0.9,
        ease: 'sine.inOut',
        onUpdate: () => {
          letter.targetColor.copy(colorStart).lerp(targetColor, colorBlend.progress);
          letter.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.color.copy(letter.targetColor);
              child.material.emissive = new THREE.Color(this.goalColors[letter.id]).multiplyScalar(0.04);
            }
          });
        },
      }, startAt + 0.1);
      timeline.to(letter.group.position, {
        x: baseX + 0.16,
        duration: 0.08,
        ease: 'power1.out',
      }, startAt + 0.32).to(letter.group.position, {
        x: goal.x,
        duration: 0.25,
        ease: 'power2.inOut',
      }, startAt + 0.38);
    });
  }

  getLetterProgress(letter, metrics = this.getLetterMetrics(letter)) {
    const { positionFit, scaleFit, rotationFit, colorFit } = metrics;
    return positionFit * 0.38 + scaleFit * 0.22 + rotationFit * 0.2 + colorFit * 0.2;
  }

  isLetterPoseCorrect(metrics) {
    return metrics.positionFit >= 1
      && metrics.scaleFit >= 1
      && metrics.rotationFit >= 1
      && metrics.colorFit >= 1;
  }

  updateTargetFeedback(letter, metrics = this.getLetterMetrics(letter)) {
    const checks = [
      ['position', metrics.positionFit],
      ['scale', metrics.scaleFit],
      ['rotation', metrics.rotationFit],
      ['color', metrics.colorFit],
    ];

    checks.forEach(([parameter, fit]) => {
      if (fit >= 1 && !letter.correctParameters.has(parameter)) {
        letter.correctParameters.add(parameter);
        this.audio.playParameterCheck(parameter);
      } else if (fit < 0.96) {
        letter.correctParameters.delete(parameter);
      }
    });
  }

  getLetterMetrics(letter) {
    const goal = GOAL_POSITIONS[letter.id];
    const positionError = Math.hypot(letter.group.position.x - goal.x, letter.group.position.y - goal.y);
    const rotationError = rotationDistance(letter.mesh.rotation, GOAL_ROTATION);
    const fitWithinTolerance = (error, tolerance, range) => 1 - THREE.MathUtils.clamp((error - tolerance) / (range - tolerance), 0, 1);

    return {
      positionFit: fitWithinTolerance(positionError, 0.8, 5.5),
      scaleFit: fitWithinTolerance(
        Math.abs(letter.scale - LETTER_TARGET_SCALES[letter.id]),
        0.18,
        LETTER_TARGET_SCALES[letter.id] * 0.8,
      ),
      rotationFit: fitWithinTolerance(rotationError, ROTATION_TOLERANCE, Math.PI),
      colorFit: fitWithinTolerance(colorDistance(letter.color, this.goalColors[letter.id]), 60, 441.7),
    };
  }

  playLetterConfirmation(letter) {
    if (letter.locked || !['playing', 'autoSolving'].includes(this.state)) return;
    letter.locked = true;
    letter.isInteracting = false;
    letter.isManualTransform = false;
    letter.isPressed = false;
    letter.confirmedPose = {
      groupPosition: letter.group.position.clone(),
      groupRotation: letter.group.rotation.clone(),
      meshPosition: letter.mesh.position.clone(),
      meshRotation: letter.mesh.rotation.clone(),
      meshScale: letter.mesh.scale.clone(),
      restScale: letter.restScale,
    };
    if (this.selectedLetter === letter) {
      this.transformControls.detach();
      this.selectedLetter = null;
    }
    this.audio.stopMoveAudio();
    this.audio.stopScaleAudio();
    this.audio.resume().then(() => this.audio.playSparkle()).catch(() => {});

    this.flashLetterGreen(letter);

    const basePosition = letter.group.position.clone();
    const baseScale = letter.mesh.scale.clone();
    gsap.killTweensOf(letter.group.position);
    gsap.killTweensOf(letter.mesh.scale);
    letter.scaleTweenActive = true;
    letter.scaleVelocity.set(0, 0, 0);
    gsap.timeline({
      onComplete: () => {
        letter.group.position.copy(basePosition);
        letter.mesh.rotation.copy(letter.confirmedPose.meshRotation);
        letter.mesh.position.copy(letter.confirmedPose.meshPosition);
        letter.mesh.scale.copy(baseScale);
        letter.targetScale.setScalar(letter.restScale);
        letter.scale = letter.restScale;
        letter.scaleTweenActive = false;
        this.confirmedLetters.add(letter.id);
        this.statusText.textContent = `${letter.id} confirmada · ${this.confirmedLetters.size}/${LETTER_SEQUENCE.length}`;
        if (this.confirmedLetters.size === LETTER_SEQUENCE.length) this.beginVictoryCycle();
      },
    }).to(letter.group.position, {
      y: basePosition.y + 0.34,
      duration: 0.13,
      ease: 'power2.out',
    }, 0).to(letter.mesh.scale, {
      x: baseScale.x * 1.08,
      y: baseScale.y * 0.94,
      z: baseScale.z * 1.04,
      duration: 0.13,
      ease: 'power2.out',
    }, 0).to(letter.group.position, {
      y: basePosition.y,
      duration: 0.24,
      ease: 'bounce.out',
    }, 0.13).to(letter.mesh.scale, {
      x: baseScale.x,
      y: baseScale.y,
      z: baseScale.z,
      duration: 0.24,
      ease: 'elastic.out(1, 0.42)',
    }, 0.13);
  }

  flashLetterGreen(letter) {
    letter.confirmationProgress = 1;
    gsap.killTweensOf(letter, 'confirmationProgress');
    gsap.to(letter, {
      confirmationProgress: 0,
      duration: 0.48,
      ease: 'power2.out',
    });
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(pixelRatio);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.stickerManager?.resize();
  }

  updateParticlePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.pointer.set(x, y);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.particlePointerActive = Boolean(this.raycaster.ray.intersectPlane(this.particlePlane, this.particlePointer));
  }

  beginVictoryCycle() {
    if (this.state === 'celebrating' || this.victoryTimeline) return;
    this.state = 'celebrating';
    this.victoryBackgroundIndex = null;
    this.canvas.style.pointerEvents = 'none';
    this.statusText.textContent = '¡Composición confirmada!';
    this.audio.playProgressDing();
    const songDuration = this.audio.trackBuffer?.duration ?? 10;
    const bounceDuration = 0.52;
    const bounceSpacing = 0.68;
    const bounceCount = Math.max(
      VICTORY_BOUNCE_ORDER.length,
      Math.floor((songDuration - bounceDuration) / bounceSpacing) + 1,
    );
    const confirmedPoses = new Map(this.letters.map((letter) => [
      letter.id,
      letter.confirmedPose ?? {
        groupPosition: letter.group.position.clone(),
        groupRotation: letter.group.rotation.clone(),
        meshPosition: letter.mesh.position.clone(),
        meshRotation: letter.mesh.rotation.clone(),
        meshScale: letter.mesh.scale.clone(),
        restScale: letter.restScale,
      },
    ]));

    const timeline = gsap.timeline({
      defaults: { ease: 'elastic.out(1, 0.42)' },
      onComplete: () => {
        this.victoryTimeline = null;
        this.letters.forEach((letter) => {
          const pose = confirmedPoses.get(letter.id);
          letter.group.position.copy(pose.groupPosition);
          letter.group.rotation.copy(pose.groupRotation);
          letter.mesh.position.copy(pose.meshPosition);
          letter.mesh.rotation.copy(pose.meshRotation);
          letter.mesh.scale.copy(pose.meshScale);
          letter.scale = pose.restScale;
          letter.restScale = pose.restScale;
          letter.targetScale.setScalar(pose.restScale);
          letter.scaleTweenActive = false;
        });
      },
    });
    this.victoryTimeline = timeline;
    timeline.to({}, { duration: songDuration }, 0);
    this.audio.resume().then(() => this.audio.startFinalSong()).catch(() => {});
    this.scheduleReset();

    for (let step = 0; step < bounceCount; step += 1) {
      const id = VICTORY_BOUNCE_ORDER[step % VICTORY_BOUNCE_ORDER.length];
      const letter = this.letters.find((item) => item.id === id);
      if (!letter) return;
      letter.scaleTweenActive = true;
      const pose = confirmedPoses.get(id);
      const home = pose.groupPosition;
      const offset = step * bounceSpacing;
      const baseScale = pose.meshScale;
      timeline.to(letter.mesh.scale, {
        x: baseScale.x * 1.16,
        y: baseScale.y * 0.84,
        z: baseScale.z * 1.04,
        duration: 0.16,
        ease: 'power2.out',
      }, offset).to(letter.mesh.scale, {
        x: baseScale.x,
        y: baseScale.y,
        z: baseScale.z,
        duration: bounceDuration - 0.16,
        ease: 'elastic.out(1, 0.36)',
      }, offset + 0.16);
      timeline.to(letter.group.position, {
        y: home.y + 0.46,
        duration: 0.16,
        ease: 'power2.out',
      }, offset).to(letter.group.position, {
        x: home.x,
        y: home.y,
        z: home.z,
        duration: bounceDuration - 0.16,
        ease: 'elastic.out(1, 0.42)',
      }, offset + 0.13);
    }

  }

  scheduleReset() {
    const trackDuration = this.audio.trackBuffer ? this.audio.trackBuffer.duration : 10;
    window.setTimeout(() => {
      this.resetChaos();
    }, (trackDuration + 0.6) * 1000);
  }

  resetChaos() {
    this.state = 'playing';
    this.canvas.style.pointerEvents = 'auto';
    const stage = document.querySelector('.stage-shell');
    stage.style.removeProperty('background-color');
    stage.style.removeProperty('--stage-dot-color');
    this.audio.stopMoveAudio();
    this.audio.stopScaleAudio();
    this.scrambleLetters();
    this.goalColors = this.createGoalColors(this.goalColors);
    this.statusText.textContent = 'Nueva ronda';
  }

  animate(now) {
    const elapsed = now * 0.001;
    this.stickerManager?.update(elapsed);
    if (this.state === 'celebrating') {
      const backgroundIndex = Math.floor(elapsed * 1.25) % PAINT_COLORS.length;
      if (backgroundIndex !== this.victoryBackgroundIndex) {
        const stage = document.querySelector('.stage-shell');
        const color = new THREE.Color(PAINT_COLORS[backgroundIndex]);
        const background = color.clone().lerp(new THREE.Color('#ffffff'), 0.82);
        stage.style.backgroundColor = `#${background.getHexString()}`;
        stage.style.setProperty(
          '--stage-dot-color',
          `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, 0.22)`,
        );
        this.victoryBackgroundIndex = backgroundIndex;
      }
    }
    this.glitterLights?.forEach((light, index) => {
      const phase = index * Math.PI * 2 / this.glitterLights.length;
      light.position.set(
        Math.cos(elapsed * 0.22 + phase) * 5.2,
        1 + Math.sin(elapsed * 0.31 + phase) * 2.8,
        3.5 + Math.sin(elapsed * 0.27 + phase) * 1.3,
      );
    });

    this.letters.forEach((letter, index) => {
      const metrics = this.getLetterMetrics(letter);
      const progress = this.getLetterProgress(letter, metrics);
      this.audio.updateLetter(letter, progress);
      if (this.state === 'playing' && !letter.locked && !letter.isInteracting && !letter.isPressed) {
        this.updateTargetFeedback(letter, metrics);
        if (this.isLetterPoseCorrect(metrics)) this.playLetterConfirmation(letter);
      }

      const goal = GOAL_POSITIONS[letter.id];
      const positionError = Math.hypot(letter.x - goal.x, letter.y - goal.y);
      const scaleError = Math.abs(letter.scale - TARGET_SCALE);
      const rotationError = Math.abs(Math.atan2(Math.sin(letter.mesh.rotation.z), Math.cos(letter.mesh.rotation.z)));
      const poseError = positionError + scaleError * 1.6 + rotationError * 0.65;
      const approach = THREE.MathUtils.smoothstep(poseError, 5.2, 0.18);
      const ditherOpacity = 0.82 + approach * 0.18;

      if (!letter.locked && !letter.isInteracting && !letter.scaleTweenActive && this.state === 'playing') {
        letter.group.position.y = letter.y + Math.sin(elapsed * 1.7 + letter.wobbleSeed) * 0.04;
        const age = elapsed - letter.jellyAt;
        const bounce = age >= 0 ? letter.jellyStrength * Math.exp(-age * 6.5) * Math.sin(age * 18) : 0;
        const breathing = Math.sin(elapsed * 1.7 + letter.wobbleSeed) * 0.012;
        letter.targetScale.set(
          letter.restScale * (1 + breathing + bounce),
          letter.restScale * (1 - breathing * 0.5 - bounce * 0.58),
          letter.restScale,
        );
      } else if (letter.locked && letter.confirmedPose && this.state === 'playing') {
        const hop = (Math.sin(elapsed * 5 + letter.wobbleSeed) + 1) * 0.5;
        letter.group.position.copy(letter.confirmedPose.groupPosition);
        letter.group.position.y += hop * 0.14;
        letter.mesh.scale.set(
          letter.confirmedPose.meshScale.x * (1 + hop * 0.025),
          letter.confirmedPose.meshScale.y * (1 - hop * 0.035),
          letter.confirmedPose.meshScale.z * (1 + hop * 0.012),
        );
      }

      if (this.state === 'celebrating') {
        const paletteIndex = Math.floor(elapsed * 1.25 + index * 3) % PAINT_COLORS.length;
        const victoryColor = new THREE.Color(PAINT_COLORS[paletteIndex]);
        const hsl = {};
        victoryColor.getHSL(hsl);
        victoryColor.setHSL(hsl.h, Math.max(hsl.s, 0.96), THREE.MathUtils.clamp(hsl.l, 0.42, 0.52));
        victoryColor.lerp(LETTER_CONFIRMATION_COLOR, letter.confirmationProgress);
        letter.mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.copy(victoryColor);
            child.material.emissive.copy(victoryColor).multiplyScalar(0.12);
            child.material.emissiveIntensity = 0.3;
          }
        });
      } else {
        letter.mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.opacity = ditherOpacity;
            const targetColor = new THREE.Color(letter.targetColor).lerp(LETTER_CONFIRMATION_COLOR, letter.confirmationProgress);
            child.material.color.lerp(targetColor, 0.12);
            child.material.emissive = targetColor.clone().multiplyScalar(0.24);
            child.material.emissiveIntensity = 0.35;
          }
        });
      }

      if (!letter.locked && !letter.isManualTransform && !letter.scaleTweenActive) {
        letter.scaleVelocity.x += (letter.targetScale.x - letter.mesh.scale.x / letter.baseModelScale) * 0.18;
        letter.scaleVelocity.y += (letter.targetScale.y - letter.mesh.scale.y / letter.baseModelScale) * 0.18;
        letter.scaleVelocity.z += (letter.targetScale.z - letter.mesh.scale.z / letter.baseModelScale) * 0.18;
        letter.scaleVelocity.multiplyScalar(0.72);
        letter.mesh.scale.x = Math.max(0.001, letter.mesh.scale.x + letter.scaleVelocity.x * letter.baseModelScale);
        letter.mesh.scale.y = Math.max(0.001, letter.mesh.scale.y + letter.scaleVelocity.y * letter.baseModelScale);
        letter.mesh.scale.z = Math.max(0.001, letter.mesh.scale.z + letter.scaleVelocity.z * letter.baseModelScale);
      }

      letter.scale = ((letter.mesh.scale.x + letter.mesh.scale.y) * 0.5) / letter.baseModelScale;
    });

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

const canvas = document.getElementById('abdCanvas');
canvas.__abdApp = new ABDApp();

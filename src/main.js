import './styles.css';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { gsap } from 'gsap';
import { HolographicStickerDOMManager } from './HolographicStickerDOMManager.js';
import { PALETTE, colorDistance, evaluateGoalState, resolveNextGoalColor } from './abdGameLogic.js';

const LETTER_SEQUENCE = ['A', 'B', 'D'];
const PAINT_COLORS = [
  '#ff5a1f', '#ff8738', '#ff1688', '#ff57ad', '#ffe600',
  '#fff36a', '#a8ed00', '#64ce16', '#075bff', '#2aa8ff',
  '#19d9dc', '#713cff', '#f9f1dc', '#3d3046', '#1b2434',
];
const GOAL_POSITIONS = {
  A: { x: -1.15, y: -0.12 },
  B: { x: 0.05, y: -0.12 },
  D: { x: 1.28, y: -0.12 },
};
const START_POSITIONS = {
  A: { x: -4.4, y: -2.1 },
  B: { x: 0, y: 0.1 },
  D: { x: 4.4, y: -2.1 },
};
const START_SCALES = { A: 0.72, B: 0.88, D: 0.66 };

class AudioManager {
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

  async loadLetterEffects() {
    if (!this.ctx) return;
    const audioUrls = {
      A: '/a.MP3',
      B: '/b.MP3',
      D: '/d.MP3',
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

  async loadFinalTrack() {
    if (!this.ctx) return null;
    try {
      const response = await fetch('/cansioncita fina.MP3');
      if (!response.ok) return null;
      this.trackBuffer = await this.ctx.decodeAudioData((await response.arrayBuffer()).slice(0));
      return this.trackBuffer;
    } catch (error) {
      console.warn('No se pudo cargar la canción final.', error);
      return null;
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
    const scalePitch = 1.04 - ((letter?.scale ?? 1) - 1) * 0.22;
    const playbackRate = THREE.MathUtils.clamp(scalePitch, 0.85, 1.25);
    const now = this.ctx.currentTime;
    const duration = buffer.duration / playbackRate;

    source.buffer = buffer;
    source.playbackRate.setValueAtTime(playbackRate, now);
    filter.type = 'lowpass';
    const sizeCutoff = THREE.MathUtils.clamp(5700 - ((letter?.scale ?? 1) - 1) * 2600, 900, 6000);
    const startCutoff = sizeCutoff * 0.42;
    filter.frequency.setValueAtTime(THREE.MathUtils.lerp(startCutoff, sizeCutoff, progress), now);
    filter.Q.setValueAtTime(0.7 + progress * 0.8 + Math.max(0, 1 - (letter?.scale ?? 1)) * 0.35, now);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.letterBus);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.58, now + 0.035);
    gain.gain.setValueAtTime(0.58, now + Math.max(0.06, duration - 0.09));
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);

    const voice = { source, filter, gain, playbackRate };
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

    // Position, scale, and color errors normalize to progress; progress opens the filter toward the scale-specific target cutoff.
    const now = this.ctx.currentTime;
    const sizeCutoff = THREE.MathUtils.clamp(5700 - ((letter.scale || 1) - 1) * 2600, 900, 6000);
    const closedCutoff = sizeCutoff * 0.42;
    const cutoff = THREE.MathUtils.lerp(closedCutoff, sizeCutoff, progress);
    const sizeResonance = Math.max(0, 1 - (letter.scale || 1)) * 0.35;
    voice.filter.frequency.setTargetAtTime(cutoff, now, 0.12);
    voice.filter.Q.setTargetAtTime(0.7 + progress * 0.8 + sizeResonance, now, 0.14);
  }

  playGrab() {
    if (!this.ctx) return;
    const oscillator = this.ctx.createOscillator();
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(520, now);
    oscillator.frequency.exponentialRampToValueAtTime(190, now + 0.12);
    oscillator.connect(gain);
    gain.connect(this.foleyBus);
    this.envelope(gain, now, 0.0001, 0.075, 0.035, 0.19);
    oscillator.start(now);
    oscillator.stop(now + 0.19);
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
    this.pointer = new THREE.Vector2();
    this.particlePointer = new THREE.Vector3(100, 100, -2.8);
    this.particlePointerActive = false;
    this.particlePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 2.8);
    this.raycaster = new THREE.Raycaster();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.state = 'playing';
    this.goalColor = resolveNextGoalColor(PALETTE);
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
    this.clayGrain = this.createSurfaceTexture();
    this.ditherMap = this.createDitherTexture();
    this.transformControls = new TransformControls(this.camera, this.canvas);
    this.scene.add(this.transformControls.getHelper());
    this.transformControls.setSize(0.9);
    this.transformControls.addEventListener('dragging-changed', (event) => {
      if (event.value) {
        this.draggedLetter = null;
        if (this.selectedLetter) {
          this.selectedLetter.isPressed = true;
          this.pressedLetter = this.selectedLetter;
        }
        this.audio.startDrag(this.selectedLetter);
      } else if (this.selectedLetter) {
        this.selectedLetter.isPressed = false;
        this.pressedLetter = null;
        this.audio.stopDrag(this.selectedLetter);
        this.audio.playDrop();
        this.playJellyBounce(this.selectedLetter, 0.18);
      }
    });
    this.transformControls.addEventListener('objectChange', () => this.syncSelectedTransform());

    this.loader = new FBXLoader();
    this.audio = new AudioManager();
    this.stickerManager = new HolographicStickerDOMManager({
      mount: document.getElementById('uiStickerField'),
    });

    this.buildPalette();
    this.setupLights();
    this.createPlayroom();
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
        this.paletteEl.querySelectorAll('.color-swatch').forEach((button) => button.classList.toggle('is-selected', button === swatch));
        if (this.selectedLetter) this.applyColorToLetter(this.selectedLetter, color, true);
      });
      this.paletteEl.appendChild(swatch);
    });
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.68);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffd99b, 1.55);
    keyLight.position.set(5, 8, 12);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x18cfff, 0.58);
    rimLight.position.set(-8, 5, -6);
    this.scene.add(rimLight);

    const bounceLight = new THREE.PointLight(0xff3b9d, 0.32, 18);
    bounceLight.position.set(0, -4, 7);
    this.scene.add(bounceLight);
  }

  createSurfaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    const image = context.createImageData(64, 64);

    for (let index = 0; index < image.data.length; index += 4) {
      const grain = 178 + Math.floor(Math.random() * 64);
      image.data[index] = grain;
      image.data[index + 1] = grain;
      image.data[index + 2] = grain;
      image.data[index + 3] = 255;
    }
    context.putImageData(image, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
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

  createPlayroom() {
    const particleCount = 28;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const angle = index * 2.39996;
      const radius = Math.sqrt((index + 0.5) / particleCount);
      const x = Math.cos(angle) * radius * 7.3;
      const y = Math.sin(angle) * radius * 4;
      const color = new THREE.Color(PAINT_COLORS[index % PAINT_COLORS.length]);
      positions.set([x, y, -2.8], index * 3);
      colors.set([color.r, color.g, color.b], index * 3);
      phases[index] = index * 0.73;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.confetti = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
      size: 0.075,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    }));
    this.confetti.userData = { basePositions: positions.slice(), phases, velocities };
    this.scene.add(this.confetti);

    const doodlePositions = [
      [-6.5, 3.1], [-2.3, 3.55], [5.2, 3.35], [6.65, 2.2],
      [-6.7, -2.9], [-2.4, -3.65], [5.1, -3.35], [6.55, -2.5],
    ];
    this.doodleObjects = [];
    doodlePositions.forEach(([x, y], index) => {
      const material = new THREE.MeshPhysicalMaterial({
        color: PAINT_COLORS[(index * 3 + 2) % PAINT_COLORS.length],
        roughness: 0.42,
        clearcoat: 0.48,
        clearcoatRoughness: 0.28,
      });
      const geometry = index % 3 === 0
        ? new THREE.TorusGeometry(0.2, 0.055, 8, 20)
        : index % 3 === 1
          ? new THREE.OctahedronGeometry(0.19, 0)
          : new THREE.SphereGeometry(0.15, 14, 10);
      const doodle = new THREE.Mesh(geometry, material);
      doodle.position.set(x, y, -1.8);
      doodle.rotation.z = index * 0.73;
      doodle.userData = {
        baseY: y,
        phase: index * 0.91,
        spin: (index % 2 ? 1 : -1) * (0.001 + index * 0.00012),
      };
      this.doodleObjects.push(doodle);
      this.scene.add(doodle);
    });
  }

  syncSelectedTransform() {
    const letter = this.selectedLetter;
    if (!letter) return;
    letter.x = letter.mesh.position.x;
    letter.y = letter.mesh.position.y;
    const scaleX = letter.mesh.scale.x / letter.baseModelScale;
    const scaleY = letter.mesh.scale.y / letter.baseModelScale;
    const scaleZ = letter.mesh.scale.z / letter.baseModelScale;
    letter.restScale = (scaleX + scaleY + scaleZ) / 3;
    letter.scale = (scaleX + scaleY) * 0.5;
    letter.targetScale.set(scaleX, scaleY, scaleZ);

    if (letter.audioPose) {
      const movement = letter.mesh.position.distanceTo(letter.audioPose.position);
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
      letter.audioPose.position.copy(letter.mesh.position);
      letter.audioPose.rotation.set(letter.mesh.rotation.x, letter.mesh.rotation.y, letter.mesh.rotation.z);
      letter.audioPose.scale.copy(letter.mesh.scale);
    }
  }

  async loadLetters() {
    const letterAssets = {
      A: '/A.fbx',
      B: '/B.fbx',
      D: '/D.fbx',
    };

    for (const id of LETTER_SEQUENCE) {
      const object = await this.loader.loadAsync(letterAssets[id]);
      object.traverse((child) => {
        if (!(child.isMesh && child.material)) return;
        const sourceMaterial = Array.isArray(child.material) ? child.material[0] : child.material;
        const baseMap = sourceMaterial?.map || null;

        const material = new THREE.MeshPhysicalMaterial({
          map: baseMap,
          color: new THREE.Color('#ffffff'),
          roughness: 0.36,
          roughnessMap: this.clayGrain,
          bumpMap: this.clayGrain,
          bumpScale: 0.035,
          metalness: 0,
          clearcoat: 0.56,
          clearcoatRoughness: 0.24,
          transmission: 0.015,
          thickness: 0.28,
          reflectivity: 0.52,
          envMapIntensity: 0.72,
          alphaMap: this.ditherMap,
          alphaTest: 0.5,
          transparent: false,
          opacity: 0.82,
        });

        child.castShadow = true;
        child.receiveShadow = true;
        child.material = material;
      });

      const initialScale = START_SCALES[id];
      const initialPosition = START_POSITIONS[id];
      const initialColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object);
      const modelSize = bounds.getSize(new THREE.Vector3());
      const modelCenter = bounds.getCenter(new THREE.Vector3());
      const baseModelScale = 1.65 / Math.max(modelSize.x, modelSize.y, modelSize.z);
      object.position.sub(modelCenter);
      object.scale.z = 1.2;

      const letterGroup = new THREE.Group();
      letterGroup.add(object);
      letterGroup.scale.setScalar(baseModelScale * initialScale);
      letterGroup.rotation.set(0, -Math.PI * 0.15, (Math.random() - 0.5) * 0.8);
      letterGroup.position.set(initialPosition.x, initialPosition.y, 0);

      const letter = {
        id,
        mesh: letterGroup,
        targetColor: new THREE.Color(initialColor),
        baseModelScale,
        restScale: initialScale,
        wobbleSeed: Math.random() * Math.PI * 2,
        jellyAt: -10,
        jellyStrength: 0,
        spinVelocity: 0,
        isDragging: false,
        isPressed: false,
        scaleTweenActive: false,
        lastDragPoint: new THREE.Vector3(),
        dragOffset: new THREE.Vector3(),
        targetScale: new THREE.Vector3(initialScale, initialScale, initialScale),
        scaleVelocity: new THREE.Vector3(),
        x: initialPosition.x,
        y: initialPosition.y,
        scale: initialScale,
        color: initialColor,
        solved: false,
      };

      this.letters.push(letter);
      letter.audioPose = {
        position: letter.mesh.position.clone(),
        rotation: new THREE.Vector3(letter.mesh.rotation.x, letter.mesh.rotation.y, letter.mesh.rotation.z),
        scale: letter.mesh.scale.clone(),
      };
      this.scene.add(letterGroup);
    }

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

  bindUI() {
    window.addEventListener('resize', () => this.resize());
    const helpButton = document.getElementById('helpMenuButton');
    const helpDropdown = document.getElementById('helpDropdown');
    const closeHelp = () => {
      helpDropdown.hidden = true;
      helpButton.setAttribute('aria-expanded', 'false');
    };

    helpButton.addEventListener('click', (event) => {
      event.stopPropagation();
      helpDropdown.hidden = !helpDropdown.hidden;
      helpButton.setAttribute('aria-expanded', String(!helpDropdown.hidden));
    });
    helpDropdown.addEventListener('pointerdown', (event) => event.stopPropagation());
    document.addEventListener('pointerdown', (event) => {
      if (!helpDropdown.hidden && !helpDropdown.contains(event.target) && !helpButton.contains(event.target)) closeHelp();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeHelp();
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
        if (tool === 'select') {
          this.transformControls.detach();
          this.statusText.textContent = this.selectedLetter ? `Letra ${this.selectedLetter.id} · arrastrar` : 'Seleccionar letra';
          return;
        }
        if (!this.selectedLetter) {
          this.statusText.textContent = 'Toca una letra para usar el gizmo';
          return;
        }
        this.transformControls.attach(this.selectedLetter.mesh);
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
      this.selectedLetter = hit;
      this.pressedLetter = hit;
      hit.isPressed = true;
      this.audio.resume().then(() => {
        this.audio.playLetterSound(hit.id, hit, this.getLetterProgress(hit));
        this.audio.playGrab();
      });
      if (this.selectedColor) this.applyColorToLetter(hit, this.selectedColor);
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
          dragOffset: hit.mesh.position.clone().sub(pointerWorld),
        };
      } else {
        this.transformControls.attach(hit.mesh);
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
        this.draggedLetter.lastDragPoint.copy(this.draggedLetter.mesh.position);
        this.canvas.setPointerCapture(candidate.pointerId);
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

      this.draggedLetter.mesh.position.set(next.x, next.y, 0);
      this.draggedLetter.lastDragPoint.copy(next);
      this.draggedLetter.x = next.x;
      this.draggedLetter.y = next.y;
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
        letter.targetScale.setScalar(letter.restScale);
        this.audio.stopDrag(letter);
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
    const mesh = intersections.find((entry) => entry.object.isMesh);
    if (!mesh) return null;
    for (let object = mesh.object; object; object = object.parent) {
      const letter = this.letters.find((item) => item.mesh === object);
      if (letter) return letter;
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
        child.material.emissive = new THREE.Color(color).multiplyScalar(0.012);
        child.material.emissiveIntensity = 0.1;
      }
    });
    if (playSound) {
      this.audio.resume().then(() => this.audio.playSparkle()).catch(() => {});
      this.playJellyBounce(letter, 0.11);
    }
  }

  getDisplayColor(color) {
    const visualColor = new THREE.Color(color);
    const hsl = {};
    visualColor.getHSL(hsl);
    visualColor.setHSL(
      hsl.h,
      THREE.MathUtils.clamp(hsl.s * 1.32, 0, 1),
      THREE.MathUtils.clamp(hsl.l * 0.78, 0.24, 0.58),
    );
    return visualColor;
  }

  playJellyBounce(letter, amount = 0.14) {
    if (!letter?.mesh) return;
    const baseScale = letter.baseModelScale * letter.restScale;
    gsap.killTweensOf(letter.mesh.scale);
    letter.scaleTweenActive = true;
    letter.mesh.scale.setScalar(baseScale);

    gsap.timeline({
      onComplete: () => {
        letter.mesh.scale.setScalar(baseScale);
        letter.targetScale.setScalar(letter.restScale);
        letter.scale = letter.restScale;
        letter.scaleTweenActive = false;
      },
    }).to(letter.mesh.scale, {
      x: baseScale * (1 + amount),
      y: baseScale * (1 - amount * 0.72),
      z: baseScale * (1 + amount * 0.12),
      duration: 0.12,
      ease: 'power2.out',
    }).to(letter.mesh.scale, {
      x: baseScale,
      y: baseScale,
      z: baseScale,
      duration: 0.62,
      ease: 'elastic.out(1, 0.34)',
    });
  }

  autoSolvePuzzle() {
    if (this.state !== 'playing' || this.autoSolveTimeline || this.letters.length !== 3) return;

    this.state = 'autoSolving';
    this.canvas.style.pointerEvents = 'none';
    this.transformControls.detach();
    this.pressCandidate = null;
    this.pressedLetter = null;
    this.draggedLetter = null;
    this.statusText.textContent = 'Solucionador mágico…';
    const solveButton = document.getElementById('autoSolveButton');
    solveButton.disabled = true;

    const timeline = gsap.timeline({
      onComplete: () => {
        for (const letter of this.letters) {
          const target = GOAL_POSITIONS[letter.id];
          letter.mesh.position.set(target.x, target.y, 0);
          letter.mesh.rotation.set(0, -Math.PI * 0.15, 0);
          letter.mesh.scale.setScalar(letter.baseModelScale);
          letter.x = target.x;
          letter.y = target.y;
          letter.scale = 1;
          letter.restScale = 1;
          letter.targetScale.setScalar(1);
          letter.scaleVelocity.set(0, 0, 0);
          letter.color = this.goalColor;
          letter.targetColor.copy(this.getDisplayColor(this.goalColor));
          letter.isPressed = false;
          letter.isDragging = false;
          letter.scaleTweenActive = false;
          letter.solved = true;
          this.applyColorToLetter(letter, this.goalColor);
        }

        this.state = 'playing';
        this.canvas.style.pointerEvents = 'auto';
        solveButton.disabled = false;
        this.statusText.textContent = 'Composición lista';
        this.checkWinCondition();
      },
    });
    this.autoSolveTimeline = timeline;

    LETTER_SEQUENCE.forEach((id, index) => {
      const letter = this.letters.find((item) => item.id === id);
      const goal = GOAL_POSITIONS[id];
      const startAt = index * 0.3;
      const targetColor = this.getDisplayColor(this.goalColor);
      const colorStart = letter.targetColor.clone();
      const colorBlend = { progress: 0 };
      const scale = letter.baseModelScale;

      timeline.to(letter.mesh.position, {
        x: goal.x,
        y: goal.y,
        z: 0,
        duration: 0.95,
        ease: 'power3.inOut',
      }, startAt);
      timeline.to(letter.mesh.rotation, {
        x: 0,
        y: -Math.PI * 0.15,
        z: 0,
        duration: 0.85,
        ease: 'power2.inOut',
      }, startAt);
      timeline.to(letter.mesh.scale, {
        x: scale,
        y: scale,
        z: scale,
        duration: 0.9,
        ease: 'back.out(1.25)',
      }, startAt);
      timeline.to(colorBlend, {
        progress: 1,
        duration: 0.85,
        ease: 'sine.inOut',
        onUpdate: () => letter.targetColor.copy(colorStart).lerp(targetColor, colorBlend.progress),
      }, startAt);
    });
  }

  getLetterProgress(letter) {
    const goal = GOAL_POSITIONS[letter.id];
    const positionError = Math.hypot(letter.x - goal.x, letter.y - goal.y);
    const positionFit = 1 - THREE.MathUtils.clamp(positionError / 4.5, 0, 1);
    const scaleFit = 1 - THREE.MathUtils.clamp(Math.abs(letter.scale - 1) / 0.55, 0, 1);
    const colorFit = 1 - THREE.MathUtils.clamp(colorDistance(letter.color, this.goalColor) / 360, 0, 1);
    return positionFit * 0.5 + scaleFit * 0.28 + colorFit * 0.22;
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
    if (this.state === 'celebrating') return;
    this.state = 'celebrating';
    this.canvas.style.pointerEvents = 'none';

    const timeline = gsap.timeline({
      defaults: { ease: 'elastic.out(1, 0.45)', duration: 0.8 },
      onComplete: () => {
        this.audio.startFinalSong();
        this.scheduleReset();
      },
    });

    LETTER_SEQUENCE.forEach((id, index) => {
      const letter = this.letters.find((item) => item.id === id);
      if (!letter) return;
      const home = GOAL_POSITIONS[id];
      const offset = index === 0 ? 0 : index * 0.18;
      timeline.to(letter.mesh.position, {
        x: home.x,
        y: home.y + 2.2,
        z: 0,
        duration: 0.42,
        ease: 'power2.out',
      }, offset).to(letter.mesh.position, {
        x: home.x,
        y: home.y,
        z: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.4)',
      }, `>-${0.08}`);
    });

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

    for (const letter of this.letters) {
      const { x, y } = this.randomBoardPosition(letter.id);
      letter.mesh.position.set(x, y, 0);
      letter.mesh.rotation.set(0, -Math.PI * 0.15, (Math.random() - 0.5) * 0.8);
      letter.restScale = 0.62 + Math.random() * 0.3;
      letter.mesh.scale.setScalar(letter.baseModelScale * letter.restScale);
      letter.x = x;
      letter.y = y;
      letter.scale = letter.restScale;
      letter.targetScale.setScalar(letter.restScale);
      letter.isDragging = false;
      letter.solved = false;
      letter.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.applyColorToLetter(letter, letter.color);
    }

    this.goalColor = resolveNextGoalColor(PALETTE);
    this.statusText.textContent = 'Nueva ronda';
  }

  checkWinCondition() {
    if (this.state !== 'playing') return;

    const ready = evaluateGoalState({
      letters: this.letters.map((letter) => ({
        id: letter.id,
        x: letter.x,
        y: letter.y,
        scale: letter.scale,
        color: letter.color,
      })),
      objective: { color: this.goalColor },
      positions: {
        A: GOAL_POSITIONS.A,
        B: GOAL_POSITIONS.B,
        D: GOAL_POSITIONS.D,
      },
      targetScale: 1,
      tolerance: 0.8,
    });

    if (ready) {
      this.beginVictoryCycle();
    }
  }

  animate(now) {
    const elapsed = now * 0.001;
    this.stickerManager?.update(elapsed);

    if (this.confetti) {
      const positions = this.confetti.geometry.attributes.position;
      const { basePositions, phases, velocities } = this.confetti.userData;
      const delta = this.particleLastTime
        ? THREE.MathUtils.clamp((now - this.particleLastTime) / 1000, 0.001, 0.04)
        : 1 / 60;
      this.particleLastTime = now;
      const repulsionRadius = 2.25;
      const springStrength = 3.1;
      const damping = Math.exp(-2.8 * delta);

      for (let index = 0; index < phases.length; index += 1) {
        const offset = index * 3;
        const x = positions.array[offset];
        const y = positions.array[offset + 1];
        const baseX = basePositions[offset];
        const baseY = basePositions[offset + 1];
        let forceX = 0;
        let forceY = 0;

        if (this.particlePointerActive) {
          const dx = x - this.particlePointer.x;
          const dy = y - this.particlePointer.y;
          const distanceSquared = dx * dx + dy * dy;
          const gaussian = Math.exp(-distanceSquared / (2 * repulsionRadius * repulsionRadius));
          const distance = Math.sqrt(Math.max(distanceSquared, 0.0001));
          const safeDx = distanceSquared < 0.0001 ? Math.cos(phases[index]) : dx / distance;
          const safeDy = distanceSquared < 0.0001 ? Math.sin(phases[index]) : dy / distance;
          forceX = safeDx * gaussian * 42;
          forceY = safeDy * gaussian * 42;
        }

        const noiseX = Math.sin(elapsed * 0.58 + phases[index] + baseY * 0.42) * 0.75
          + Math.sin(elapsed * 0.31 + baseX * 0.35) * 0.38;
        const noiseY = Math.cos(elapsed * 0.52 + phases[index] + baseX * 0.4) * 0.7
          + Math.cos(elapsed * 0.28 + baseY * 0.32) * 0.34;

        velocities[offset] += ((baseX - x) * springStrength + forceX + noiseX) * delta;
        velocities[offset + 1] += ((baseY - y) * springStrength + forceY + noiseY) * delta;
        velocities[offset] *= damping;
        velocities[offset + 1] *= damping;
        positions.array[offset] = x + velocities[offset] * delta;
        positions.array[offset + 1] = y + velocities[offset + 1] * delta;
      }
      positions.needsUpdate = true;
    }
    this.doodleObjects?.forEach((doodle) => {
      doodle.position.y = doodle.userData.baseY + Math.sin(elapsed * 0.8 + doodle.userData.phase) * 0.08;
      doodle.rotation.z += doodle.userData.spin;
    });

    this.letters.forEach((letter, index) => {
      const progress = this.getLetterProgress(letter);
      this.audio.updateLetter(letter, progress);
      if (progress >= 0.985 && !letter.solved) {
        letter.solved = true;
        this.audio.playProgressDing();
      } else if (progress < 0.8) {
        letter.solved = false;
      }

      const goal = GOAL_POSITIONS[letter.id];
      const positionError = Math.hypot(letter.x - goal.x, letter.y - goal.y);
      const scaleError = Math.abs(letter.scale - 1);
      const rotationError = Math.abs(Math.atan2(Math.sin(letter.mesh.rotation.z), Math.cos(letter.mesh.rotation.z)));
      const poseError = positionError + scaleError * 1.6 + rotationError * 0.65;
      const approach = THREE.MathUtils.smoothstep(poseError, 5.2, 0.18);
      const ditherOpacity = 0.82 + approach * 0.18;

      if (!letter.isDragging && this.state === 'playing') {
        letter.x = letter.mesh.position.x;
        letter.y = letter.mesh.position.y;
        const age = elapsed - letter.jellyAt;
        const bounce = age >= 0 ? letter.jellyStrength * Math.exp(-age * 6.5) * Math.sin(age * 18) : 0;
        const breathing = Math.sin(elapsed * 1.7 + letter.wobbleSeed) * 0.012;
        letter.targetScale.set(
          letter.restScale * (1 + breathing + bounce),
          letter.restScale * (1 - breathing * 0.5 - bounce * 0.58),
          letter.restScale,
        );
        letter.mesh.rotation.z += letter.spinVelocity;
        letter.spinVelocity *= 0.94;
      }

      if (this.state === 'celebrating') {
        const hue = (elapsed * 0.25 + index * 0.2) % 1;
        const rainbow = new THREE.Color().setHSL(hue, 0.85, 0.58);
        letter.mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.copy(rainbow);
            child.material.emissive.copy(rainbow).multiplyScalar(0.45);
          }
        });
      } else {
        letter.mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.opacity = ditherOpacity;
            const targetColor = new THREE.Color(letter.targetColor);
            child.material.color.lerp(targetColor, 0.12);
            child.material.emissive = new THREE.Color(letter.targetColor).multiplyScalar(0.12);
            child.material.emissiveIntensity = 0.1;
          }
        });
      }

      letter.scaleVelocity.x += (letter.targetScale.x - letter.mesh.scale.x / letter.baseModelScale) * 0.18;
      letter.scaleVelocity.y += (letter.targetScale.y - letter.mesh.scale.y / letter.baseModelScale) * 0.18;
      letter.scaleVelocity.z += (letter.targetScale.z - letter.mesh.scale.z / letter.baseModelScale) * 0.18;
      letter.scaleVelocity.multiplyScalar(0.72);
      letter.mesh.scale.x = Math.max(0.001, letter.mesh.scale.x + letter.scaleVelocity.x * letter.baseModelScale);
      letter.mesh.scale.y = Math.max(0.001, letter.mesh.scale.y + letter.scaleVelocity.y * letter.baseModelScale);
      letter.mesh.scale.z = Math.max(0.001, letter.mesh.scale.z + letter.scaleVelocity.z * letter.baseModelScale);

      letter.scale = ((letter.mesh.scale.x + letter.mesh.scale.y) * 0.5) / letter.baseModelScale;
    });

    this.checkWinCondition();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

const canvas = document.getElementById('abdCanvas');
canvas.__abdApp = new ABDApp();

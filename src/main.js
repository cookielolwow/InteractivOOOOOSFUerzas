// Main Application Entry Point
// PinkPantheress - "Girl Like Me" Autonomous Agents Visual Instrument
// The Nature of Code Ch. 5 · Reynolds Steering, Flocking, Flow Fields & Interactive Physarum

import './styles.css';
import { AgentSystem } from './agents/AgentSystem.js';
import { VisualScore } from './visualScore.js';
import { AudioCompanion } from './audio/drumTrack.js';
import { CamcorderUI } from './ui/camcorderUI.js';

class VisualInstrumentApp {
  constructor() {
    this.appContainer = document.getElementById('app') || document.body;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'main-canvas';
    this.appContainer.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Initialize Autonomous Agents Swarm
    this.agentSystem = new AgentSystem(this.width, this.height, 320);

    // Initialize Musical Visual Score
    this.visualScore = new VisualScore(this.agentSystem);

    // Initialize Audio Reference Companion
    this.audioCompanion = new AudioCompanion((step) => {
      // Optional audio beat callback
    });

    // Initialize Camcorder HUD UI
    this.ui = new CamcorderUI(this.agentSystem, this.visualScore, this.audioCompanion);

    this.lastTime = performance.now();

    this.initCanvas();
    this.bindEvents();
    this.startLoop();
  }

  initCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * ratio);
    this.canvas.height = Math.floor(this.height * ratio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.agentSystem.resize(this.width, this.height);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.initCanvas());

    // Keyboard Shortcuts for Live Expressive Performance
    window.addEventListener('keydown', (e) => {
      // Ignore if typing inside input/textarea
      if (e.target.matches('input, textarea')) return;

      const key = e.key.toUpperCase();

      // [ESPACIO]: Escalado Rítmico (Beat Stutter Jump)
      if (e.code === 'Space') {
        e.preventDefault();
        this.agentSystem.triggerBeat(1.0);
      }

      // [C]: Cohesión / Intimidad Vocal
      if (key === 'C') {
        this.agentSystem.params.cohesionWeight = this.agentSystem.params.cohesionWeight > 1.8 ? 0.8 : 2.5;
        this.agentSystem.triggerBeat(0.6);
      }

      // [V]: Separación / Breakbeat Drop
      if (key === 'V') {
        this.agentSystem.params.separationWeight = this.agentSystem.params.separationWeight > 2.2 ? 1.0 : 3.0;
        this.agentSystem.triggerBeat(0.8);
      }

      // [F]: Flow Field Swirl / Mode
      if (key === 'F') {
        const modes = ['stream', 'swirl', 'waves'];
        const current = this.agentSystem.flowField.mode;
        const next = modes[(modes.indexOf(current) + 1) % modes.length];
        this.agentSystem.flowField.setMode(next);
        this.agentSystem.flowField.triggerSwirl(this.width * 0.5, this.height * 0.5, 1.4);
      }

      // [T]: Physarum Dream Trails
      if (key === 'T') {
        this.agentSystem.params.showTrails = !this.agentSystem.params.showTrails;
      }

      // [L]: Toggle Song Playback ("Girl Like Me")
      if (key === 'L') {
        const playing = this.audioCompanion.toggleSongAudio();
        this.ui.btnPlayCustomAudio.textContent = playing ? '⏸ PAUSAR "GIRL LIKE ME"' : '▶ PLAY "GIRL LIKE ME"';
        this.ui.btnPlayCustomAudio.classList.toggle('is-active', playing);
        this.visualScore.isPlaying = playing;
      }

      // [P]: Toggle 2-Step Drum Track
      if (key === 'P') {
        const playing = this.audioCompanion.toggleDrumTrack();
        this.ui.txtDrumState.textContent = playing ? '⏹ DETENER BASE 2-STEP' : '🥁 BASE 2-STEP (138 BPM)';
        this.ui.btnToggleDrum.classList.toggle('is-active', playing);
        this.visualScore.isPlaying = playing;
      }

      // [R]: Reset Agents
      if (key === 'R') {
        this.agentSystem.initAgents();
        this.agentSystem.trailBuffer.clear();
      }

      // [M]: Toggle HUD Visibility
      if (key === 'M') {
        this.ui.isUiVisible = !this.ui.isUiVisible;
        this.ui.container.classList.toggle('hud-hidden', !this.ui.isUiVisible);
      }

      // [1 - 6]: Score Sections
      const num = parseInt(key, 10);
      if (num >= 1 && num <= 6) {
        this.visualScore.setSection(num - 1);
        this.agentSystem.triggerBeat(0.9);
      }
    });

    // Mouse / Touch Interaction (Conductor & Beat Trigger)
    const handlePointerMove = (e) => {
      this.agentSystem.mouse.x = e.clientX;
      this.agentSystem.mouse.y = e.clientY;
      this.agentSystem.mouse.active = true;
      this.agentSystem.params.mouseWeight = 1.2;
    };

    window.addEventListener('pointermove', handlePointerMove);

    window.addEventListener('pointerdown', (e) => {
      // If clicking directly on interactive UI buttons, do not trigger beat
      if (e.target.closest('button, input, label, .score-segment, .hud-lab-drawer')) return;

      this.agentSystem.mouse.x = e.clientX;
      this.agentSystem.mouse.y = e.clientY;
      this.agentSystem.mouse.active = true;
      this.agentSystem.mouse.mode = e.button === 2 ? 'flee' : 'seek';

      // Tap on canvas triggers beat step
      this.agentSystem.triggerBeat(1.0);
    });

    window.addEventListener('pointerup', () => {
      this.agentSystem.params.mouseWeight = 0.0;
      this.agentSystem.mouse.active = false;
    });

    window.addEventListener('contextmenu', (e) => {
      // Prevent default right click menu so it can be used for flee steering
      if (!e.target.closest('.hud-lab-drawer')) {
        e.preventDefault();
      }
    });
  }

  startLoop() {
    const loop = (currentTime) => {
      const deltaMs = Math.min(currentTime - this.lastTime, 100);
      const deltaSec = deltaMs / 1000;
      this.lastTime = currentTime;

      // 1. Advance Visual Score Time (synced to song if playing)
      const songTime = this.audioCompanion.getSongTime();
      if (songTime !== null) {
        this.visualScore.currentTime = songTime;
        const currentSec = this.visualScore.getCurrentSection();
        if (songTime >= currentSec.endTime && this.visualScore.currentSectionIndex < 5) {
          this.visualScore.setSection(this.visualScore.currentSectionIndex + 1);
        }
      } else {
        this.visualScore.updateTime(deltaSec);
      }

      // 2. Update Autonomous Agent Swarm
      this.agentSystem.update(currentTime, deltaMs / 16.666);

      // 3. Clear Screen with Y2K Night Atmosphere
      this.ctx.fillStyle = '#0A0310';
      this.ctx.fillRect(0, 0, this.width, this.height);

      // 4. Render Swarm, Trails & Field
      this.agentSystem.render(this.ctx);

      // 5. Update HUD elements
      this.ui.update(currentTime, deltaSec);

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Boot the application
new VisualInstrumentApp();
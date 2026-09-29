// Main Application Entry Point
// PinkPantheress - "Girl Like Me" Autonomous Agents Visual Instrument
// The Nature of Code Ch. 5 · Reynolds Steering, Flocking, Flow Fields & Interactive Physarum

import './styles.css';
import { AgentSystem } from './agents/AgentSystem.js';
import { VisualScore } from './visualScore.js';
import { AudioCompanion } from './audio/drumTrack.js';
import { CamcorderUI } from './ui/camcorderUI.js';
import { FancyBackground } from './background.js';

class VisualInstrumentApp {
  constructor() {
    this.camera = { scale: 1, baseScale: 1, shake: 0, angle: 0, targetAngle: 0 };
    this.appContainer = document.getElementById('app') || document.body;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'main-canvas';
    this.appContainer.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Initialize Autonomous Agents Swarm
    this.agentSystem = new AgentSystem(this.width, this.height, 240);

    // Initialize Musical Visual Score
    this.visualScore = new VisualScore(this.agentSystem);

    // Initialize Audio Reference Companion
    this.audioCompanion = new AudioCompanion((step) => {
      // Optional audio beat callback
    });

    // Initialize Camcorder HUD UI
    this.ui = new CamcorderUI(this.agentSystem, this.visualScore, this.audioCompanion);
    
    // Initialize Fancy Background
    this.background = new FancyBackground(this.width, this.height);

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
    if (this.background) this.background.resize(this.width, this.height);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.initCanvas());

    window.addEventListener('pointerdown', (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('button, input, select, textarea, label, .hud-btn, .trigger-btn, .audio-btn')) {
        return;
      }
      this.agentSystem.interactAt(event.clientX, event.clientY);
    });

    // Keyboard is the primary performance surface; holding a key never repeats hits.
    window.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.repeat) return;

      const key = e.key.toUpperCase();

      // [Q] / [ESPACIO]: manual beat hit, centered so the pointer has no influence.
      if (e.code === 'Space' || key === 'Q') {
        e.preventDefault();
        this.camera.scale = 1.08; this.camera.shake = 8;
        this.agentSystem.triggerBeat(1.0);
        this.background.triggerBeatRing(this.width / 2, this.height / 2, '#fff1b8');
        this.ui.showRhythmHit('BEAT!');
      }

      // [C]: Cohesión / Intimidad Vocal
      if (key === 'C') {
        this.agentSystem.params.cohesionWeight = this.agentSystem.params.cohesionWeight > 1.8 ? 0.8 : 2.5;
        this.agentSystem.triggerBeat(0.6);
        this.background.triggerBeatRing(this.width / 2, this.height / 2, '#72cbd0');
        this.ui.showRhythmHit('CLOSE IN!');
      }

      // [V]: Separación / Breakbeat Drop
      if (key === 'V') {
        this.agentSystem.params.separationWeight = this.agentSystem.params.separationWeight > 2.2 ? 1.0 : 3.0;
        this.agentSystem.triggerBeat(0.8);
        this.background.triggerBeatRing(this.width / 2, this.height / 2, '#e04755');
        this.ui.showRhythmHit('BREAK OUT!');
      }

      // [F]: Toggle Physarum trails; [D] cycles the flow-field modes.
      if (key === 'F') {
        this.agentSystem.params.showTrails = !this.agentSystem.params.showTrails;
        this.agentSystem.triggerBeat(0.7);
        this.background.triggerBeatRing(this.width / 2, this.height / 2, this.agentSystem.params.showTrails ? '#a8d9c2' : '#fff1b8');
        this.ui.showRhythmHit(this.agentSystem.params.showTrails ? 'TRAIL ON' : 'TRAIL OFF');
      }

      // [T]: Alternate shortcut for the Physarum trails.
      if (key === 'T') {
        this.agentSystem.params.showTrails = !this.agentSystem.params.showTrails;
        this.agentSystem.triggerBeat(0.7);
        this.background.triggerBeatRing(this.width / 2, this.height / 2, this.agentSystem.params.showTrails ? '#a8d9c2' : '#fff1b8');
        this.ui.showRhythmHit(this.agentSystem.params.showTrails ? 'TRAIL ON' : 'TRAIL OFF');
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
      if (key === 'M' || e.code === 'F2') {
        this.ui.isUiVisible = !this.ui.isUiVisible;
        this.ui.container.classList.toggle('hud-hidden', !this.ui.isUiVisible);
      }

      // [B]: snap the paper collage further in response to the performer.
      if (key === 'B') {
        this.background.triggerBeatRing(this.width / 2, this.height / 2, '#f77bad');
        this.ui.showRhythmHit('PAPER SNAP!');
      }

      // [1 - 6]: Score Sections
      const num = parseInt(key, 10);
      if (num >= 1 && num <= 6) {
        this.visualScore.setSection(num - 1);
        this.agentSystem.triggerBeat(0.9);
        this.background.triggerBeatRing(this.width / 2, this.height / 2, '#ffd36f');
        this.ui.showRhythmHit(`SECTION ${num}`);
      }

      // Four rhythm actions shown on screen: scatter, gather, spin, trail flare.
      if (key === 'A') {
        this.agentSystem.setInteractionMode('scatter');
        this.camera.scale = 1.15; this.camera.shake = 25; this.camera.targetAngle = 0.05; setTimeout(() => this.camera.targetAngle = 0, 150);
        this.agentSystem.params.separationWeight = 4.0; 
        setTimeout(() => this.agentSystem.params.separationWeight = 1.0, 200); 
        this.agentSystem.triggerBeat(1.0); 
        if(this.background) this.background.triggerBeatRing(this.width/2, this.height/2, '#CC0033');
        this.ui.showRhythmHit('SCATTER!');
      }
      if (key === 'S') {
        this.agentSystem.setInteractionMode('gather');
        this.camera.scale = 0.85; this.camera.shake = 15;
        this.agentSystem.params.cohesionWeight = 3.0; 
        setTimeout(() => this.agentSystem.params.cohesionWeight = 0.8, 200); 
        this.agentSystem.triggerBeat(1.0); 
        if(this.background) this.background.triggerBeatRing(this.width/2, this.height/2, '#2255AA');
        this.ui.showRhythmHit('GATHER!');
      }
      if (key === 'D') {
        this.agentSystem.setInteractionMode('orbit');
        this.camera.targetAngle = 0.2; this.camera.scale = 1.1; setTimeout(() => this.camera.targetAngle = 0, 300);
        const modes = ['stream', 'swirl', 'waves'];
        const current = this.agentSystem.flowField.mode;
        this.agentSystem.flowField.setMode(modes[(modes.indexOf(current) + 1) % modes.length]);
        this.agentSystem.flowField.triggerSwirl(this.width/2, this.height/2, 2.0);
        this.agentSystem.triggerBeat(1.0); 
        if(this.background) this.background.triggerBeatRing(this.width/2, this.height/2, '#D4A853');
        this.ui.showRhythmHit('SPIN!');
      }
      // [I]: performer-triggered PinkPantheress paper-photo flash.
      if (key === 'I') {
        this.background.triggerPortraitFlash();
        this.ui.showRhythmHit('PHOTO CUT!');
      }
      if (key === 'F') this.camera.shake = 8;
    });

    const updateScoreUI = this.visualScore.onSectionChange;
    this.visualScore.onSectionChange = (section) => {
      if (updateScoreUI) updateScoreUI(section);
      this.background.setSection(section.id);
    };
  }

  startLoop() {
    const loop = (currentTime) => {
      const deltaMs = Math.min(currentTime - this.lastTime, 100);
      const deltaSec = deltaMs / 1000;
      this.lastTime = currentTime;

      // 1. Advance Visual Score Time (synced to song if playing)
      const songTime = this.audioCompanion.getSongTime();
      const drumTime = this.audioCompanion.getDrumTime();
      const musicTime = songTime ?? drumTime;
      if (songTime !== null) {
        this.visualScore.currentTime = songTime;
      } else {
        this.visualScore.updateTime(deltaSec);
      }

      // 2. Update Autonomous Agent Swarm
      this.agentSystem.update(currentTime, deltaMs / 16.666);

      // Update camera physics
      this.camera.scale += (this.camera.baseScale - this.camera.scale) * 0.15;
      this.camera.angle += (this.camera.targetAngle - this.camera.angle) * 0.15;
      this.camera.shake *= 0.8;
      const sx = (Math.random() - 0.5) * this.camera.shake;
      const sy = (Math.random() - 0.5) * this.camera.shake;

      this.ctx.save();
      // Center transform
      this.ctx.translate(this.width / 2 + sx, this.height / 2 + sy);
      this.ctx.scale(this.camera.scale, this.camera.scale);
      this.ctx.rotate(this.camera.angle);
      this.ctx.translate(-this.width / 2, -this.height / 2);

      // 3. Clear Screen & Render Background
      this.ctx.clearRect(0, 0, this.width, this.height);
      if (this.background) {
        this.background.update(currentTime, this.agentSystem.globalBeatPulse, songTime);
        this.background.render(this.ctx);
      } else {
        this.ctx.fillStyle = '#0A0310';
        this.ctx.fillRect(0, 0, this.width, this.height);
      }

      // 4. Render Swarm, Trails & Field
      this.agentSystem.render(this.ctx);

      this.ctx.restore();

      // 5. Update HUD elements
      this.ui.update(currentTime, deltaSec);

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Boot the application
new VisualInstrumentApp();

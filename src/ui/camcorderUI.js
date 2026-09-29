import { SECTIONS } from '../visualScore.js';

export class CamcorderUI {
  constructor(agentSystem, visualScore, audioCompanion) {
    this.agentSystem = agentSystem;
    this.visualScore = visualScore;
    this.audioCompanion = audioCompanion;

    this.container = document.createElement('div');
    this.container.className = 'camcorder-interface';
    document.body.appendChild(this.container);

    this.isLabOpen = false;
    this.isUiVisible = true;
    this.prevPulse = 0;

    this.buildDOM();
    this.buildRhythmTitleCard();
    this.bindEvents();
  }

  buildRhythmTitleCard() {
    this.rhythmTitleCards = Array.from({ length: 4 }, () => {
      const element = document.createElement('div');
      element.className = 'rhythm-title-card';
      element.innerHTML = '<div class="rhythm-title-sticker"><strong></strong></div>';
      document.body.appendChild(element);
      return {
        element,
        label: element.querySelector('strong'),
        startedAt: -Infinity,
        slot: -1
      };
    });
  }

  buildDOM() {
    this.container.innerHTML = `
      <!-- Y2K Camcorder Framing -->
      <div class="camcorder-frame">
        <!-- Top Bar -->
        <header class="hud-top-bar">
          <div class="hud-left">
            <span class="rec-badge"><span class="rec-dot"></span>♥ REC</span>
            <span class="hud-track-title">PiNkPaNtHeReSs ♥ gIrL LiKe mE</span>
            <span class="hud-meta">♛ 138 BPM • UK GARAGE ♛ fAnCy tHaT!</span>
          </div>

          <div class="hud-right">
            <span class="hud-timer" id="hudTimer">00:00</span>
            <button class="hud-btn" id="btnToggleLab" title="Panel de Percepción y Parámetros">⚙️ PARÁMETROS</button>
            <button class="hud-btn" id="btnFullscreen" title="Pantalla Completa (F11)">⛶ FULLSCREEN</button>
            <button class="hud-btn" id="btnToggleUI" title="Ocultar o mostrar HUD (M / F2)">👁️ HUD · M / F2</button>
          </div>
        </header>

        <!-- Visual Score Timeline Navigator -->
        <div class="hud-score-navigator score-container">
          <div class="score-meta">
            <span class="score-label">♫ RHYTHM HEAVEN · HUMAN CUE ♫</span>
            <div class="score-current-info" id="scoreCurrentInfo">
              <strong id="scoreSectionName">INTRO: INTIMIDAD VOCAL</strong>
              <span id="scoreHint">Escucha el pulso y elige cuándo intervenir.</span>
            </div>
          </div>

          <div class="score-timeline-track rhythm-track-container" id="scoreTimelineTrack">
            <div class="rhythm-track-line"></div>
            ${SECTIONS.map((sec, idx) => `
              <div class="score-segment ${idx === 0 ? 'is-active' : ''}" data-index="${idx}">
                <div class="segment-node"></div>
                <div class="segment-info">
                  <span class="score-seg-key">[${sec.key}]</span>
                  <span class="score-seg-title">${sec.name.split(':')[0]}</span>
                  <span class="score-seg-time">${sec.timeRange}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Center Beat Stutter Indicator (The Video Edit Escalado Effect) -->
        <div class="hud-center-stutter">
          <div class="stutter-gauge">
            <span class="stutter-label">♫ RHYTHM HEAVEN ♫</span>
            <div class="stutter-steps" id="stutterSteps">
              <span class="step-bar" data-step="1"></span>
              <span class="step-bar" data-step="2"></span>
              <span class="step-bar" data-step="3"></span>
              <span class="step-bar" data-step="4"></span>
            </div>
          </div>
          <div class="rhythm-feedback" id="rhythmFeedback"></div>
          <div class="rhythm-prompt"><span>HIT THE BEAT</span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd><small>Q / SPACE · HIT</small></div>
        </div>

        <!-- Bottom Expressive Performance Dock -->
        <footer class="hud-bottom-dock">
          <!-- Rhythm Keys Legend -->
          <div class="rhythm-keys-legend">
            <strong>TECLAS DE RITMO</strong>
            <span><kbd>A</kbd> DISPERSAR</span>
            <span><kbd>S</kbd> AGRUPAR</span>
            <span><kbd>D</kbd> GIRAR</span>
            <span><kbd>F</kbd> ESTELAS</span>
            <span><kbd>B</kbd> SALTO DE PAPEL</span>
            <span><kbd>I</kbd> FOTO</span>
          </div>

          <!-- Primary Expressive Triggers -->
          <div class="dock-triggers">
            <button class="trigger-btn beat-trigger" id="btnBeatTrigger">
              <span class="key-badge">Q / ESPACIO</span>
              <span class="trigger-name">♥ BEAT DROP</span>
            </button>

            <button class="trigger-btn" id="btnCohesion" data-key="S">
              <span class="key-badge">[S]</span>
              <span class="trigger-name">♫ GATHER (VOCAL)</span>
            </button>

            <button class="trigger-btn" id="btnSeparation" data-key="A">
              <span class="key-badge">[A]</span>
              <span class="trigger-name">★ SCATTER (BREAK)</span>
            </button>

            <button class="trigger-btn" id="btnFlow" data-key="D">
              <span class="key-badge">[D]</span>
              <span class="trigger-name">♛ SPIN (FLOW)</span>
            </button>

            <button class="trigger-btn" id="btnTrails" data-key="F">
              <span class="key-badge">[F] / [T]</span>
              <span class="trigger-name">🍒 FLARE (PHYSARUM)</span>
            </button>
          </div>

          <div class="dock-audio-controls">
            <!-- Primary Song Playback -->
            <button class="audio-btn song-play-btn" id="btnPlayCustomAudio">
              <span class="audio-icon">▶</span>
              <span id="txtSongState">▶ gIrL LiKe mE</span>
            </button>

            <!-- Metronome 2-step generator fallback -->
            <button class="audio-btn" id="btnToggleDrum" title="Base rítmica sintética a 138 BPM para práctica">
              <span class="audio-icon">🥁</span>
              <span id="txtDrumState">♫ 2-STEP BEAT (138)</span>
            </button>

            <label class="audio-upload-btn" title="Cargar archivo de audio alternativo">
              <span>♛ LOAD AUDIO</span>
              <input type="file" id="fileAudioInput" accept="audio/*" style="display:none">
            </label>
          </div>
        </footer>
      </div>

      <!-- Collapsible Lab Drawer (Agent Parameters & Perception Limits) -->
      <aside class="hud-lab-drawer" id="labDrawer">
        <div class="lab-header">
          <h3>PARÁMETROS DE AGENTES & PERCEPCIÓN</h3>
          <button class="lab-close-btn" id="btnCloseLab">✕</button>
        </div>
        <div class="lab-content">
          <p class="lab-desc">
            Intervención de reglas locales y límites de percepción (Craig Reynolds / Flocking / Physarum).
          </p>

          <div class="lab-group">
            <label>Radio de Percepción (<span id="valPerception">${this.agentSystem.params.perceptionRadius}</span> px)</label>
            <input type="range" id="sliderPerception" min="30" max="180" value="${this.agentSystem.params.perceptionRadius}">
          </div>

          <div class="lab-group">
            <label>Radio de Separación (<span id="valSeparation">${this.agentSystem.params.separationRadius}</span> px)</label>
            <input type="range" id="sliderSeparation" min="10" max="80" value="${this.agentSystem.params.separationRadius}">
          </div>

          <div class="lab-group">
            <label>Fuerza Máxima Reynolds (<span id="valMaxForce">${this.agentSystem.params.maxForce}</span>)</label>
            <input type="range" id="sliderMaxForce" min="0.05" max="0.5" step="0.01" value="${this.agentSystem.params.maxForce}">
          </div>

          <div class="lab-group">
            <label>Velocidad Máxima (<span id="valMaxSpeed">${this.agentSystem.params.maxSpeed}</span>)</label>
            <input type="range" id="sliderMaxSpeed" min="1.5" max="8.0" step="0.2" value="${this.agentSystem.params.maxSpeed}">
          </div>

          <div class="lab-group">
            <label>Evaporación Estelas Physarum (<span id="valDecay">${this.agentSystem.params.trailDecay}</span>)</label>
            <input type="range" id="sliderDecay" min="0.02" max="0.20" step="0.01" value="${this.agentSystem.params.trailDecay}">
          </div>

          <div class="lab-group">
            <label>Cantidad de Agentes (<span id="valAgentCount">${this.agentSystem.agentCount}</span>)</label>
            <input type="range" id="sliderAgentCount" min="80" max="600" step="20" value="${this.agentSystem.agentCount}">
          </div>

          <div class="lab-group checkbox-group">
            <label>
              <input type="checkbox" id="chkShowFlow" ${this.agentSystem.params.showFlowField ? 'checked' : ''}>
              Mostrar Vectores de Flow Field
            </label>
          </div>
        </div>
      </aside>
    `;

    // Cache elements
    this.elTimer = this.container.querySelector('#hudTimer');
    this.elSectionName = this.container.querySelector('#scoreSectionName');
    this.elHint = this.container.querySelector('#scoreHint');
    this.elStutterSteps = this.container.querySelectorAll('.step-bar');
    this.elSegments = this.container.querySelectorAll('.score-segment');
    this.labDrawer = this.container.querySelector('#labDrawer');
    this.btnToggleDrum = this.container.querySelector('#btnToggleDrum');
    this.txtDrumState = this.container.querySelector('#txtDrumState');
    this.fileAudioInput = this.container.querySelector('#fileAudioInput');
    this.btnPlayCustomAudio = this.container.querySelector('#btnPlayCustomAudio');
    this.txtSongState = this.container.querySelector('#txtSongState');
    this.rhythmFeedback = this.container.querySelector('#rhythmFeedback');
    this.rhythmPrompt = this.container.querySelector('.rhythm-prompt');
  }

  bindEvents() {
    // 1. Beat Trigger Button (Escalado Rítmico)
    const btnBeat = this.container.querySelector('#btnBeatTrigger');
    btnBeat.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.agentSystem.triggerBeat(1.0);
      this.showRhythmHit('BEAT!');
    });

    // 2. Score segment click selection
    this.elSegments.forEach((seg) => {
      seg.addEventListener('click', () => {
        const idx = parseInt(seg.dataset.index, 10);
        this.visualScore.setSection(idx);
      });
    });

    // 3. Expressive Dock Buttons
    this.container.querySelector('#btnCohesion').addEventListener('click', () => {
      this.agentSystem.params.cohesionWeight = this.agentSystem.params.cohesionWeight > 1.8 ? 0.8 : 2.5;
      this.showRhythmHit('GATHER!');
    });

    this.container.querySelector('#btnSeparation').addEventListener('click', () => {
      this.agentSystem.params.separationWeight = this.agentSystem.params.separationWeight > 2.2 ? 1.0 : 3.0;
      this.showRhythmHit('SCATTER!');
    });

    this.container.querySelector('#btnFlow').addEventListener('click', () => {
      const modes = ['stream', 'swirl', 'waves'];
      const current = this.agentSystem.flowField.mode;
      const next = modes[(modes.indexOf(current) + 1) % modes.length];
      this.agentSystem.flowField.setMode(next);
      this.agentSystem.flowField.triggerSwirl(window.innerWidth * 0.5, window.innerHeight * 0.5, 1.4);
      this.showRhythmHit('SPIN!');
    });

    this.container.querySelector('#btnTrails').addEventListener('click', () => {
      this.agentSystem.params.showTrails = !this.agentSystem.params.showTrails;
      this.showRhythmHit(this.agentSystem.params.showTrails ? 'TRAIL ON' : 'TRAIL OFF');
    });

    // 4. Header buttons: Lab, Fullscreen, HUD Toggle
    this.container.querySelector('#btnToggleLab').addEventListener('click', () => {
      this.isLabOpen = !this.isLabOpen;
      this.labDrawer.classList.toggle('is-open', this.isLabOpen);
    });

    this.container.querySelector('#btnCloseLab').addEventListener('click', () => {
      this.isLabOpen = false;
      this.labDrawer.classList.remove('is-open');
    });

    this.container.querySelector('#btnFullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    this.container.querySelector('#btnToggleUI').addEventListener('click', () => {
      this.isUiVisible = !this.isUiVisible;
      this.container.classList.toggle('hud-hidden', !this.isUiVisible);
    });

    // 5. Audio Companion
    this.btnToggleDrum.addEventListener('click', () => {
      const playing = this.audioCompanion.toggleDrumTrack();
      this.txtDrumState.textContent = playing ? '⏹ DETENER BASE 2-STEP' : '♫ 2-STEP BEAT (138)';
      this.btnToggleDrum.classList.toggle('is-active', playing);
      this.visualScore.isPlaying = playing;
    });

    this.fileAudioInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.audioCompanion.loadAudioFile(file);
        this.txtSongState.textContent = '▶ PLAY AUDIO CARGADO';
      }
    });

    this.btnPlayCustomAudio.addEventListener('click', () => {
      const playing = this.audioCompanion.toggleSongAudio();
      this.txtSongState.textContent = playing ? '⏸ PAUSAR gIrL LiKe mE' : '▶ gIrL LiKe mE';
      this.btnPlayCustomAudio.classList.toggle('is-active', playing);
      this.visualScore.isPlaying = playing;
    });

    // 6. Lab Sliders
    this.bindSlider('sliderPerception', 'valPerception', (v) => {
      this.agentSystem.params.perceptionRadius = parseFloat(v);
      for (const a of this.agentSystem.agents) a.perceptionRadius = parseFloat(v);
    });

    this.bindSlider('sliderSeparation', 'valSeparation', (v) => {
      this.agentSystem.params.separationRadius = parseFloat(v);
      for (const a of this.agentSystem.agents) a.separationRadius = parseFloat(v);
    });

    this.bindSlider('sliderMaxForce', 'valMaxForce', (v) => {
      this.agentSystem.params.maxForce = parseFloat(v);
      for (const a of this.agentSystem.agents) a.maxForce = parseFloat(v);
    });

    this.bindSlider('sliderMaxSpeed', 'valMaxSpeed', (v) => {
      this.agentSystem.params.maxSpeed = parseFloat(v);
      for (const a of this.agentSystem.agents) a.maxSpeed = parseFloat(v);
    });

    this.bindSlider('sliderDecay', 'valDecay', (v) => {
      this.agentSystem.params.trailDecay = parseFloat(v);
    });

    this.bindSlider('sliderAgentCount', 'valAgentCount', (v) => {
      this.agentSystem.setAgentCount(parseInt(v, 10));
    });

    this.container.querySelector('#chkShowFlow').addEventListener('change', (e) => {
      this.agentSystem.params.showFlowField = e.target.checked;
    });

    // 7. Visual Score callback
    this.visualScore.onSectionChange = (sec) => {
      this.elSectionName.textContent = sec.name;
      this.elHint.textContent = sec.actionHint;
      this.elSegments.forEach((seg, idx) => {
        seg.classList.toggle('is-active', idx === sec.id);
      });
      // Optionally sync song audio playback to the section's start time
      if (this.audioCompanion.isCustomAudioPlaying) {
        this.audioCompanion.seek(sec.startTime);
      }
    };
  }

  bindSlider(sliderId, valId, callback) {
    const slider = this.container.querySelector('#' + sliderId);
    const valSpan = this.container.querySelector('#' + valId);
    if (slider && valSpan) {
      slider.addEventListener('input', (e) => {
        valSpan.textContent = e.target.value;
        callback(e.target.value);
      });
    }
  }

  // Update HUD every frame
  update(time, delta) {
    // A) Timer
    const totalSecs = Math.floor(this.visualScore.currentTime);
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    this.elTimer.textContent = `${mins}:${secs}`;

    // B) Stepped Stutter indicator
    const pulse = this.agentSystem.globalBeatPulse;
    const activeLevel = Math.ceil(pulse * 4); // 0, 1, 2, 3, 4
    this.elStutterSteps.forEach((step, idx) => {
      step.classList.toggle('is-lit', idx < activeLevel);
    });

    this.prevPulse = pulse;
  }

  showRhythmHit(label) {
    this.rhythmFeedback.textContent = label;
    this.rhythmFeedback.style.animation = 'none';
    void this.rhythmFeedback.offsetWidth;
    this.rhythmFeedback.style.animation = 'popIn 0.65s ease-out forwards';
    this.rhythmPrompt.classList.add('is-hit');
    clearTimeout(this.rhythmPromptTimer);
    this.rhythmPromptTimer = setTimeout(() => this.rhythmPrompt.classList.remove('is-hit'), 220);
    this.showRhythmTitle(label);
  }

  showRhythmTitle(label) {
    const titles = {
      'BEAT!': ['ON BEAT!', 'gold'],
      'SCATTER!': ['BREAK OUT!', 'red'],
      'GATHER!': ['CLOSE IN!', 'blue'],
      'SPIN!': ['TURN IT!', 'pink'],
      'TRAIL ON': ['TRAIL ON!', 'green'],
      'TRAIL OFF': ['TRAIL CUT!', 'cream'],
      'CLOSE IN!': ['CLOSE IN!', 'blue'],
      'BREAK OUT!': ['BREAK OUT!', 'red']
    };
    const [title, tone] = titles[label] || [label.replace(/!/g, ''), 'gold'];
    const now = performance.now();
    const cards = this.rhythmTitleCards;
    const card = cards.find(item => now - item.startedAt >= 860) ||
      cards.reduce((oldest, item) => item.startedAt < oldest.startedAt ? item : oldest);
    const slots = [[24, 29], [76, 31], [25, 70], [75, 69]];
    const busySlots = new Set(cards.filter(item => now - item.startedAt < 860 && item !== card).map(item => item.slot));
    const slot = slots.findIndex((_, index) => !busySlots.has(index));
    const slotIndex = slot < 0 ? (card.slot + 1 + slots.length) % slots.length : slot;
    const [x, y] = slots[slotIndex];

    card.label.textContent = title;
    card.element.style.setProperty('--title-x', `${x}vw`);
    card.element.style.setProperty('--title-y', `${y}vh`);
    card.element.dataset.tone = tone;
    card.element.classList.remove('is-playing');
    void card.element.offsetWidth;
    card.startedAt = now;
    card.slot = slotIndex;
    card.element.classList.add('is-playing');
  }

}

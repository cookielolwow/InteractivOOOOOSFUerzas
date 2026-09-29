// Visual Score (Partitura Visual de Interpretación)
// Guía de interpretación en vivo para "Girl Like Me" de PinkPantheress (138 BPM, UK Garage)

export const SECTIONS = [
  {
    id: 0,
    key: '1',
    name: 'INTRO: INTIMIDAD VOCAL',
    timeRange: '0:00 - 0:18',
    startTime: 0,
    endTime: 18,
    musicalPassage: 'Voz susurrada solitaria, acordes lo-fi nostálgicos.',
    visualIntention: 'Cúmulo íntimo central, reposo y melancolía.',
    actionHint: 'Presiona [C] para Cohesión alta. Partículas unidas y estelas suaves.',
    recommendedPreset: {
      separationWeight: 0.6,
      alignmentWeight: 0.4,
      cohesionWeight: 2.2,
      flowFieldWeight: 0.3,
      physarumWeight: 0.5,
      trailDecay: 0.05,
      maxSpeed: 2.4
    }
  },
  {
    id: 1,
    key: '2',
    name: 'VERSO 1: ENTRA EL 2-STEP',
    timeRange: '0:18 - 0:45',
    startTime: 18,
    endTime: 45,
    musicalPassage: 'Aparece el breakbeat 2-step sincopado a 138 BPM.',
    visualIntention: 'Activación del ritmo cadencioso y corrientes de aire.',
    actionHint: 'Golpea [ESPACIO] al ritmo de la caja para el Escalado Rítmico cuantizado.',
    recommendedPreset: {
      separationWeight: 1.4,
      alignmentWeight: 1.2,
      cohesionWeight: 1.0,
      flowFieldWeight: 1.1,
      physarumWeight: 0.7,
      trailDecay: 0.08,
      maxSpeed: 3.8
    }
  },
  {
    id: 2,
    key: '3',
    name: 'CORO 1: GIRL LIKE ME (CLÍMAX)',
    timeRange: '0:45 - 1:12',
    startTime: 45,
    endTime: 72,
    musicalPassage: 'Estribillo eufórico, percusión brillante y voces en eco.',
    visualIntention: 'Explosión de partículas, destellos neón y dispersión rápida.',
    actionHint: 'Activa [V] para Separación máxima y [T] para estelas fluorescentes.',
    recommendedPreset: {
      separationWeight: 2.8,
      alignmentWeight: 0.8,
      cohesionWeight: 0.3,
      flowFieldWeight: 1.4,
      physarumWeight: 1.0,
      trailDecay: 0.06,
      maxSpeed: 5.2
    }
  },
  {
    id: 3,
    key: '4',
    name: 'PUENTE: THE PINKETTE',
    timeRange: '1:12 - 1:40',
    startTime: 72,
    endTime: 100,
    musicalPassage: 'Filtro pasa-bajos, juego rítmico sincopado y cortes secos.',
    visualIntention: 'Vórtices magnéticos y trayectorias sinuosas orgánicas.',
    actionHint: 'Mueve el cursor o presiona [F] para activar el vórtice de flujo.',
    recommendedPreset: {
      separationWeight: 1.2,
      alignmentWeight: 1.5,
      cohesionWeight: 1.2,
      flowFieldWeight: 1.8,
      physarumWeight: 0.9,
      trailDecay: 0.07,
      maxSpeed: 4.0
    }
  },
  {
    id: 4,
    key: '5',
    name: 'CORO 2: DROP TOTAL',
    timeRange: '1:40 - 2:05',
    startTime: 100,
    endTime: 125,
    musicalPassage: 'Doble energía rítmica, bajo saturado, coro final.',
    visualIntention: 'Fusión elástica: contracción y expansión enérgica.',
    actionHint: 'Alterna [C] y [V] en contratiempo con saltos continuos de [ESPACIO].',
    recommendedPreset: {
      separationWeight: 2.4,
      alignmentWeight: 1.6,
      cohesionWeight: 1.4,
      flowFieldWeight: 1.5,
      physarumWeight: 1.2,
      trailDecay: 0.05,
      maxSpeed: 5.6
    }
  },
  {
    id: 5,
    key: '6',
    name: 'OUTRO: DISOLUCIÓN DE ENSUEÑO',
    timeRange: '2:05 - 2:25',
    startTime: 125,
    endTime: 145,
    musicalPassage: 'Cesa el breakbeat, eco vocal en desvanecimiento ("...like me").',
    visualIntention: 'Quietud nostálgica, evaporación de estelas en el vacío púrpura.',
    actionHint: 'Deja que el sistema se desacelere y las partículas reposen en calma.',
    recommendedPreset: {
      separationWeight: 0.8,
      alignmentWeight: 0.3,
      cohesionWeight: 1.6,
      flowFieldWeight: 0.2,
      physarumWeight: 0.4,
      trailDecay: 0.12,
      maxSpeed: 1.6
    }
  }
];

export class VisualScore {
  constructor(agentSystem) {
    this.agentSystem = agentSystem;
    this.currentSectionIndex = 0;
    this.currentTime = 0;
    this.isPlaying = false;
    this.onSectionChange = null;
  }

  getCurrentSection() {
    return SECTIONS[this.currentSectionIndex];
  }

  setSection(index) {
    if (index < 0 || index >= SECTIONS.length) return;
    this.currentSectionIndex = index;
    const sec = SECTIONS[index];
    this.currentTime = sec.startTime;

    // Apply recommended preset to agent swarm
    if (sec.recommendedPreset) {
      Object.assign(this.agentSystem.params, sec.recommendedPreset);
    }

    if (this.onSectionChange) {
      this.onSectionChange(sec);
    }
  }

  nextSection() {
    this.setSection((this.currentSectionIndex + 1) % SECTIONS.length);
  }

  prevSection() {
    this.setSection((this.currentSectionIndex - 1 + SECTIONS.length) % SECTIONS.length);
  }

  updateTime(deltaSeconds) {
    if (!this.isPlaying) return;

    this.currentTime += deltaSeconds;
    const sec = this.getCurrentSection();

    // Check if we advanced to next section
    if (this.currentTime >= sec.endTime && this.currentSectionIndex < SECTIONS.length - 1) {
      this.setSection(this.currentSectionIndex + 1);
    }
  }
}

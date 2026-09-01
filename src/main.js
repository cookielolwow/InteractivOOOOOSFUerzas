import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPU from 'three/addons/capabilities/WebGPU.js';

import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

import './styles.css';

import { createParameters } from './simulation/parameters.js';
import { createSimulation } from './simulation/createSimulation.js';
import { createLabPanel } from './ui/labPanel.js';


// ============================================================
// CONFIG
// ============================================================

const NUM_AGENTS = 144;

const BASE_BPM = 138;

const BEAT_SECONDS =
  60 /
  BASE_BPM;

const EIGHTH_SECONDS =
  BEAT_SECONDS /
  2;

const SIXTEENTH_SECONDS =
  BEAT_SECONDS /
  4;


// ============================================================
// KURAMOTO
// ============================================================

const phases =
  new Float32Array(
    NUM_AGENTS
  );

const freqs =
  new Float32Array(
    NUM_AGENTS
  );

const types =
  new Int32Array(
    NUM_AGENTS
  );

const frequencyVariation = [
  -0.025,
  -0.018,
  -0.012,
  -0.006,
   0.000,
   0.006,
   0.012,
   0.018
];

let omegaSpread = 1.0;


// ============================================================
// FRECUENCIAS NATURALES
// ============================================================
//
// 36 KICK
// 24 RUMBLE
// 18 CLAP
// 30 CLOSED HAT
// 18 OPEN HAT
// 18 ACID
//
// Estas frecuencias siguen siendo parte del modelo.
// No se modifica la lógica de audio.
//

function updateNaturalFrequencies() {

  for (
    let i = 0;
    i < NUM_AGENTS;
    i++
  ) {

    const variation =
      frequencyVariation[
        i %
        frequencyVariation.length
      ];

    let bpm;

    if (
      i < 36
    ) {

      types[i] = 0;
      bpm = 138;

    } else if (
      i < 60
    ) {

      types[i] = 1;
      bpm = 69;

    } else if (
      i < 78
    ) {

      types[i] = 2;
      bpm = 138;

    } else if (
      i < 108
    ) {

      types[i] = 3;
      bpm = 276;

    } else if (
      i < 126
    ) {

      types[i] = 4;
      bpm = 276;

    } else {

      types[i] = 5;
      bpm = 207;

    }

    freqs[i] =
      2 *
      Math.PI *
      (
        bpm / 60
      ) *
      (
        1 +
        variation *
        omegaSpread
      );

  }

}

updateNaturalFrequencies();


// ============================================================
// AUDIO
// ============================================================

let audioCtx = null;
let masterGain = null;
let compressor = null;
let distortion = null;
let noiseBuffer = null;

let musicStarted = false;
let musicStartTime = 0;

let lastScheduledBeat = -1;
let lastScheduledEighth = -1;
let lastScheduledSixteenth = -1;


// ============================================================
// VISUAL STATE
// ============================================================

let flashPulse = 0;
let floorPulse = 0;
let cameraShake = 0;


// ============================================================
// DISCOTECA VISUAL
// ============================================================

let discoPulse = 0;
let discoBlackout = 0;
let discoFlash = 0;

let lastVisualBeat = -1;
let lastVisualEighth = -1;


// ============================================================
// COLORS
// ============================================================

const raveColors = [

  '#72FF00', // KICK
  '#8A00FF', // RUMBLE
  '#FFFFFF', // CLAP
  '#00FF8A', // CLOSED HAT
  '#B100FF', // OPEN HAT
  '#DFFF00'  // ACID

];

const colorObjects =
  raveColors.map(
    value =>
      new THREE.Color(value)
  );


// ============================================================
// BACKGROUND
// ============================================================

const backgroundColor =
  new THREE.Color(
    '#000001'
  );

const floorGlowColor =
  new THREE.Color(
    '#72FF00'
  );


// ============================================================
// STATE
// ============================================================

let collectiveState =
  'CHAOS';


// ============================================================
// LIGHTS
// ============================================================

let strobeLights = [];
let ceilingLights = [];
let whiteFlash = null;


// ============================================================
// AUDIO
// ============================================================

function setupAudio() {

  if (
    audioCtx
  ) {

    return;

  }

  audioCtx =
    new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

  masterGain =
    audioCtx.createGain();

  masterGain.gain.value =
    0.56;

  distortion =
    audioCtx.createWaveShaper();

  distortion.curve =
    createDistortionCurve(
      26
    );

  distortion.oversample =
    '2x';

  compressor =
    audioCtx.createDynamicsCompressor();

  compressor.threshold.value =
    -18;

  compressor.knee.value =
    4;

  compressor.ratio.value =
    10;

  compressor.attack.value =
    0.001;

  compressor.release.value =
    0.10;

  masterGain
    .connect(
      distortion
    )
    .connect(
      compressor
    )
    .connect(
      audioCtx.destination
    );

  noiseBuffer =
    createNoiseBuffer();

}


// ============================================================
// DISTORTION
// ============================================================

function createDistortionCurve(
  amount
) {

  const samples =
    44100;

  const curve =
    new Float32Array(
      samples
    );

  for (
    let i = 0;
    i < samples;
    i++
  ) {

    const x =
      i * 2 /
      samples -
      1;

    curve[i] =
      (
        3 +
        amount
      ) *
      x *
      20 /
      (
        Math.PI +
        amount *
        Math.abs(x)
      );

  }

  return curve;

}


// ============================================================
// NOISE
// ============================================================

function createNoiseBuffer() {

  const duration =
    1;

  const buffer =
    audioCtx.createBuffer(
      1,
      Math.floor(
        audioCtx.sampleRate *
        duration
      ),
      audioCtx.sampleRate
    );

  const data =
    buffer.getChannelData(
      0
    );

  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    const fade =
      1 -
      i /
      data.length;

    data[i] =
      (
        Math.random() * 2 -
        1
      ) *
      fade;

  }

  return buffer;

}


// ============================================================
// KICK
// ============================================================

function playKick(
  strength = 1
) {

  if (!audioCtx) {
    return;
  }

  const t =
    audioCtx.currentTime;

  const osc =
    audioCtx.createOscillator();

  const gain =
    audioCtx.createGain();

  osc.type =
    'sine';

  osc.frequency.setValueAtTime(
    165,
    t
  );

  osc.frequency.exponentialRampToValueAtTime(
    43,
    t + 0.075
  );

  osc.frequency.exponentialRampToValueAtTime(
    38,
    t + 0.18
  );

  gain.gain.setValueAtTime(
    0.001,
    t
  );

  gain.gain.exponentialRampToValueAtTime(
    0.03 +
    strength *
    0.75,
    t + 0.004
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    t + 0.23
  );

  osc
    .connect(gain)
    .connect(masterGain);

  osc.start(t);

  osc.stop(
    t + 0.25
  );

}


// ============================================================
// RUMBLE
// ============================================================

function playRumble(
  strength = 1
) {

  if (!audioCtx) {
    return;
  }

  const t =
    audioCtx.currentTime;

  const osc =
    audioCtx.createOscillator();

  const filter =
    audioCtx.createBiquadFilter();

  const gain =
    audioCtx.createGain();

  osc.type =
    'sawtooth';

  osc.frequency.value =
    47;

  filter.type =
    'lowpass';

  filter.frequency.value =
    135;

  filter.Q.value =
    5;

  gain.gain.setValueAtTime(
    0.001,
    t
  );

  gain.gain.exponentialRampToValueAtTime(
    0.015 +
    strength *
    0.20,
    t + 0.012
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    t + 0.50
  );

  osc
    .connect(filter)
    .connect(gain)
    .connect(masterGain);

  osc.start(t);

  osc.stop(
    t + 0.53
  );

}


// ============================================================
// CLOSED HAT
// ============================================================

function playHat(
  strength = 1
) {

  if (!audioCtx) {
    return;
  }

  const source =
    audioCtx.createBufferSource();

  const filter =
    audioCtx.createBiquadFilter();

  const gain =
    audioCtx.createGain();

  source.buffer =
    noiseBuffer;

  filter.type =
    'highpass';

  filter.frequency.value =
    8000;

  const t =
    audioCtx.currentTime;

  gain.gain.setValueAtTime(
    0.001,
    t
  );

  gain.gain.exponentialRampToValueAtTime(
    0.02 +
    strength *
    0.16,
    t + 0.001
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    t + 0.035
  );

  source
    .connect(filter)
    .connect(gain)
    .connect(masterGain);

  source.start(t);

  source.stop(
    t + 0.04
  );

}


// ============================================================
// OPEN HAT
// ============================================================

function playOpenHat(
  strength = 1
) {

  if (!audioCtx) {
    return;
  }

  const source =
    audioCtx.createBufferSource();

  const filter =
    audioCtx.createBiquadFilter();

  const gain =
    audioCtx.createGain();

  source.buffer =
    noiseBuffer;

  filter.type =
    'highpass';

  filter.frequency.value =
    5000;

  const t =
    audioCtx.currentTime;

  gain.gain.setValueAtTime(
    0.001,
    t
  );

  gain.gain.exponentialRampToValueAtTime(
    0.02 +
    strength *
    0.18,
    t + 0.002
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    t + 0.15
  );

  source
    .connect(filter)
    .connect(gain)
    .connect(masterGain);

  source.start(t);

  source.stop(
    t + 0.17
  );

}


// ============================================================
// CLAP
// ============================================================

function playClap(
  strength = 1
) {

  if (!audioCtx) {
    return;
  }

  const t =
    audioCtx.currentTime;

  const bursts = [

    [0.000, 2100, 0.30, 0.028],
    [0.012, 3300, 0.22, 0.023],
    [0.026, 1800, 0.18, 0.034],
    [0.042, 1200, 0.08, 0.045]

  ];

  bursts.forEach(
    burst => {

      const source =
        audioCtx.createBufferSource();

      const filter =
        audioCtx.createBiquadFilter();

      const gain =
        audioCtx.createGain();

      source.buffer =
        noiseBuffer;

      filter.type =
        'bandpass';

      filter.frequency.value =
        burst[1];

      filter.Q.value =
        2.2;

      const start =
        t +
        burst[0];

      gain.gain.setValueAtTime(
        0.001,
        start
      );

      gain.gain.exponentialRampToValueAtTime(
        burst[2] *
        strength,
        start + 0.001
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        start +
        burst[3]
      );

      source
        .connect(filter)
        .connect(gain)
        .connect(masterGain);

      source.start(
        start
      );

      source.stop(
        start +
        burst[3] +
        0.005
      );

    }
  );

}


// ============================================================
// ACID
// ============================================================

function playAcid(
  strength = 1,
  step = 0
) {

  if (!audioCtx) {
    return;
  }

  const t =
    audioCtx.currentTime;

  const notes = [

    55,
    65.41,
    73.42,
    82.41,
    98,
    110,
    130.81,
    146.83

  ];

  const note =
    notes[
      step %
      notes.length
    ];

  const osc =
    audioCtx.createOscillator();

  const filter =
    audioCtx.createBiquadFilter();

  const highpass =
    audioCtx.createBiquadFilter();

  const gain =
    audioCtx.createGain();

  osc.type =
    'sawtooth';

  osc.frequency.setValueAtTime(
    note,
    t
  );

  osc.frequency.exponentialRampToValueAtTime(
    note *
    (
      1 +
      strength *
      0.035
    ),
    t + 0.05
  );

  filter.type =
    'lowpass';

  filter.Q.value =
    17;

  filter.frequency.setValueAtTime(
    4200,
    t
  );

  filter.frequency.exponentialRampToValueAtTime(
    240 +
    strength *
    1500,
    t + 0.11
  );

  highpass.type =
    'highpass';

  highpass.frequency.value =
    70;

  gain.gain.setValueAtTime(
    0.001,
    t
  );

  gain.gain.exponentialRampToValueAtTime(
    0.012 +
    strength *
    0.20,
    t + 0.003
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    t + 0.16
  );

  osc
    .connect(filter)
    .connect(highpass)
    .connect(gain)
    .connect(masterGain);

  osc.start(t);

  osc.stop(
    t + 0.18
  );

}


// ============================================================
// STAB
// ============================================================

function playStab(
  strength = 1
) {

  if (!audioCtx) {
    return;
  }

  const t =
    audioCtx.currentTime;

  const notes = [

    146.83,
    174.61,
    220,
    261.63

  ];

  notes.forEach(
    note => {

      const osc =
        audioCtx.createOscillator();

      const filter =
        audioCtx.createBiquadFilter();

      const gain =
        audioCtx.createGain();

      osc.type =
        'sawtooth';

      osc.frequency.value =
        note;

      filter.type =
        'highpass';

      filter.frequency.value =
        650;

      gain.gain.setValueAtTime(
        0.001,
        t
      );

      gain.gain.exponentialRampToValueAtTime(
        0.018 *
        strength,
        t + 0.003
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        t + 0.075
      );

      osc
        .connect(filter)
        .connect(gain)
        .connect(masterGain);

      osc.start(t);

      osc.stop(
        t + 0.09
      );

    }
  );

}


// ============================================================
// BUILD NOISE
// ============================================================

function playBuildNoise(
  strength = 1
) {

  if (!audioCtx) {
    return;
  }

  const t =
    audioCtx.currentTime;

  const source =
    audioCtx.createBufferSource();

  const filter =
    audioCtx.createBiquadFilter();

  const gain =
    audioCtx.createGain();

  source.buffer =
    noiseBuffer;

  filter.type =
    'bandpass';

  filter.frequency.setValueAtTime(
    700,
    t
  );

  filter.frequency.exponentialRampToValueAtTime(
    9500,
    t + 0.42
  );

  filter.Q.value =
    2;

  gain.gain.setValueAtTime(
    0.001,
    t
  );

  gain.gain.linearRampToValueAtTime(
    0.10 *
    strength,
    t + 0.32
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    t + 0.44
  );

  source
    .connect(filter)
    .connect(gain)
    .connect(masterGain);

  source.start(t);

  source.stop(
    t + 0.46
  );

}


// ============================================================
// START MUSIC
// ============================================================

async function startMusic() {

  setupAudio();

  if (
    audioCtx.state ===
    'suspended'
  ) {

    await audioCtx.resume();

  }

  if (
    !musicStarted
  ) {

    musicStarted =
      true;

    musicStartTime =
      audioCtx.currentTime;

    lastScheduledBeat =
      -1;

    lastScheduledEighth =
      -1;

    lastScheduledSixteenth =
      -1;

    lastVisualBeat =
      -1;

    lastVisualEighth =
      -1;

  }

}


// ============================================================
// MUSIC SCHEDULER
// ============================================================
// NO TOCAR.
// La música permanece exactamente igual.
//

function updateMusic(
  R
) {

  if (
    !audioCtx ||
    !musicStarted
  ) {

    return;

  }

  const elapsed =
    audioCtx.currentTime -
    musicStartTime;

  const beatIndex =
    Math.floor(
      elapsed /
      BEAT_SECONDS
    );

  const eighthIndex =
    Math.floor(
      elapsed /
      EIGHTH_SECONDS
    );

  const sixteenthIndex =
    Math.floor(
      elapsed /
      SIXTEENTH_SECONDS
    );


  if (
    beatIndex >
    lastScheduledBeat
  ) {

    lastScheduledBeat =
      beatIndex;

    playKick(
      0.78 +
      R *
      0.22
    );

    playRumble(
      0.28 +
      R *
      0.72
    );

    const beatInBar =
      beatIndex %
      4;

    if (
      beatInBar === 1 ||
      beatInBar === 3
    ) {

      playClap(
        0.40 +
        R *
        0.60
      );

    }

    if (
      R > 0.52 &&
      beatInBar === 3
    ) {

      playStab(
        R
      );

    }

    flashPulse =
      Math.max(
        flashPulse,
        0.72 +
        R *
        0.28
      );

    floorPulse =
      Math.max(
        floorPulse,
        0.68 +
        R *
        0.28
      );

    cameraShake =
      Math.max(
        cameraShake,
        0.02 +
        R *
        0.035
      );

    if (
      R >
      0.35
    ) {

      whiteFlash.intensity =
        Math.max(
          whiteFlash.intensity,
          900 +
          R *
          1400
        );

    }

  }


  if (
    eighthIndex >
    lastScheduledEighth
  ) {

    lastScheduledEighth =
      eighthIndex;

    const subdivision =
      eighthIndex %
      8;

    if (
      subdivision % 2 === 0
    ) {

      playHat(
        0.35 +
        R *
        0.50
      );

    } else if (
      R >
      0.35
    ) {

      playHat(
        0.24 +
        R *
        0.36
      );

    }

    if (
      subdivision === 3 ||
      subdivision === 7
    ) {

      if (
        R >
        0.30
      ) {

        playOpenHat(
          0.35 +
          R *
          0.60
        );

      }

    }

    if (
      R >
      0.22
    ) {

      const acidProbability =
        0.20 +
        R *
        0.72;

      if (
        Math.random() <
        acidProbability
      ) {

        playAcid(
          THREE.MathUtils.clamp(
            0.30 +
            R *
            0.75,
            0,
            1
          ),
          eighthIndex
        );

      }

    }

  }


  if (
    sixteenthIndex >
    lastScheduledSixteenth
  ) {

    lastScheduledSixteenth =
      sixteenthIndex;

    if (
      R >
      0.60
    ) {

      const s =
        sixteenthIndex %
        16;

      if (
        s === 3 ||
        s === 7 ||
        s === 11 ||
        s === 15
      ) {

        playAcid(
          (
            R -
            0.40
          ) *
          1.35,
          s
        );

      }

    }

    if (
      R >
      0.72 &&
      sixteenthIndex % 32 === 28
    ) {

      playBuildNoise(
        R
      );

    }

  }

}


// ============================================================
// GROUP ENERGY
// ============================================================

function getGroupEnergy(
  impacts
) {

  const groupEnergy =
    new Float32Array(
      raveColors.length
    );

  if (
    !impacts ||
    impacts.length === 0
  ) {

    return groupEnergy;

  }

  const sums =
    new Float32Array(
      raveColors.length
    );

  for (
    const impact of impacts
  ) {

    const type =
      impact.type;

    if (
      type < 0 ||
      type >= raveColors.length
    ) {

      continue;

    }

    sums[type] +=
      impact.strength;

  }

  let maxEnergy =
    0;

  for (
    let i = 0;
    i < sums.length;
    i++
  ) {

    maxEnergy =
      Math.max(
        maxEnergy,
        sums[i]
      );

  }

  if (
    maxEnergy <= 0
  ) {

    return groupEnergy;

  }

  for (
    let i = 0;
    i < sums.length;
    i++
  ) {

    groupEnergy[i] =
      sums[i] /
      maxEnergy;

  }

  return groupEnergy;

}


// ============================================================
// HUD
// ============================================================

function createHUD() {

  const hud =
    document.createElement(
      'div'
    );

  hud.style.cssText = `

    position: fixed;
    top: 16px;
    left: 18px;

    z-index: 100;

    pointer-events: none;

    color: rgba(255,255,255,.78);

    font-family: monospace;

    font-size: 11px;

    line-height: 1.55;

    letter-spacing: 1px;

    text-shadow:
      0 0 8px rgba(114,255,0,.35);

  `;

  hud.innerHTML = `

    <div id="state">
      CHAOS
    </div>

    <div id="tempo">
      ${BASE_BPM} BPM
    </div>

    <div id="r">
      R 0.00
    </div>

    <div id="k">
      K 0.00
    </div>

    <div id="omega">
      Ω 1.00
    </div>

  `;

  document.body.append(
    hud
  );

  return {

    state:
      hud.querySelector(
        '#state'
      ),

    tempo:
      hud.querySelector(
        '#tempo'
      ),

    r:
      hud.querySelector(
        '#r'
      ),

    k:
      hud.querySelector(
        '#k'
      ),

    omega:
      hud.querySelector(
        '#omega'
      )

  };

}


// ============================================================
// VISUAL BEAT
// ============================================================
//
// Esta capa NO modifica el sonido.
// Simplemente usa el mismo reloj de 138 BPM.
//
// 1 beat:
// oscuro → flash → caída
//
// De esta forma la escena se siente como una discoteca.
//

function updateDiscoVisual(
  R
) {

  if (
    !musicStarted ||
    !audioCtx
  ) {

    discoPulse *= 0.88;
    discoBlackout *= 0.82;
    discoFlash *= 0.82;

    return;

  }

  const elapsed =
    audioCtx.currentTime -
    musicStartTime;

  const beatIndex =
    Math.floor(
      elapsed /
      BEAT_SECONDS
    );

  const eighthIndex =
    Math.floor(
      elapsed /
      EIGHTH_SECONDS
    );


  // ==========================================================
  // BEAT
  // ==========================================================

  if (
    beatIndex >
    lastVisualBeat
  ) {

    lastVisualBeat =
      beatIndex;

    const beatInBar =
      beatIndex %
      4;

    discoPulse =
      1;

    discoBlackout =
      1;

    discoFlash =
      1;


    // --------------------------------------------------------
    // patrón visual por beat
    // --------------------------------------------------------

    if (
      beatInBar === 0
    ) {

      whiteFlash.intensity =
        Math.max(
          whiteFlash.intensity,
          2600 +
          R *
          2200
        );

      strobeLights.forEach(
        light => {

          light.color.set(
            '#FFFFFF'
          );

          light.intensity =
            1800 +
            R *
            2200;

        }
      );

    } else {

      const visualType =
        beatInBar === 1
          ? 0
          : beatInBar === 2
            ? 2
            : 5;

      const color =
        colorObjects[
          visualType
        ];

      strobeLights.forEach(
        (
          light,
          index
        ) => {

          const active =
            index === visualType ||
            (
              index %
              2 ===
              beatInBar %
              2
            );

          light.color.copy(
            color
          );

          light.intensity =
            active
              ? 1600 +
                R *
                1700
              : 250;

        }
      );

    }

  }


  // ==========================================================
  // EIGHTHS
  // ==========================================================

  if (
    eighthIndex >
    lastVisualEighth
  ) {

    lastVisualEighth =
      eighthIndex;

    const subdivision =
      eighthIndex %
      8;


    if (
      subdivision % 2 === 1
    ) {

      discoFlash =
        Math.max(
          discoFlash,
          0.48
        );

    }

  }


  // ==========================================================
  // DECAY
  // ==========================================================

  discoPulse *=
    Math.pow(
      0.00008,
      1 / 60
    );

  discoBlackout *=
    Math.pow(
      0.000003,
      1 / 60
    );

  discoFlash *=
    Math.pow(
      0.00025,
      1 / 60
    );

}


// ============================================================
// MAIN
// ============================================================

async function main() {

  const mount =
    document.querySelector(
      '#app'
    );

  if (
    !WebGPU.isAvailable()
  ) {

    throw new Error(
      'Este proyecto requiere WebGPU.'
    );

  }


  // ==========================================================
  // SCENE
  // ==========================================================

  const scene =
    new THREE.Scene();

  scene.background =
    backgroundColor;

  scene.fog =
    new THREE.FogExp2(
      '#000001',
      0.028
    );


  // ==========================================================
  // FLOOR
  // ==========================================================

  const floorGeometry =
    new THREE.PlaneGeometry(
      52,
      52
    );

  const floorMaterial =
    new THREE.MeshStandardMaterial({

      color:
        '#010202',

      roughness:
        0.19,

      metalness:
        0.97

    });

  floorMaterial.emissive =
    floorGlowColor;

  floorMaterial.emissiveIntensity =
    0.005;

  const floor =
    new THREE.Mesh(
      floorGeometry,
      floorMaterial
    );

  floor.rotation.x =
    -Math.PI / 2;

  scene.add(
    floor
  );


  // ==========================================================
  // COLORED STROBES
  // ==========================================================

  raveColors.forEach(
    color => {

      const light =
        new THREE.PointLight(
          color,
          0,
          28,
          2
        );

      light.position.set(
        0,
        3,
        0
      );

      scene.add(
        light
      );

      strobeLights.push(
        light
      );

    }
  );


  // ==========================================================
  // WHITE FLASH
  // ==========================================================

  whiteFlash =
    new THREE.PointLight(
      '#FFFFFF',
      0,
      40,
      2
    );

  whiteFlash.position.set(
    0,
    5,
    0
  );

  scene.add(
    whiteFlash
  );


  // ==========================================================
  // CEILING
  // ==========================================================

  for (
    let i = 0;
    i < 8;
    i++
  ) {

    const x =
      -12 +
      (
        i % 4
      ) *
      8;

    const z =
      -8 +
      Math.floor(
        i / 4
      ) *
      16;

    const light =
      new THREE.SpotLight(
        i % 2 === 0
          ? '#72FF00'
          : '#8A00FF',
        0,
        42,
        Math.PI / 8,
        0.42,
        1.2
      );

    light.position.set(
      x,
      10,
      z
    );

    light.target.position.set(
      0,
      0,
      0
    );

    scene.add(
      light
    );

    scene.add(
      light.target
    );

    ceilingLights.push(
      light
    );

  }


  // ==========================================================
  // AMBIENT
  // ==========================================================

  const ambient =
    new THREE.AmbientLight(
      '#D8FFE8',
      0.18
    );

  scene.add(
    ambient
  );


  // ==========================================================
  // CAMERA
  // ==========================================================

  const camera =
    new THREE.PerspectiveCamera(
      48,
      innerWidth /
      innerHeight,
      0.1,
      140
    );

  camera.position.set(
    0,
    6.5,
    16
  );


  // ==========================================================
  // RENDERER
  // ==========================================================

  const renderer =
    new THREE.WebGPURenderer({
      antialias:
        true
    });

  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      2
    )
  );

  renderer.setSize(
    innerWidth,
    innerHeight
  );

  mount.appendChild(
    renderer.domElement
  );

  await renderer.init();


  // ==========================================================
  // BLOOM
  // ==========================================================

  const renderPipeline =
    new THREE.RenderPipeline(
      renderer
    );

  const scenePass =
    pass(
      scene,
      camera
    );

  const sceneColor =
    scenePass.getTextureNode(
      'output'
    );

  const bloomPass =
    bloom(
      sceneColor,
      0.04,
      0.10,
      0.94
    );

  renderPipeline.outputNode =
    sceneColor.add(
      bloomPass
    );


  // ==========================================================
  // ORBIT
  // ==========================================================

  const orbit =
    new OrbitControls(
      camera,
      renderer.domElement
    );

  orbit.target.set(
    0,
    0.9,
    0
  );

  orbit.enableDamping =
    true;

  orbit.dampingFactor =
    0.06;


  // ==========================================================
  // PARAMETERS
  // ==========================================================

  const params =
    createParameters();


  const simulation =
    await createSimulation({

      renderer,
      scene,
      count:
        NUM_AGENTS

    });


  // ==========================================================
  // HUD
  // ==========================================================

  const hud =
    createHUD();


  // ==========================================================
  // SELECTION
  // ==========================================================

  const raycaster =
    new THREE.Raycaster();

  const pointer =
    new THREE.Vector2();

  let selectedIndex =
    -1;

  const selectionRing =
    new THREE.Mesh(

      new THREE.RingGeometry(
        0.44,
        0.52,
        36
      ),

      new THREE.MeshBasicMaterial({

        color:
          '#FFFFFF',

        transparent:
          true,

        opacity:
          0.78,

        side:
          THREE.DoubleSide

      })

    );

  selectionRing.rotation.x =
    -Math.PI / 2;

  selectionRing.visible =
    false;

  scene.add(
    selectionRing
  );


  // ==========================================================
  // IMPACT RINGS
  // ==========================================================

  const impactRings = [];


  function createImpactRing(
    x,
    z,
    type,
    strength,
    collective
  ) {

    const color =
      collective > 0.55
        ? '#FFFFFF'
        : raveColors[type];

    const geometry =
      new THREE.RingGeometry(
        0.05,
        0.11,
        32
      );

    const material =
      new THREE.MeshBasicMaterial({

        color,

        transparent:
          true,

        opacity:
          0.58,

        side:
          THREE.DoubleSide

      });

    const ring =
      new THREE.Mesh(
        geometry,
        material
      );

    ring.rotation.x =
      -Math.PI / 2;

    ring.position.set(
      x,
      0.025,
      z
    );

    ring.userData.life =
      1;

    ring.userData.collective =
      collective;

    ring.userData.strength =
      strength;

    scene.add(
      ring
    );

    impactRings.push(
      ring
    );

  }


  // ==========================================================
  // DROP
  // ==========================================================

  function triggerDrop() {

    params.dropActive.value =
      1;

    flashPulse =
      1;

    floorPulse =
      1;

    cameraShake =
      0.22;

    discoPulse =
      1;

    discoBlackout =
      1;

    discoFlash =
      1;

    for (
      let i = 0;
      i < NUM_AGENTS;
      i++
    ) {

      phases[i] +=
        (
          Math.random() -
          0.5
        ) *
        Math.PI *
        2;

    }

    whiteFlash.intensity =
      3800;

    strobeLights.forEach(
      light => {

        light.color.set(
          '#FFFFFF'
        );

        light.intensity =
          1700;

      }
    );

    ceilingLights.forEach(
      light => {

        light.color.set(
          '#FFFFFF'
        );

        light.intensity =
          2700;

      }
    );

    if (
      audioCtx
    ) {

      playBuildNoise(
        1
      );

    }

    setTimeout(
      () => {

        params.dropActive.value =
          0;

      },
      300
    );

  }


  // ==========================================================
  // PANEL
  // ==========================================================

  createLabPanel({
    params,
    onDrop:
      triggerDrop
  });


  // ==========================================================
  // AUDIO START
  // ==========================================================

  addEventListener(
    'pointerdown',
    () => {

      startMusic();

    }
  );


  // ==========================================================
  // INDIVIDUAL PERTURBATION
  // ==========================================================

  addEventListener(
    'pointerdown',
    event => {

      pointer.x =
        (
          event.clientX /
          innerWidth
        ) *
        2 -
        1;

      pointer.y =
        -(
          event.clientY /
          innerHeight
        ) *
        2 +
        1;

      raycaster.setFromCamera(
        pointer,
        camera
      );

      const objects = [];

      simulation.ravers.forEach(
        raver => {

          if (
            !raver.visible
          ) {

            return;

          }

          raver.traverse(
            child => {

              if (
                child.isMesh
              ) {

                objects.push(
                  child
                );

              }

            }
          );

        }
      );

      const hits =
        raycaster.intersectObjects(
          objects,
          false
        );

      if (
        hits.length === 0
      ) {

        return;

      }

      let object =
        hits[0].object;

      while (
        object &&
        object.userData.index ===
        undefined
      ) {

        object =
          object.parent;

      }

      if (!object) {
        return;
      }

      selectedIndex =
        object.userData.index;

      selectionRing.visible =
        true;

      phases[
        selectedIndex
      ] +=
        Math.PI *
        1.5;

      flashPulse =
        Math.max(
          flashPulse,
          0.45
        );

      floorPulse =
        Math.max(
          floorPulse,
          0.35
        );

      cameraShake =
        0.10;

    }
  );


  // ==========================================================
  // KEYBOARD
  // ==========================================================

  addEventListener(
    'keydown',
    event => {

      if (
        event.key ===
        '['
      ) {

        params.couplingK.value =
          Math.max(
            0,
            params.couplingK.value -
            0.05
          );

      }

      if (
        event.key ===
        ']'
      ) {

        params.couplingK.value =
          Math.min(
            30,
            params.couplingK.value +
            0.05
          );

      }

      if (
        event.key ===
        '-'
      ) {

        omegaSpread =
          Math.max(
            0,
            omegaSpread -
            0.05
          );

        updateNaturalFrequencies();

      }

      if (
        event.key ===
        '='
      ) {

        omegaSpread =
          Math.min(
            2,
            omegaSpread +
            0.05
          );

        updateNaturalFrequencies();

      }

      if (
        event.code ===
        'Space'
      ) {

        triggerDrop();

      }

    }
  );


  // ==========================================================
  // CLOCK
  // ==========================================================

  const clock =
    new THREE.Clock();

  simulation.reset();


  // ==========================================================
  // LOOP
  // ==========================================================

  renderer.setAnimationLoop(
    () => {

      const dt =
        Math.min(
          clock.getDelta(),
          0.04
        );

      const time =
        performance.now() *
        0.001;


      // ======================================================
      // DECAY
      // ======================================================

      flashPulse *=
        Math.pow(
          0.00002,
          dt
        );

      floorPulse *=
        Math.pow(
          0.001,
          dt
        );

      cameraShake *=
        Math.pow(
          0.002,
          dt
        );


      // ======================================================
      // STROBES DECAY
      // ======================================================

      strobeLights.forEach(
        light => {

          light.intensity =
            Math.max(
              0,
              light.intensity -
              11000 *
              dt
            );

        }
      );

      whiteFlash.intensity =
        Math.max(
          0,
          whiteFlash.intensity -
          19000 *
          dt
        );


      // ======================================================
      // KURAMOTO
      // ======================================================

      const newPhases =
        new Float32Array(
          NUM_AGENTS
        );

      const K =
        params.couplingK.value;

      let sumCos =
        0;

      let sumSin =
        0;

      for (
        let i = 0;
        i < NUM_AGENTS;
        i++
      ) {

        let couplingSum =
          0;

        for (
          let j = 0;
          j < NUM_AGENTS;
          j++
        ) {

          if (
            i !== j
          ) {

            couplingSum +=
              Math.sin(
                phases[j] -
                phases[i]
              );

          }

        }

        let omega =
          freqs[i];

        if (
          params.dropActive.value >
          0
        ) {

          omega +=
            (
              Math.random() -
              0.5
            ) *
            70;

        }

        const dTheta =
          omega +
          (
            K /
            NUM_AGENTS
          ) *
          couplingSum;

        newPhases[i] =
          phases[i] +
          dTheta *
          dt;

        phases[i] =
          newPhases[i];

        sumCos +=
          Math.cos(
            newPhases[i]
          );

        sumSin +=
          Math.sin(
            newPhases[i]
          );

      }


      // ======================================================
      // R
      // ======================================================

      const R =
        Math.sqrt(
          sumCos *
          sumCos +
          sumSin *
          sumSin
        ) /
        NUM_AGENTS;


      // ======================================================
      // ESTADO
      // ======================================================

      if (
        R < 0.25
      ) {

        collectiveState =
          'CHAOS';

      } else if (
        R < 0.65
      ) {

        collectiveState =
          'GROOVE';

      } else {

        collectiveState =
          'LOCK';

      }


      // ======================================================
      // HUD
      // ======================================================

      hud.state.textContent =
        collectiveState;

      hud.r.textContent =
        `R ${R.toFixed(2)}`;

      hud.k.textContent =
        `K ${K.toFixed(2)}`;

      hud.omega.textContent =
        `Ω ${omegaSpread.toFixed(2)}`;


      // ======================================================
      // SONG
      // ======================================================

      updateMusic(
        R
      );


      // ======================================================
      // DISCOTECA
      // ======================================================

      updateDiscoVisual(
        R
      );


      // ======================================================
      // BACKGROUND
      // ======================================================

      let hue;

      if (
        collectiveState ===
        'CHAOS'
      ) {

        hue =
          0.75;

      } else if (
        collectiveState ===
        'GROOVE'
      ) {

        hue =
          0.69;

      } else {

        hue =
          0.32;

      }

      const discoLight =
        discoFlash *
        (
          0.025 +
          R *
          0.035
        );

      const blackoutAmount =
        THREE.MathUtils.clamp(
          discoBlackout *
          0.78,
          0,
          0.78
        );

      backgroundColor.setHSL(
        hue,
        0.96,
        Math.max(
          0.001,
          (
            0.003 +
            R * 0.006 +
            flashPulse * 0.025 +
            discoLight
          ) *
          (
            1 -
            blackoutAmount
          )
        )
      );


      // ======================================================
      // FLOOR
      // ======================================================

      floorGlowColor.setHSL(
        collectiveState ===
        'LOCK'
          ? 0.31
          : 0.38,
        1,
        0.11
      );

      floorMaterial.emissive =
        floorGlowColor;

      floorMaterial.emissiveIntensity =
        Math.max(
          0.0005,
          (
            0.003 +
            R * 0.018 +
            floorPulse * 1.20 +
            discoFlash * 0.80
          ) *
          (
            1 -
            blackoutAmount
          )
        );


      // ======================================================
      // AMBIENT
      // ======================================================

      ambient.intensity =
        Math.max(
          0.012,
          (
            0.10 +
            R * 0.04 +
            flashPulse * 0.35 +
            discoFlash * 0.12
          ) *
          (
            1 -
            discoBlackout *
            0.92
          )
        );


      // ======================================================
      // BLOOM
      // ======================================================

      bloomPass.strength.value =
        0.025 +
        flashPulse * 0.16 +
        discoFlash * 0.18;

      bloomPass.radius.value =
        0.11;

      bloomPass.threshold.value =
        0.90;


      // ======================================================
      // CEILING
      // ======================================================

      ceilingLights.forEach(
        (
          light,
          i
        ) => {

          const p =
            i *
            0.73;

          light.target.position.x =
            Math.sin(
              time *
              0.65 +
              p
            ) *
            15;

          light.target.position.z =
            Math.cos(
              time *
              0.48 +
              p
            ) *
            10;

          const baseIntensity =
            flashPulse *
            (
              750 +
              R *
              400
            );

          const blackoutFactor =
            1 -
            discoBlackout *
            0.95;

          light.intensity =
            Math.max(
              0,
              (
                baseIntensity +
                discoFlash *
                (
                  420 +
                  R *
                  700
                )
              ) *
              blackoutFactor
            );

          if (
            discoFlash >
            0.60
          ) {

            light.color.set(
              '#FFFFFF'
            );

          } else if (
            flashPulse >
            0.38
          ) {

            light.color.set(
              '#FFFFFF'
            );

          } else if (
            i % 2 ===
            0
          ) {

            light.color.set(
              '#72FF00'
            );

          } else {

            light.color.set(
              '#8A00FF'
            );

          }

        }
      );


      // ======================================================
      // SIMULATION
      // ======================================================

      const impacts =
        simulation.stepSimulation(
          phases,
          freqs,
          dt,
          R
        );


      const groupEnergy =
        getGroupEnergy(
          impacts
        );


      // ======================================================
      // IMPACTOS
      // ======================================================

      let strongest =
        0;

      let strongestEnergy =
        0;

      let strongestX =
        0;

      let strongestZ =
        0;


      for (
        const impact
        of impacts
      ) {

        const energy =
          groupEnergy[
            impact.type
          ];

        const visualStrength =
          THREE.MathUtils.clamp(
            impact.strength *
            (
              0.45 +
              energy *
              2.1
            ),
            0,
            1.5
          );


        if (
          visualStrength >
          strongest
        ) {

          strongest =
            visualStrength;

          strongestEnergy =
            energy;

          strongestX =
            impact.x;

          strongestZ =
            impact.z;

        }


        // ====================================================
        // AGENTE
        // ====================================================

        const raver =
          simulation.ravers[
            impact.index
          ];

        const visualColor =
          colorObjects[
            impact.type
          ];


        raver.traverse(
          object => {

            if (
              !object.isMesh
            ) {

              return;

            }

            if (
              object.material &&
              'emissiveIntensity'
              in object.material
            ) {

              object.material.emissiveIntensity =
                visualStrength > 0.7

                  ? 4.0 +
                    energy *
                    4.0

                  : 1.5 +
                    energy *
                    2.5;

            }

            if (
              object.material &&
              'color'
              in object.material
            ) {

              object.material.color.copy(
                visualColor
              );

            }

          }
        );


        // ====================================================
        // STROBE LOCAL
        // ====================================================

        const strobe =
          strobeLights[
            impact.type
          ];

        strobe.position.set(
          impact.x,
          3.5,
          impact.z
        );

        if (
          visualStrength >
          0.65
        ) {

          strobe.color.set(
            '#FFFFFF'
          );

        } else {

          strobe.color.copy(
            visualColor
          );

        }

        strobe.intensity =
          Math.max(
            strobe.intensity,
            1200 *
            visualStrength
          );


        // ====================================================
        // RING
        // ====================================================

        createImpactRing(
          impact.x,
          impact.z,
          impact.type,
          impact.strength,
          energy
        );

      }


      // ======================================================
      // FLASH COLECTIVO
      // ======================================================

      if (
        strongest >
        0.60
      ) {

        flashPulse =
          Math.max(
            flashPulse,
            strongest
          );

        floorPulse =
          Math.max(
            floorPulse,
            strongest *
            0.85
          );

        cameraShake =
          Math.max(
            cameraShake,
            strongest *
            0.045
          );

      }


      // ======================================================
      // FLASH BLANCO
      // ======================================================

      if (
        strongestEnergy >
        0.50
      ) {

        whiteFlash.position.set(
          strongestX,
          4.5,
          strongestZ
        );

        whiteFlash.intensity =
          Math.max(
            whiteFlash.intensity,
            1800 +
            strongestEnergy *
            1500
          );

      }


      // ======================================================
      // VISUAL BASE DE LOS AGENTES
      // ======================================================

      simulation.ravers.forEach(
        (
          raver,
          index
        ) => {

          const type =
            raver.userData.type;

          const phase =
            phases[index];

          let typePulse;

          switch (
            type
          ) {

            case 0:
              typePulse =
                Math.pow(
                  Math.max(
                    0,
                    Math.sin(
                      phase
                    )
                  ),
                  8
                );
              break;

            case 1:
              typePulse =
                0.35 +
                0.20 *
                Math.sin(
                  phase *
                  0.5
                );
              break;

            case 2:
              typePulse =
                Math.pow(
                  Math.max(
                    0,
                    Math.sin(
                      phase
                    )
                  ),
                  12
                );
              break;

            case 3:
              typePulse =
                0.20 +
                0.14 *
                Math.sin(
                  phase *
                  2
                );
              break;

            case 4:
              typePulse =
                0.35 +
                0.24 *
                Math.sin(
                  phase *
                  2
                );
              break;

            default:
              typePulse =
                0.30 +
                0.30 *
                Math.abs(
                  Math.sin(
                    phase *
                    0.5
                  )
                );

          }


          const collectiveGlow =
            R *
            0.45;

          const darkness =
            discoBlackout *
            0.88;


          raver.traverse(
            object => {

              if (
                !object.isMesh
              ) {

                return;

              }

              if (
                object.material &&
                'emissiveIntensity'
                in object.material
              ) {

                const target =
                  Math.max(
                    0.008,

                    (
                      0.03 +
                      typePulse *
                      0.42 +
                      collectiveGlow +
                      discoFlash *
                      1.2 +
                      flashPulse *
                      1.8
                    ) *
                    (
                      1 -
                      darkness
                    )
                  );

                object.material.emissiveIntensity =
                  THREE.MathUtils.lerp(
                    object.material.emissiveIntensity,
                    target,
                    Math.min(
                      1,
                      dt *
                      16
                    )
                  );

              }

              if (
                object.material &&
                'color'
                in object.material
              ) {

                object.material.color.copy(
                  colorObjects[
                    type
                  ]
                );

              }

            }

          );

        }
      );


      // ======================================================
      // RINGS
      // ======================================================

      for (
        let i =
          impactRings.length -
          1;

        i >= 0;

        i--
      ) {

        const ring =
          impactRings[i];

        ring.userData.life -=
          dt *
          (
            3.2 +
            ring.userData.collective
          );

        const life =
          ring.userData.life;

        const collective =
          ring.userData.collective;

        const expansion =
          1 +
          (
            1 -
            life
          ) *
          (
            4 +
            collective *
            14
          );

        ring.scale.set(
          expansion,
          expansion,
          expansion
        );

        ring.material.opacity =
          Math.max(
            0,
            life *
            (
              0.12 +
              collective *
              0.50
            )
          );

        if (
          life <=
          0
        ) {

          scene.remove(
            ring
          );

          ring.geometry.dispose();
          ring.material.dispose();

          impactRings.splice(
            i,
            1
          );

        }

      }


      // ======================================================
      // SELECTION
      // ======================================================

      if (
        selectedIndex >=
        0
      ) {

        const selected =
          simulation.ravers[
            selectedIndex
          ];

        selectionRing.position.set(
          selected.position.x,
          0.03,
          selected.position.z
        );

        selectionRing.scale.setScalar(
          1 +
          Math.sin(
            time *
            8
          ) *
          0.10
        );

        selectionRing.rotation.z +=
          dt *
          4;

      }


      // ======================================================
      // CAMERA
      // ======================================================

      camera.position.x =
        Math.sin(
          time *
          0.65
        ) *
        cameraShake;

      camera.position.y =
        6.5 +
        Math.cos(
          time *
          0.50
        ) *
        cameraShake;

      camera.position.z =
        16 +
        Math.sin(
          time *
          0.30
        ) *
        cameraShake;

      camera.fov =
        THREE.MathUtils.lerp(
          camera.fov,
          48 +
          flashPulse *
          2.5 +
          discoFlash *
          1.4,
          dt *
          3
        );

      camera.updateProjectionMatrix();

      orbit.update();


      // ======================================================
      // RENDER
      // ======================================================

      renderPipeline.render();

    }
  );


  // ==========================================================
  // RESIZE
  // ==========================================================

  addEventListener(
    'resize',
    () => {

      camera.aspect =
        innerWidth /
        innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        innerWidth,
        innerHeight
      );

    }
  );

}


// ============================================================
// ERROR
// ============================================================

main().catch(
  error => {

    console.error(
      error
    );

    const pre =
      document.createElement(
        'pre'
      );

    pre.style.cssText = `

      position: fixed;

      inset: 16px;

      color: white;

      background: black;

      padding: 20px;

      z-index: 200;

      overflow: auto;

      white-space: pre-wrap;

      font-family: monospace;

    `;

    pre.textContent =
      String(
        error?.stack ||
        error
      );

    document.body.append(
      pre
    );

  }
);
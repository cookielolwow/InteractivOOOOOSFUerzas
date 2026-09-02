import * as THREE from 'three/webgpu';

import {
  OrbitControls
} from 'three/addons/controls/OrbitControls.js';

import WebGPU from 'three/addons/capabilities/WebGPU.js';

import {
  pass
} from 'three/tsl';

import {
  bloom
} from 'three/addons/tsl/display/BloomNode.js';

import './styles.css';

import {
  createParameters
} from './simulation/parameters.js';

import {
  createSimulation
} from './simulation/createSimulation.js';

import {
  createDanceFloor
} from './floor/Dancefloor.js';

import {
  createLabPanel
} from './ui/labPanel.js';


// ============================================================
// CONFIG
// ============================================================

const NUM_AGENTS =
  96;

const BASE_BPM =
  138;

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


let omegaSpread =
  1.0;


// ============================================================
// VISUAL
// ============================================================

let ambient =
  null;

let floorMaterial =
  null;

let bloomPass =
  null;

let visualMode =
  1;

let jumpAmount =
  1.0;

let floorPulse =
  0;

let cameraShake =
  0;

let cameraIntensity =
  1.0;


// ============================================================
// COLORES
// ============================================================

const raveColors = [

  '#FF1493',
  '#8A4DFF',
  '#00FF00',
  '#00FFFF',
  '#FF00FF',
  '#7CFF00'

];


const colorObjects =
  raveColors.map(
    color =>
      new THREE.Color(
        color
      )
  );


// ============================================================
// BACKGROUND
// ============================================================

const backgroundColor =
  new THREE.Color(
    '#030305'
  );


// ============================================================
// ESTADOS
// ============================================================

let collectiveState =
  'DESORDEN';


// ============================================================
// LUCES
// ============================================================

const clubLights =
  [];

const overheadLights =
  [];


// ============================================================
// VISUALES
// ============================================================

const discoBands =
  [];

const laserPlanes =
  [];

const impactRings =
  [];


// ============================================================
// AUDIO
// ============================================================

let audioCtx =
  null;

let masterGain =
  null;

let compressor =
  null;

let distortion =
  null;

let noiseBuffer =
  null;

let musicStarted =
  false;

let musicStartTime =
  0;

let lastScheduledBeat =
  -1;

let lastScheduledEighth =
  -1;

let lastScheduledSixteenth =
  -1;


// ============================================================
// FRECUENCIAS NATURALES
// ============================================================

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

      types[i] =
        0;

      bpm =
        138;

    } else if (
      i < 60
    ) {

      types[i] =
        1;

      bpm =
        69;

    } else if (
      i < 78
    ) {

      types[i] =
        2;

      bpm =
        138;

    } else if (
      i < 108
    ) {

      types[i] =
        3;

      bpm =
        276;

    } else if (
      i < 126
    ) {

      types[i] =
        4;

      bpm =
        276;

    } else {

      types[i] =
        5;

      bpm =
        207;

    }


    freqs[i] =

      2 *
      Math.PI *
      (
        bpm /
        60
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
// AUDIO SETUP
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
// DISTORSIÓN
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
        Math.random() *
        2 -
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
    .connect(
      gain
    )
    .connect(
      masterGain
    );


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
    .connect(
      filter
    )
    .connect(
      gain
    )
    .connect(
      masterGain
    );


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
    .connect(
      filter
    )
    .connect(
      gain
    )
    .connect(
      masterGain
    );


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
    .connect(
      filter
    )
    .connect(
      gain
    )
    .connect(
      masterGain
    );


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

    [
      0.000,
      2100,
      0.30,
      0.028
    ],

    [
      0.012,
      3300,
      0.22,
      0.023
    ],

    [
      0.026,
      1800,
      0.18,
      0.034
    ],

    [
      0.042,
      1200,
      0.08,
      0.045
    ]

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
        .connect(
          filter
        )
        .connect(
          gain
        )
        .connect(
          masterGain
        );


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
    .connect(
      filter
    )
    .connect(
      highpass
    )
    .connect(
      gain
    )
    .connect(
      masterGain
    );


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
        .connect(
          filter
        )
        .connect(
          gain
        )
        .connect(
          masterGain
        );


      osc.start(t);


      osc.stop(
        t + 0.09
      );

    }
  );

}


// ============================================================
// BUILD
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
    .connect(
      filter
    )
    .connect(
      gain
    )
    .connect(
      masterGain
    );


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

  }

}


// ============================================================
// AUDIO SCHEDULER
// ============================================================

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


  // ==========================================================
  // BEAT
  // ==========================================================

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

  }


  // ==========================================================
  // EIGHTHS
  // ==========================================================

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
      subdivision %
      2 ===
      0
    ) {

      playHat(
        0.35 +
        R *
        0.50
      );

    } else if (
      R > 0.35
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
        R > 0.30
      ) {

        playOpenHat(
          0.35 +
          R *
          0.60
        );

      }

    }


    if (
      R > 0.22
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


  // ==========================================================
  // SIXTEENTHS
  // ==========================================================

  if (
    sixteenthIndex >
    lastScheduledSixteenth
  ) {

    lastScheduledSixteenth =
      sixteenthIndex;


    if (
      R > 0.60
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
      R > 0.72 &&
      sixteenthIndex %
      32 ===
      28
    ) {

      playBuildNoise(
        R
      );

    }

  }

}


// ============================================================
// DISCO VISUALS
// ============================================================

function createDiscoVisuals(
  scene
) {

  // ==========================================================
  // ONDAS
  // ==========================================================

  const ringGeometry =
    new THREE.RingGeometry(

      3.5,

      3.54,

      96

    );


  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const material =
      new THREE.MeshBasicMaterial({

        color:
          raveColors[
            i
          ],

        transparent:
          true,

        opacity:
          0,

        side:
          THREE.DoubleSide,

        depthWrite:
          false

      });


    const ring =
      new THREE.Mesh(

        ringGeometry,

        material

      );


    ring.rotation.x =
      -Math.PI / 2;


    ring.position.y =
      0.025;


    ring.userData.baseScale =
      1 +
      i *
      1.8;


    scene.add(
      ring
    );


    discoBands.push(
      ring
    );

  }


  // ==========================================================
  // LÁSERES
  // ==========================================================

  for (
    let i = 0;
    i < 6;
    i++
  ) {

    const geometry =
      new THREE.PlaneGeometry(

        0.05,

        34

      );


    const material =
      new THREE.MeshBasicMaterial({

        color:
          raveColors[
            i
          ],

        transparent:
          true,

        opacity:
          0,

        side:
          THREE.DoubleSide,

        depthWrite:
          false

      });


    const plane =
      new THREE.Mesh(

        geometry,

        material

      );


    plane.position.y =
      6;


    plane.rotation.z =
      (
        Math.PI *
        2 /
        6
      ) *
      i;


    scene.add(
      plane
    );


    laserPlanes.push(
      plane
    );

  }

}


// ============================================================
// CLUB LIGHTING
// ============================================================

function updateClubLighting(
  elapsed,
  R
) {

  // ==========================================================
  // ESTADO -> COLOR
  // ==========================================================

  let hue =
    0.74;


  if (
    collectiveState ===
    'PARCIAL'
  ) {

    hue =
      0.81;

  }


  if (
    collectiveState ===
    'ESTABLE'
  ) {

    hue =
      0.28;

  }


  backgroundColor.setHSL(

    hue,

    0.84,

    0.006 +
    R *
    0.014

  );


  // ==========================================================
  // AMBIENTE
  // ==========================================================

  ambient.intensity =

    0.12 +
    R *
    0.08;


  // ==========================================================
  // PISO
  // ==========================================================

  floorMaterial.emissiveIntensity =

    0.008 +

    R *
    0.025 +

    floorPulse *
    0.035;


  // ==========================================================
  // BEAT VISUAL
  // ==========================================================

  const beatPosition =

    (
      elapsed %
      BEAT_SECONDS
    ) /
    BEAT_SECONDS;


  const beatPulse =

    Math.pow(

      Math.max(

        0,

        Math.sin(

          beatPosition *
          Math.PI *
          2

        )

      ),

      8

    );


  // ==========================================================
  // LUCES LATERALES
  // ==========================================================

  for (
    let i = 0;
    i < clubLights.length;
    i++
  ) {

    const light =
      clubLights[i];


    const localPulse =

      Math.pow(

        Math.max(

          0,

          Math.sin(

            beatPosition *
            Math.PI *
            2 +
            i *
            0.9

          )

        ),

        7

      );


    light.intensity =

      120 +

      localPulse *
      (
        400 +
        R *
        700
      );


    light.color.copy(

      colorObjects[

        i %
        colorObjects.length

      ]

    );


    light.position.y =

      4.5 +

      Math.sin(

        elapsed *
        0.65 +
        i

      ) *
      0.4;

  }


  // ==========================================================
  // LUCES DE TECHO
  // ==========================================================

  for (
    let i = 0;
    i < overheadLights.length;
    i++
  ) {

    const light =
      overheadLights[i];


    light.target.position.x =

      Math.sin(

        elapsed *
        (
          0.25 +
          i *
          0.02
        )

      ) *
      10;


    light.target.position.z =

      Math.cos(

        elapsed *
        0.20 +
        i *
        0.8

      ) *
      7;


    const pulse =

      Math.pow(

        Math.max(

          0,

          Math.sin(

            beatPosition *
            Math.PI *
            2 +
            i *
            0.7

          )

        ),

        5

      );


    light.intensity =

      70 +

      pulse *
      (
        500 +
        R *
        700
      );

  }


  // ==========================================================
  // LÁSERES
  // ==========================================================

  laserPlanes.forEach(

    (
      plane,
      index
    ) => {

      plane.rotation.z =

        elapsed *
        (
          0.06 +
          index *
          0.01
        ) +

        index *
        1.05;


      plane.material.opacity =

        0.04 +

        beatPulse *
        (
          0.12 +
          R *
          0.15
        );

    }

  );


  // ==========================================================
  // ONDAS
  // ==========================================================

  discoBands.forEach(

    (
      band,
      index
    ) => {

      const wave =

        Math.max(

          0,

          Math.sin(

            beatPosition *
            Math.PI *
            2 -

            index *
            0.8

          )

        );


      band.scale.setScalar(

        band.userData.baseScale +

        wave *
        (
          0.12 +
          R *
          0.26
        )

      );


      band.material.opacity =

        wave *
        (
          0.045 +
          R *
          0.08
        );

    }

  );


  // ==========================================================
  // BLOOM
  // ==========================================================

  bloomPass.strength.value =

    0.025 +

    R *
    0.09 +

    beatPulse *
    0.08;

}


// ============================================================
// IMPACT RING
// ============================================================

function createImpactRing(

  scene,

  x,

  z,

  type,

  strength

) {

  const geometry =
    new THREE.RingGeometry(

      0.08,

      0.13,

      32

    );


  const material =
    new THREE.MeshBasicMaterial({

      color:
        raveColors[type],

      transparent:
        true,

      opacity:
        0.32 +
        strength *
        0.30,

      side:
        THREE.DoubleSide,

      depthWrite:
        false

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

    0.035,

    z

  );


  ring.userData.life =
    1;


  ring.userData.strength =
    strength;


  scene.add(
    ring
  );


  impactRings.push(
    ring
  );

}


// ============================================================
// HUD
// ============================================================

function createHUD() {

  const hud =
    document.createElement(
      'div'
    );


  hud.id =
    'hud';


  hud.innerHTML = `

    <div id="state">
      ⚡ DESORDEN
    </div>

    <div id="tempo">
      ♫ ${BASE_BPM} BPM
    </div>

    <div id="r">
      R: 0.00
    </div>

    <div id="k">
      K: 0.00
    </div>

    <div id="omega">
      Ω: 1.00
    </div>

    <div id="mode">
      🎵 MODE 1
    </div>

    <div id="cameraIntensityControl" style="display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
      <label style="font-size: 11px; white-space: nowrap;">📷 CAMERA:</label>
      <input 
        type="range" 
        id="cameraIntensitySlider" 
        min="0" 
        max="200" 
        value="100" 
        style="width: 80px; cursor: pointer; accent-color: #7CFF00;"
      />
      <span id="cameraIntensityValue" style="font-size: 11px; min-width: 30px;">100%</span>
    </div>

  `;


  // ============================================================
  // CANVAS OVERLAY - ONDAS VISUALES
  // ============================================================

  const waveCanvas =
    document.createElement(
      'canvas'
    );

  waveCanvas.style.position =
    'fixed';

  waveCanvas.style.top =
    '0';

  waveCanvas.style.left =
    '0';

  waveCanvas.style.pointerEvents =
    'none';

  waveCanvas.style.zIndex =
    '100';

  waveCanvas.style.opacity =
    '0.6';

  document.body.append(
    waveCanvas
  );

  const waveCtx =
    waveCanvas.getContext(
      '2d'
    );

  function resizeWaveCanvas() {

    waveCanvas.width =
      window.innerWidth;

    waveCanvas.height =
      window.innerHeight;

  }

  resizeWaveCanvas();

  window.addEventListener(
    'resize',
    resizeWaveCanvas
  );


  document.body.append(
    hud
  );


  // ============================================================
  // EVENT LISTENERS - CAMERA INTENSITY
  // ============================================================

  const cameraSlider =
    hud.querySelector(
      '#cameraIntensitySlider'
    );

  const cameraValueDisplay =
    hud.querySelector(
      '#cameraIntensityValue'
    );

  cameraSlider.addEventListener(
    'input',
    (e) => {

      cameraIntensity =
        parseFloat(e.target.value) /
        100.0;

      cameraValueDisplay.textContent =
        Math.round(
          e.target.value
        ) +
        '%';

    }
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
      ),

    mode:
      hud.querySelector(
        '#mode'
      )

  };

}


// ============================================================
// MAIN
// ============================================================

async function main() {

  // ==========================================================
  // WEBGPU
  // ==========================================================

  if (
    !WebGPU.isAvailable()
  ) {

    throw new Error(
      'Este proyecto requiere WebGPU.'
    );

  }


  // ==========================================================
  // APP
  // ==========================================================

  const mount =
    document.querySelector(
      '#app'
    );


  if (!mount) {

    throw new Error(
      'No existe #app.'
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

      '#030305',

      0.030

    );


  // ==========================================================
  // FLOOR
  // ==========================================================

  const floorGeometry =
    new THREE.PlaneGeometry(

      48,

      34

    );


  floorMaterial =
    new THREE.MeshStandardMaterial({

      color:
        '#050608',

      metalness:
        0.95,

      roughness:
        0.22,

      transparent:
        true,

      opacity:
        0

    });


  floorMaterial.emissive =
    new THREE.Color(
      '#111A12'
    );


  floorMaterial.emissiveIntensity =
    0.01;


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
  // DANCE FLOOR — TILES DE AJEDREZ
  // ==========================================================

  const danceFloor =
    createDanceFloor(
      scene
    );


  // ==========================================================
  // DISCO
  // ==========================================================

  createDiscoVisuals(
    scene
  );


  // ==========================================================
  // AMBIENT
  // ==========================================================

  ambient =
    new THREE.AmbientLight(

      '#7CFF00',

      0.15

    );


  scene.add(
    ambient
  );


  // ==========================================================
  // CLUB LIGHTS
  // ==========================================================

  const clubLightColors = [

    '#00FF00',
    '#FF1493',
    '#00FFFF',
    '#7CFF00'

  ];


  for (
    let i = 0;
    i < 8;
    i++
  ) {

    const light =
      new THREE.PointLight(

        clubLightColors[
          i % clubLightColors.length
        ],

        200,

        50,

        2

      );


    const angle =
      (Math.PI * 2 / 8) * i;

    light.position.set(

      Math.cos(angle) * 12,

      3 + Math.sin(i * 0.5) * 2,

      Math.sin(angle) * 12

    );


    scene.add(
      light
    );


    clubLights.push(
      light
    );

  }


  // ==========================================================
  // TECHO
  // ==========================================================

  for (
    let i = 0;
    i < 8;
    i++
  ) {

    const light =
      new THREE.SpotLight(

        i %
        2 ===
        0

          ? '#7CFF00'

          : '#FF1493',

        110,

        38,

        Math.PI / 7,

        0.65,

        1

      );


    light.position.set(

      (
        i %
        4 -
        1.5
      ) *
      7,

      9,

      Math.floor(
        i / 4
      ) === 0
        ? -7
        : 7

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


    overheadLights.push(
      light
    );

  }


  // ==========================================================
  // CAMERA
  // ==========================================================

  const camera =
    new THREE.PerspectiveCamera(

      52,

      innerWidth /
      innerHeight,

      0.1,

      120

    );


  camera.position.set(

    0,

    7.6,

    17

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


  bloomPass =
    bloom(

      sceneColor,

      0.08,

      0.35,

      0.98

    );


  renderPipeline.outputNode =
    sceneColor.add(
      bloomPass
    );


  // ==========================================================
  // ORBIT
  // ==========================================================

  const controls =
    new OrbitControls(

      camera,

      renderer.domElement

    );


  controls.target.set(

    0,

    0.8,

    0

  );


  controls.enableDamping =
    true;


  controls.dampingFactor =
    0.06;


  // ==========================================================
  // PARAMETERS
  // ==========================================================

  const params =
    createParameters();


  // ==========================================================
  // SIMULATION
  // ==========================================================

  const simulation =
    await createSimulation({

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
  // RAYCAST
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

        0.48,

        0.54,

        32

      ),

      new THREE.MeshBasicMaterial({

        color:
          '#FFFFFF',

        transparent:
          true,

        opacity:
          0.75,

        side:
          THREE.DoubleSide,

        depthWrite:
          false

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
  // GLOBAL DROP
  // ==========================================================

  function triggerDrop() {

    params.dropActive.value =
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


    floorPulse =
      1;


    cameraShake =
      0.10;


    setTimeout(

      () => {

        params.dropActive.value =
          0;

      },

      280

    );

  }


  // ==========================================================
  // UI
  // ==========================================================

  createLabPanel({

    params,

    omegaSpread,

    jumpAmount,


    onKChange:
      value => {

        params.couplingK.value =
          value;

      },


    onOmegaChange:
      value => {

        omegaSpread =
          value;

        updateNaturalFrequencies();

      },


    onJumpChange:
      value => {

        jumpAmount =
          value;

      },


    onDrop:
      triggerDrop,


    onModeChange:
      mode => {

        visualMode =
          mode;

        simulation.setVisualMode(
          mode
        );

      }

  });


  // ==========================================================
  // INICIO DEL AUDIO
  // ==========================================================

  addEventListener(

    'pointerdown',

    () => {

      startMusic();

    }

  );


  // ==========================================================
  // CLICK INDIVIDUAL
  // ==========================================================

  renderer.domElement.addEventListener(

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


      const hits =

        raycaster.intersectObjects(

          simulation.selectableMeshes,

          false

        );


      if (
        !hits.length
      ) {

        return;

      }


      const index =

        hits[0]
          .object
          .userData
          .index;


      if (
        index ===
        undefined
      ) {

        return;

      }


      selectedIndex =
        index;


      // ======================================================
      // PERTURBACIÓN INDIVIDUAL
      // ======================================================

      phases[index] +=

        Math.PI *
        1.5;


      selectionRing.visible =
        true;


      cameraShake =
        Math.max(

          cameraShake,

          0.035

        );

    }

  );


  // ==========================================================
  // KEYBOARD
  // ==========================================================

  addEventListener(

    'keydown',

    event => {

      // ======================================================
      // K
      // ======================================================

      if (
        event.key === '['
      ) {

        params.couplingK.value =

          Math.max(

            0,

            params.couplingK.value -
            0.1

          );

      }


      if (
        event.key === ']'
      ) {

        params.couplingK.value =

          Math.min(

            30,

            params.couplingK.value +
            0.1

          );

      }


      // ======================================================
      // OMEGA
      // ======================================================

      if (
        event.key === '-'
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
        event.key === '='
      ) {

        omegaSpread =

          Math.min(

            2,

            omegaSpread +
            0.05

          );


        updateNaturalFrequencies();

      }


      // ======================================================
      // GLOBAL DROP
      // ======================================================

      if (
        event.code ===
        'Space'
      ) {

        event.preventDefault();

        triggerDrop();

      }


      // ======================================================
      // VISTAS
      // ======================================================

      if (
        event.key ===
        '1'
      ) {

        visualMode =
          1;

        simulation.setVisualMode(
          1
        );

      }


      if (
        event.key ===
        '2'
      ) {

        visualMode =
          2;

        simulation.setVisualMode(
          2
        );

      }

    }

  );


  // ==========================================================
  // CLOCK
  // ==========================================================

  const clock =
    new THREE.Clock();


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
            i === j
          ) {

            continue;

          }


          couplingSum +=

            Math.sin(

              phases[j] -
              phases[i]

            );

        }


        let omega =
          freqs[i];


        // ====================================================
        // PERTURBACIÓN GLOBAL
        // ====================================================

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


        // ====================================================
        // KURAMOTO
        // ====================================================

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
      // ORDER PARAMETER
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
      // ESTADOS DEL RETO
      // ======================================================

      if (
        R < 0.25
      ) {

        collectiveState =
          'DESORDEN';

      } else if (
        R < 0.65
      ) {

        collectiveState =
          'PARCIAL';

      } else {

        collectiveState =
          'ESTABLE';

      }


      // ======================================================
      // HUD
      // ======================================================

      hud.state.textContent =
        collectiveState;


      hud.tempo.textContent =
        `${BASE_BPM} BPM`;


      hud.r.textContent =
        `R ${R.toFixed(2)}`;


      hud.k.textContent =
        `K ${K.toFixed(2)}`;


      hud.omega.textContent =
        `Ω ${omegaSpread.toFixed(2)}`;


      hud.mode.textContent =

        visualMode ===
        1

          ? 'MODE 1 · CROWD'

          : 'MODE 2 · GROUPS';


      // ======================================================
      // AUDIO
      // ======================================================

      updateMusic(
        R
      );


      // ======================================================
      // SIMULACIÓN
      // ======================================================

      const impacts =

        simulation.stepSimulation({

          phases,

          dt,

          jumpAmount

        });


      // ======================================================
      // ATERRIZAJES
      // ======================================================

      const groupEnergy = [0, 0, 0, 0, 0, 0];

      for (const impact of impacts) {
        groupEnergy[impact.type] = Math.max(
          groupEnergy[impact.type],
          impact.strength
        );
      }

      for (
        const impact
        of impacts
      ) {

        createImpactRing(

          scene,

          impact.x,

          impact.z,

          impact.type,

          impact.strength

        );


        const energy = groupEnergy[impact.type];
        const visualStrength = THREE.MathUtils.clamp(
          impact.strength * (0.45 + energy * 2.1),
          0,
          1.5
        );

        if (impact.index !== undefined && simulation.ravers && simulation.ravers[impact.index]) {
          const raver = simulation.ravers[impact.index];
          raver.traverse(object => {
            if (object.material && 'emissiveIntensity' in object.material) {
              object.material.emissiveIntensity = visualStrength > 0.7
                ? 4.0 + energy * 4.0
                : 1.5 + energy * 2.5;
            }
          });
        }

        floorPulse =

          Math.max(

            floorPulse,

            impact.strength *
            0.55

          );


        cameraShake =

          Math.max(

            cameraShake,

            impact.strength *
            0.020

          );

      }


      // ======================================================
      // CLUB
      // ======================================================

      const musicElapsed =

        musicStarted &&
        audioCtx

          ? audioCtx.currentTime -
            musicStartTime

          : time;


      updateClubLighting(

        musicElapsed,

        R

      );


      // ======================================================
      // DANCE FLOOR
      // ======================================================

      danceFloor.update({

        elapsed:
          musicElapsed,

        beatSeconds:
          BEAT_SECONDS,

        R,

        floorPulse

      });


      // ======================================================
      // IMPACT RINGS
      // ======================================================

      for (
        let i =
          impactRings.length - 1;

        i >= 0;

        i--
      ) {

        const ring =
          impactRings[i];


        ring.userData.life -=

          dt *
          3.0;


        const life =
          ring.userData.life;


        const strength =
          ring.userData.strength;


        const scale =

          1 +

          (
            1 -
            life
          ) *

          (
            3 +
            strength *
            5
          );


        ring.scale.setScalar(
          scale
        );


        ring.material.opacity =

          Math.max(

            0,

            life *
            (
              0.16 +
              strength *
              0.42
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
      // SELECCIÓN
      // ======================================================

      if (
        selectedIndex >=
        0
      ) {

        const selected =
          simulation.ravers[
            selectedIndex
          ];


        if (
          selected
        ) {

          const object =
            selected.object;


          selectionRing.position.set(

            object.position.x,

            0.035,

            object.position.z

          );


          selectionRing.scale.setScalar(

            1 +

            Math.sin(

              time *
              8

            ) *

            0.08

          );


          selectionRing.rotation.z +=

            dt *
            3;

        }

      }


      // ======================================================
      // CÁMARA - PUM PUM AL RITMO DEL BPM
      // ======================================================

      // Oscilación vertical INTENSA al beat
      const beatPhaseForCamera =
        (time / BEAT_SECONDS) *
        Math.PI *
        2;

      const cameraHeightPulse =
        Math.sin(
          beatPhaseForCamera
        ) *
        1.2 *
        cameraIntensity;

      // Pum pum extra en el impacto
      const pumpEffect =
        Math.pow(
          Math.max(
            0,
            Math.sin(
              beatPhaseForCamera
            )
          ),
          3
        ) *
        1.8 *
        cameraIntensity;

      // Oscilación horizontal MÁS activa
      const cameraSwayPhase =
        (time / BEAT_SECONDS) *
        Math.PI *
        2;

      const cameraSway =
        (
          Math.sin(
            cameraSwayPhase *
            0.5
          ) *
          2.2 +
          Math.sin(
            cameraSwayPhase *
            1.3
          ) *
          1.1
        ) *
        cameraIntensity;

      // Oscilación frontal-posterior
      const cameraDepthPulse =
        Math.cos(
          beatPhaseForCamera
        ) *
        0.9 *
        cameraIntensity;

      camera.position.x =

        Math.sin(

          time *
          0.60

        ) *

        cameraShake +

        cameraSway;


      camera.position.y =

        7.6 +

        Math.cos(

          time *
          0.48

        ) *

        cameraShake +

        cameraHeightPulse +

        pumpEffect;


      camera.position.z =
        17 +
        cameraDepthPulse;


      camera.updateProjectionMatrix();


      controls.update();


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

      inset: 12px;

      z-index: 30000;

      padding: 20px;

      background: #000;

      color: #fff;

      overflow: auto;

      font-family: monospace;

      white-space: pre-wrap;

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
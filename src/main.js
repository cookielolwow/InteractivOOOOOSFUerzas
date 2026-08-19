import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPU from 'three/addons/capabilities/WebGPU.js';
import './styles.css';

import { createParameters } from './simulation/parameters.js';
import { createSimulation } from './simulation/createSimulation.js';
import { createLabPanel } from './ui/labPanel.js';

const PARTICLE_COUNT = 131072;

async function main() {

  const mount = document.querySelector('#app');

  if (!WebGPU.isAvailable()) {
    mount.appendChild(WebGPU.getErrorMessage());
    throw new Error(
      'Este proyecto requiere WebGPU para ejecutar compute shaders.'
    );
  }

  // ============================================================
  // SCENE
  // ============================================================

  const scene = new THREE.Scene();
scene.background = new THREE.Color('#030014');

scene.fog = new THREE.FogExp2(
  '#030014',
  0.035
);
  const camera = new THREE.PerspectiveCamera(
    50,
    innerWidth / innerHeight,
    0.05,
    100
  );

  camera.position.set(0, 0, 11);

  const renderer = new THREE.WebGPURenderer({
    antialias: true
  });

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  mount.appendChild(renderer.domElement);

  await renderer.init();

  // ============================================================
  // CAMERA
  // ============================================================

  const orbit = new OrbitControls(
    camera,
    renderer.domElement
  );

  orbit.enableDamping = true;
  orbit.target.set(0, 0, 0);

  // ============================================================
  // PARAMETERS + SIMULATION
  // ============================================================

  const params = createParameters();

  const simulation = createSimulation({
    renderer,
    scene,
    params,
    count: PARTICLE_COUNT
  });

  // ============================================================
  // LAB HELPERS
  // ============================================================

  const attractorHelper = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    new THREE.MeshBasicMaterial({
      color: '#ffffff'
    })
  );

  scene.add(attractorHelper);

  const axes = new THREE.AxesHelper(1.5);
  scene.add(axes);

  // ============================================================
  // POINTER → WORLD
  // ============================================================

  const pointerNdc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  const interactionPlane = new THREE.Plane(
    new THREE.Vector3(0, 0, 1),
    0
  );

  const hit = new THREE.Vector3();

  addEventListener('pointermove', (event) => {

    pointerNdc.x =
      (event.clientX / innerWidth) * 2 - 1;

    pointerNdc.y =
      -(event.clientY / innerHeight) * 2 + 1;

    raycaster.setFromCamera(
      pointerNdc,
      camera
    );

    if (
      raycaster.ray.intersectPlane(
        interactionPlane,
        hit
      )
    ) {
      params.attractor.value.copy(hit);
      attractorHelper.position.copy(hit);
    }
  });

  // ============================================================
  // MODE
  // ============================================================

  let paused = false;
  let mode = 'LAB';
  let panel;

  const hud = document.createElement('div');
  hud.className = 'hud';
  document.body.append(hud);

  // ============================================================
  // PRESETS — SOLO LAB
  // ============================================================

  const applyPreset = (id) => {

    params.windEnabled.value = 0;
    params.radialEnabled.value = 0;
    params.vortexEnabled.value = 0;
    params.dragEnabled.value = 0;
    params.recoverEnabled.value = 0;

    params.wind.value.set(0, 0, 0);

    params.initialSpeed.value = 0;

    if (id === 'inertia') {

      params.initialSpeed.value = 0.8;

    } else if (id === 'wind') {

      params.windEnabled.value = 1;
      params.wind.value.set(1.5, 0, 0);

    } else if (id === 'attract') {

      params.radialEnabled.value = 1;
      params.radialStrength.value = 3.0;

    } else if (id === 'repel') {

      params.radialEnabled.value = 1;
      params.radialStrength.value = -3.0;

    } else if (id === 'vortex') {

      params.radialEnabled.value = 1;
      params.radialStrength.value = 1.0;

      params.vortexEnabled.value = 1;
      params.vortexStrength.value = 3.0;

      params.dragEnabled.value = 1;
      params.dragCoefficient.value = 0.08;
    }

    simulation.reset();
    panel?.refresh();
  };

  // ============================================================
  // MODE SWITCH
  // ============================================================

  const setMode = (next) => {

    mode = next;

    const lab = mode === 'LAB';

    panel?.setVisible(lab);

    axes.visible = lab;
    attractorHelper.visible = lab;

    // La cámara permanece activa en ambos modos.
    orbit.enabled = true;

    hud.innerHTML = lab
      ? '<strong>LAB</strong> · P: performance · R: reset · 1–5: pruebas'
      : '';
  };

  // ============================================================
  // LAB PANEL
  // ============================================================

  panel = createLabPanel({
    params,

    onReset: () => {
      simulation.reset();
      panel?.refresh();
    },

    onPreset: applyPreset,

    onModeChange: () => {
      setMode(
        mode === 'LAB'
          ? 'PERFORMANCE'
          : 'LAB'
      );
    },

    onPauseChange: () => {
      paused = !paused;
    }
  });

  setMode('LAB');

  // ============================================================
  // PERFORMANCE CONTROLS
  // ============================================================

  const heldKeys = new Set();


  let beatEnvelope = 0;
let clapEnvelope = 0;
let voiceEnvelope = 0;
let dropEnvelope = 0;

  const PERFORMANCE_SPEED = {
    radial: 1.5,
    vortex: 1.5,
    drag: 0.20,
    wind: 1.5,
    recover: 1
  };

  const PERFORMANCE_LIMITS = {
    radial: [-8, 8],
    vortex: [-8, 8],
    drag: [0, 0.30],
    wind: [-4, 4],
    recover: [0, 4]
  };

  const performanceKeys = [
    'KeyA', 'KeyZ',
    'KeyD', 'KeyC',
    'KeyF', 'KeyV',
    'KeyG', 'KeyB',
    'KeyH', 'KeyN'
  ];

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  // ============================================================
  // KEYDOWN — ÚNICO LISTENER
  // ============================================================

  addEventListener('keydown', (event) => {

    // P = cambiar modo
    if (event.code === 'KeyP') {

      if (event.repeat) return;

      setMode(
        mode === 'LAB'
          ? 'PERFORMANCE'
          : 'LAB'
      );

      return;
    }

    // R = reset real
    // Solo se usa como herramienta explícita.
    if (event.code === 'KeyR') {

      if (event.repeat) return;

      simulation.reset();
      panel?.refresh();

      return;
    }


// PERFORMANCE
// ============================================================
// PERFORMANCE INPUT
// ============================================================

if (mode === 'PERFORMANCE') {

  // ----------------------------------------------------------
  // EVENTOS
  // Se disparan una sola vez por pulsación.
  // ----------------------------------------------------------

  // J = BEAT / PUM
  if (event.code === 'KeyJ') {
    if (event.repeat) return;

    event.preventDefault();
    beatEnvelope = 1.0;
    return;
  }

  // K = CLAP
  if (event.code === 'KeyK') {
    if (event.repeat) return;

    event.preventDefault();
    clapEnvelope = 1.0;
    return;
  }

  // L = VOICE
  if (event.code === 'KeyL') {
    if (event.repeat) return;

    event.preventDefault();
    voiceEnvelope = 1.0;
    return;
  }

  // SPACE = DROP
  if (event.code === 'Space') {
    if (event.repeat) return;

    event.preventDefault();
    dropEnvelope = 1.0;
    return;
  }

  // ----------------------------------------------------------
  // FADERS
  // Se mantienen activos mientras la tecla está presionada.
  // ----------------------------------------------------------

  if (performanceKeys.includes(event.code)) {
    heldKeys.add(event.code);
  }

  return;
}


    // LAB
    if (event.repeat) return;

    if (event.code === 'Digit1') {
      applyPreset('inertia');
    }

    if (event.code === 'Digit2') {
      applyPreset('wind');
    }

    if (event.code === 'Digit3') {
      applyPreset('attract');
    }

    if (event.code === 'Digit4') {
      applyPreset('repel');
    }

    if (event.code === 'Digit5') {
      applyPreset('vortex');
    }
  });

  // ============================================================
  // KEYUP
  // ============================================================

  addEventListener('keyup', (event) => {
    heldKeys.delete(event.code);
  });

  // ============================================================
  // FOCUS SAFETY
  // ============================================================

  addEventListener('blur', () => {
    heldKeys.clear();
  });

  // ============================================================
  // PERFORMANCE UPDATE
  // ============================================================

  function updatePerformanceControls() {

    if (mode !== 'PERFORMANCE') {
      return;
    }

    const dt =
      params.dt.value *
      params.timeScale.value;

    // ----------------------------------------------------------
    // ATTRACT / REPEL
    // A = subir
    // Z = bajar
    // ----------------------------------------------------------

    if (heldKeys.has('KeyA')) {

      params.radialEnabled.value = 1;

      params.radialStrength.value = clamp(
        params.radialStrength.value +
          PERFORMANCE_SPEED.radial * dt,

        ...PERFORMANCE_LIMITS.radial
      );
    }

    if (heldKeys.has('KeyZ')) {

      params.radialEnabled.value = 1;

      params.radialStrength.value = clamp(
        params.radialStrength.value -
          PERFORMANCE_SPEED.radial * dt,

        ...PERFORMANCE_LIMITS.radial
      );
    }

    // ----------------------------------------------------------
    // VORTEX
    // D = subir
    // C = bajar
    // ----------------------------------------------------------

    if (heldKeys.has('KeyD')) {

      params.vortexEnabled.value = 1;

      params.vortexStrength.value = clamp(
        params.vortexStrength.value +
          PERFORMANCE_SPEED.vortex * dt,

        ...PERFORMANCE_LIMITS.vortex
      );
    }

    if (heldKeys.has('KeyC')) {

      params.vortexEnabled.value = 1;

      params.vortexStrength.value = clamp(
        params.vortexStrength.value -
          PERFORMANCE_SPEED.vortex * dt,

        ...PERFORMANCE_LIMITS.vortex
      );
    }

    // ----------------------------------------------------------
    // DRAG
    // F = subir
    // V = bajar
    // ----------------------------------------------------------

    if (heldKeys.has('KeyF')) {

      params.dragEnabled.value = 1;

      params.dragCoefficient.value = clamp(
        params.dragCoefficient.value +
          PERFORMANCE_SPEED.drag * dt,

        ...PERFORMANCE_LIMITS.drag
      );
    }

    if (heldKeys.has('KeyV')) {

      params.dragCoefficient.value = clamp(
        params.dragCoefficient.value -
          PERFORMANCE_SPEED.drag * dt,

        ...PERFORMANCE_LIMITS.drag
      );

      params.dragEnabled.value =
        params.dragCoefficient.value > 0
          ? 1
          : 0;
    }

    // ----------------------------------------------------------
    // WIND
    // G = subir
    // B = bajar
    // ----------------------------------------------------------

    if (heldKeys.has('KeyG')) {

      params.windEnabled.value = 1;

      params.wind.value.x = clamp(
        params.wind.value.x +
          PERFORMANCE_SPEED.wind * dt,

        ...PERFORMANCE_LIMITS.wind
      );
    }

    if (heldKeys.has('KeyB')) {

      params.wind.value.x = clamp(
        params.wind.value.x -
          PERFORMANCE_SPEED.wind * dt,

        ...PERFORMANCE_LIMITS.wind
      );

      params.windEnabled.value =
        Math.abs(params.wind.value.x) > 0.001
          ? 1
          : 0;
    }

    // ----------------------------------------------------------
    // RECOVER
    // H = subir
    // N = bajar
    // ----------------------------------------------------------

    if (heldKeys.has('KeyH')) {

      params.recoverEnabled.value = 1;

      params.recoverStrength.value = clamp(
        params.recoverStrength.value +
          PERFORMANCE_SPEED.recover * dt,

        ...PERFORMANCE_LIMITS.recover
      );
    }

    if (heldKeys.has('KeyN')) {

      params.recoverStrength.value = clamp(
        params.recoverStrength.value -
          PERFORMANCE_SPEED.recover * dt,

        ...PERFORMANCE_LIMITS.recover
      );

      params.recoverEnabled.value =
        params.recoverStrength.value > 0.001
          ? 1
          : 0;
    }

// ============================================================
// BEAT
// J = disparar
// ============================================================

beatEnvelope *= Math.exp(-28.0 * dt);

params.beatStrength.value =
  beatEnvelope * 150.0;

params.beatEnabled.value =
  beatEnvelope > 0.002 ? 1 : 0;
// ============================================================
// CLAP
// Golpe de contracción
// ============================================================

clapEnvelope *= Math.exp(
  -params.clapDecay.value * dt
);

params.clapStrength.value =
  clapEnvelope * 150.0;

params.clapEnabled.value =
  clapEnvelope > 0.002 ? 1 : 0;


// ============================================================
// VOICE
// Perturbación larga
// ============================================================

voiceEnvelope *= Math.exp(
  -params.voiceDecay.value * dt
);

params.voiceStrength.value =
  voiceEnvelope * 50.0;

params.voiceEnabled.value =
  voiceEnvelope > 0.002 ? 1 : 0;


// ============================================================
// DROP
// Golpe grande combinado
// ============================================================

dropEnvelope *= Math.exp(
  -params.dropDecay.value * dt
);

params.dropStrength.value =
  dropEnvelope * 100.0;

params.dropEnabled.value =
  dropEnvelope > 0.002 ? 1 : 0;
  
}


  

  // ============================================================
  // RESIZE
  // ============================================================

  addEventListener('resize', () => {

    camera.aspect =
      innerWidth / innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      innerWidth,
      innerHeight
    );
  });

  // ============================================================
  // INITIAL RESET
  // ============================================================

  simulation.reset();

  // ============================================================
  // FRAME LOOP
  // ============================================================

  renderer.setAnimationLoop(() => {

    updatePerformanceControls();

    if (!paused) {
      simulation.stepSimulation();
    }

    orbit.update();

    renderer.render(
      scene,
      camera
    );
  });

}
// ============================================================
// ERROR HANDLING
// ============================================================

main().catch((error) => {

  console.error(error);

  const pre =
    document.createElement('pre');

  pre.style.cssText = `
    position: fixed;
    inset: 16px;
    white-space: pre-wrap;
    color: #fff;
    z-index: 50;
  `;

  pre.textContent =
    String(error?.stack || error);

  document.body.append(pre);
});
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPU from 'three/addons/capabilities/WebGPU.js';
import './styles.css';
import { createParameters } from './simulation/parameters.js';
import { createSimulation } from './simulation/createSimulation.js';

const NUM_AGENTS = 8; 
const phases = new Float32Array(NUM_AGENTS);
const freqs = new Float32Array(NUM_AGENTS);
const types = new Int32Array(NUM_AGENTS);

types.set([0, 0, 1, 1, 2, 2, 3, 3]);
freqs.set([4.0, 4.2, 8.0, 8.1, 6.0, 6.3, 10.0, 10.5]); 

// --- MOTOR DE AUDIO Y LUCES ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let strobeLights = [];

function playSynth(type, sceneLights) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  // Flashing lights reactivas por tipo de agente
  const flash = sceneLights[type];
  flash.intensity = 150.0; 
  
  if (type === 0) { // Kick
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.3);
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  } else if (type === 1) { // Hi-hat
    osc.type = 'square';
    osc.frequency.setValueAtTime(6000, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
  } else if (type === 2) { // Chord
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(329.63, t); // E4
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
  } else if (type === 3) { // Glitch Noise
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(Math.random() * 2000, t);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
  }
  
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(t); osc.stop(t + 0.5);
}

async function main() {
  const mount = document.querySelector('#app');
  if (!WebGPU.isAvailable()) throw new Error('Requiere WebGPU');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#020108'); // Club oscuro
  scene.fog = new THREE.FogExp2('#020108', 0.03);
  
  // --- EL ESCENARIO ---
  const floorGeo = new THREE.PlaneGeometry(40, 40);
  const floorMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.1, metalness: 0.5 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Luces de impacto (se asocian a los 4 tipos de sonidos)
  const colors = ['#F72585', '#4CC9F0', '#7209B7', '#FFE66D'];
  colors.forEach((c, i) => {
    const light = new THREE.PointLight(c, 0, 20);
    light.position.set((i - 1.5) * 4, 1, -5); // Frente al escenario
    scene.add(light);
    strobeLights.push(light);
  });

  const ambient = new THREE.AmbientLight('#222', 1.0);
  scene.add(ambient);

  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 5, 12);

  const renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  mount.appendChild(renderer.domElement);
  await renderer.init();

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.target.set(0, 1, 0);

  const params = createParameters();
  const simulation = createSimulation({ renderer, scene, params, count: 2048 });

  // --- CONTROLES PERFORMATIVOS ---
  const heldKeys = new Set();
  addEventListener('keydown', (e) => {
    if(!e.repeat) heldKeys.add(e.code);
    if(audioCtx.state === 'suspended') audioCtx.resume();
  });
  addEventListener('keyup', (e) => heldKeys.delete(e.code));

  // Raycaster para intervención individual
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  });

  const clock = new THREE.Clock();
  simulation.reset();

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    
    // Atenuar luces estroboscópicas progresivamente (Fade out)
    strobeLights.forEach(light => {
      light.intensity = Math.max(0, light.intensity - 400 * dt);
    });

    // Inputs
    if (heldKeys.has('KeyA')) params.couplingK.value = Math.min(params.couplingK.value + dt * 5, 20.0);
    if (heldKeys.has('KeyZ')) params.couplingK.value = Math.max(params.couplingK.value - dt * 5, 0.0);
    params.dropActive.value = heldKeys.has('Space') ? 1.0 : 0.0;

    // Intervención local con el puntero
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(floor);
    let targetIndex = -1;
    if (intersects.length > 0 && heldKeys.has('KeyS')) {
       // Mapear posición de piso a uno de los 8 agentes base
       const angle = Math.atan2(intersects[0].point.z, intersects[0].point.x) + Math.PI;
       targetIndex = Math.floor((angle / (Math.PI * 2)) * 8) % 8;
    }

    // UPDATE KURAMOTO
    const newPhases = new Float32Array(NUM_AGENTS);
    const K = params.couplingK.value;
    let sumCos = 0, sumSin = 0;

    for (let i = 0; i < NUM_AGENTS; i++) {
      let sum = 0;
      for (let j = 0; j < NUM_AGENTS; j++) {
        if (i !== j) sum += Math.sin(phases[j] - phases[i]);
      }
      
      let omega = freqs[i];
      if (params.dropActive.value > 0) omega += (Math.random() - 0.5) * 80.0; // Perturbación
      if (i === targetIndex) omega += 20.0; // Desincronización manual de un grupo
      
      const dTheta = omega + (K / NUM_AGENTS) * sum;
      newPhases[i] = phases[i] + dTheta * dt;

      // Disparador de salto/audio (Cuando cruzan el pico de la onda, aprox multiplos de 2PI)
      const prevCycle = Math.floor(phases[i] / (Math.PI * 2));
      const currCycle = Math.floor(newPhases[i] / (Math.PI * 2));
      if (currCycle > prevCycle) {
        playSynth(types[i], strobeLights);
      }

      sumCos += Math.cos(newPhases[i]);
      sumSin += Math.sin(newPhases[i]);
      phases[i] = newPhases[i];
    }

    // Parámetro de Orden (0 = Desorden, 1 = Organización Estable)
    const R = Math.sqrt(sumCos*sumCos + sumSin*sumSin) / NUM_AGENTS;
    
    // Comunicación del estado colectivo: Iluminación Global
    // Cuando el rave está sincronizado, la luz de sala pulsa violentamente
    ambient.intensity = 0.5 + (R * 2.5);

    params.phasesA.value.set(phases[0], phases[1], phases[2], phases[3]);
    params.phasesB.value.set(phases[4], phases[5], phases[6], phases[7]);

    simulation.stepSimulation();
    orbit.update();
    renderer.render(scene, camera);
  });
}

main().catch(console.error);
import * as THREE from 'three/webgpu';
import { uniform } from 'three/tsl';

export function createParameters() {
  return {
    // Motor de Kuramoto
    couplingK: uniform(0.0), // Fader de Acoplamiento
    
    // Fases de los 8 agentes principales (enviadas al GPU)
    phasesA: uniform(new THREE.Vector4(0, 0, 0, 0)),
    phasesB: uniform(new THREE.Vector4(0, 0, 0, 0)),
    
    // Intervenciones performativas
    dropActive: uniform(0.0),      // Caos global
    djIntervention: uniform(0.0),  // Intervención local
    targetAgent: uniform(-1.0)     // A quién apunta el puntero
  };
}
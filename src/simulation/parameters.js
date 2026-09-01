// parameters.js
import * as THREE from 'three/webgpu';
import { uniform } from 'three/tsl';

export function createParameters() {
  return {
    couplingK: uniform(0.0),
    phasesA: uniform(new THREE.Vector4(0, 0, 0, 0)),
    phasesB: uniform(new THREE.Vector4(0, 0, 0, 0)),
    dropActive: uniform(0.0),
    djIntervention: uniform(15.0)
  };
}
import * as THREE from 'three/webgpu';
import { uniform } from 'three/tsl';

export function createParameters() {
  return {
    couplingK: uniform(2.0),

    dropActive: uniform(0.0),

    jumpAmount: uniform(1.0),

    phasesA: uniform(
      new THREE.Vector4(0, 0, 0, 0)
    ),

    phasesB: uniform(
      new THREE.Vector4(0, 0, 0, 0)
    )
  };
}
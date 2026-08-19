import * as THREE from 'three/webgpu';
import { uniform } from 'three/tsl';

// Uniforms are CPU-side values that TSL exposes to the GPU.
// Changing .value does not rebuild the compute shader.
export function createParameters() {
  return {
    dt: uniform(1 / 60),
    timeScale: uniform(1.0),
    initialSpeed: uniform(0.35),
    maxSpeed: uniform(5.0),
    boundsSize: uniform(10.0),
    particleSize: uniform(0.035),

    windEnabled: uniform(0.0),
    wind: uniform(new THREE.Vector3(0.0, 0.0, 0.0)),


    volumeEnabled: uniform(1.0),
volumeRadius: uniform(1.8),
volumeStrength: uniform(1.2),

    boundaryEnabled: uniform(1.0),
boundaryStrength: uniform(1.2),
boundaryRadius: uniform(4.2),
boundarySoftness: uniform(1.0),
    radialEnabled: uniform(1.0),
    attractor: uniform(new THREE.Vector3(0.0, 0.0, 0.0)),
    radialStrength: uniform(2.2),
    softening: uniform(0.35),

    recoverEnabled: uniform(0.0),
    recoverStrength: uniform(0.0),

beatEnabled: uniform(0.0),
beatStrength: uniform(0.0),
beatDecay: uniform(8.0),

clapEnabled: uniform(0.0),
clapStrength: uniform(0.0),
clapDecay: uniform(18.0),

voiceEnabled: uniform(0.0),
voiceStrength: uniform(0.0),
voiceDecay: uniform(4.0),

dropEnabled: uniform(0.0),
dropStrength: uniform(0.0),
dropDecay: uniform(5.0),



    vortexEnabled: uniform(1.0),
    vortexStrength: uniform(3.5
    ),

    dragEnabled: uniform(1.0),
    dragCoefficient: uniform(0.12)
  };
}

import * as THREE from 'three/webgpu';
import { Fn, If, color, instanceIndex, instancedArray, max, mod, vec1, vec3, vec4, cos, sin, abs, hash } from 'three/tsl';

export function createSimulation({ renderer, scene, params, count = 2048 }) {
  
  const positionBuffer = instancedArray(count, 'vec3');
  const basePositionBuffer = instancedArray(count, 'vec3'); 
  const offsetBuffer = instancedArray(count, 'float'); 

  const initParticles = Fn(() => {
    const i = instanceIndex;
    const baseP = basePositionBuffer.element(i);
    const p = positionBuffer.element(i);
    const offset = offsetBuffer.element(i);

    // Distribución en cuadrícula (Pista de baile cuadrada)
    const gridSize = vec1(45.0); 
    const row = mod(i, gridSize);
    const col = i.div(gridSize);
    
    const x = row.mul(0.6).sub(13.5); // Espaciado entre ravers
    const z = col.mul(0.6).sub(13.5);
    
    const startPos = vec3(x, 0.0, z);
    baseP.assign(startPos);
    p.assign(startPos);
    
    // Desfase sutil para que no parezcan robots idénticos
    offset.assign(hash(i).mul(0.4));
  })().compute(count).setName('Init Dancefloor');

  const updateParticles = Fn(() => {
    const i = instanceIndex;
    const p = positionBuffer.element(i);
    const baseP = basePositionBuffer.element(i);
    const offset = offsetBuffer.element(i);

    const leaderIdx = mod(i, 8);
    const phase = vec1(0.0).toVar();

    // Asignar grupo a líder
    If(leaderIdx.equal(0), () => { phase.assign(params.phasesA.x); })
    .ElseIf(leaderIdx.equal(1), () => { phase.assign(params.phasesA.y); })
    .ElseIf(leaderIdx.equal(2), () => { phase.assign(params.phasesA.z); })
    .ElseIf(leaderIdx.equal(3), () => { phase.assign(params.phasesA.w); })
    .ElseIf(leaderIdx.equal(4), () => { phase.assign(params.phasesB.x); })
    .ElseIf(leaderIdx.equal(5), () => { phase.assign(params.phasesB.y); })
    .ElseIf(leaderIdx.equal(6), () => { phase.assign(params.phasesB.z); })
    .ElseIf(leaderIdx.equal(7), () => { phase.assign(params.phasesB.w); });

    const currentOffset = offset.mul(params.dropActive.mul(15.0).add(1.0));
    const jumpCycle = phase.add(currentOffset);
    
    // Curva de salto vigorosa (rebote agudo)
    const height = abs(sin(jumpCycle.div(2.0))).pow(2.0).mul(1.2); 
    
    p.assign(vec3(baseP.x, height, baseP.z));
  })().compute(count).setName('Kuramoto Jump');

  // Material reactivo a la luz del escenario
  const material = new THREE.MeshStandardNodeMaterial({
    roughness: 0.3,
    metalness: 0.8
  });

  material.positionNode = positionBuffer.toAttribute();

  material.colorNode = Fn(() => {
    const i = instanceIndex;
    const type = mod(i, 4); 
    const baseColor = vec4(0.0).toVar();

    If(type.equal(0), () => { baseColor.assign(vec4(color('#F72585'), 1.0)); }) // Basshead
    .ElseIf(type.equal(1), () => { baseColor.assign(vec4(color('#4CC9F0'), 1.0)); }) // Shuffler
    .ElseIf(type.equal(2), () => { baseColor.assign(vec4(color('#7209B7'), 1.0)); }) // Melodic
    .ElseIf(type.equal(3), () => { baseColor.assign(vec4(color('#FFE66D'), 1.0)); }); // Glitch

    return baseColor;
  })();

  // Cápsulas en lugar de planos para dar volumen corpóreo
  const geometry = new THREE.CapsuleGeometry(0.15, 0.4, 4, 8);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  function reset() { renderer.compute(initParticles); }
  function stepSimulation() { renderer.compute(updateParticles); }

  return { reset, stepSimulation };
}
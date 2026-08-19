import * as THREE from 'three/webgpu';

import {
  Fn,
  If,
  color,
  hash,
  instanceIndex,
  instancedArray,
  max,
  mix,
  mod,
  step,
  uint,
  uv,
  vec3,
  vec4
} from 'three/tsl';

export function createSimulation({
  renderer,
  scene,
  params,
  count = 131072
}) {

  // ============================================================
  // STATE
  // ============================================================

  const positionBuffer =
    instancedArray(count, 'vec3');

  const velocityBuffer =
    instancedArray(count, 'vec3');

  // Posición original de cada partícula.
  // Se utiliza exclusivamente para RECOVER.
  const initialPositionBuffer =
    instancedArray(count, 'vec3');


  // ============================================================
  // INITIALIZATION
  // ============================================================

  const initParticles = Fn(() => {

    const i = instanceIndex;

    const p =
      positionBuffer.element(i);

    const v =
      velocityBuffer.element(i);

    const r1 =
      hash(i.add(uint(11)));

    const r2 =
      hash(i.add(uint(23)));

    const r3 =
      hash(i.add(uint(37)));

    const r4 =
      hash(i.add(uint(53)));

    const r5 =
      hash(i.add(uint(71)));

    const r6 =
      hash(i.add(uint(89)));


    // Posición inicial aleatoria
const randomPoint = vec3(
  r1,
  r2,
  r3
).sub(0.5);

const randomLength =
  max(
    randomPoint.length(),
    0.0001
  );

const randomDirection =
  randomPoint.div(randomLength);

const randomRadius =
  hash(i.add(uint(101)))
    .pow(0.3333)
    .mul(
      params.boundsSize.mul(0.40)
    );

const initialP =
  randomDirection.mul(randomRadius);

initialPositionBuffer
  .element(i)
  .assign(initialP);

p.assign(initialP);

v.assign(
  vec3(r4, r5, r6)
    .sub(0.5)
    .mul(params.initialSpeed)
);
    // Guardamos la posición original
    initialPositionBuffer
      .element(i)
      .assign(initialP);

    // Posición actual comienza igual
    p.assign(initialP);

    // Velocidad inicial
    v.assign(
      vec3(r4, r5, r6)
        .sub(0.5)
        .mul(params.initialSpeed)
    );

  })()
    .compute(count)
    .setName('Initialize Particles');


  // ============================================================
  // UPDATE / COMPUTE
  // ============================================================

  const updateParticles = Fn(() => {

    const i = instanceIndex;

    const p =
      positionBuffer.element(i);

    const v =
      velocityBuffer.element(i);

    const initialP =
      initialPositionBuffer.element(i);

    const dt =
      params.dt.mul(params.timeScale);

    const force =
      vec3(0.0).toVar();


    // ==========================================================
    // 1. WIND
    // ==========================================================

    force.addAssign(
      params.wind.mul(
        params.windEnabled
      )
    );


// ==========================================================
// 2. RADIAL
// Positive = attraction
// Negative = repulsion
// ==========================================================

const toAttractor =
  params.attractor.sub(p);

const distance =
  max(
    toAttractor.length(),
    params.softening
  );

const radialDirection =
  toAttractor.div(distance);

const radialFalloff =
  distance.div(
    distance.add(params.softening)
  );

const radialForce =
  radialDirection
    .mul(params.radialStrength)
    .mul(radialFalloff)
    .mul(params.radialEnabled);

force.addAssign(radialForce);


// ==========================================================
// VOLUME PRESERVATION
// Evita que la masa colapse en un punto.
// Solo actúa cerca del núcleo.
// ==========================================================

const volumeRadius = params.volumeRadius;
const coreDistance = distance;

const volumeAmount = coreDistance
  .sub(volumeRadius)
  .mul(-1.0)
  .max(0.0)
  .div(volumeRadius);

const volumeDirection =
  radialDirection.negate();

const volumeForce =
  volumeDirection
    .mul(volumeAmount)
    .mul(params.volumeStrength)
    .mul(params.volumeEnabled);

force.addAssign(volumeForce);
// ==========================================================
// 3. VORTEX 3D
// Genera remolinos dentro de la masa sin forzarla
// hacia un plano central.
// ==========================================================

const center = vec3(0.0, 0.0, 0.0);

// Posición relativa al centro de la masa.
const relative = p.sub(center);

// Campo de torsión 3D.
// Cada componente genera rotación en un plano diferente.
const swirl = vec3(
  relative.y.negate().add(relative.z.mul(0.35)),
  relative.x.add(relative.z.mul(0.25)).negate(),
  relative.x.mul(0.25).sub(relative.y.mul(0.20))
);

// Normalizamos para controlar la magnitud.
const swirlLength = max(
  swirl.length(),
  0.001
);

const swirlDirection =
  swirl.div(swirlLength);

// La fuerza aumenta con vortexStrength,
// pero no depende del atractor.
const vortexForce =
  swirlDirection
    .mul(params.vortexStrength)
    .mul(params.vortexEnabled);

force.addAssign(vortexForce);

    // ==========================================================
    // 4. DRAG
    // F = -c v
    // ==========================================================

    force.addAssign(
      v
        .mul(params.dragCoefficient)
        .mul(params.dragEnabled)
        .mul(-1.0)
    );


  // ==========================================================
// 5. RECOVER
// Resorte amortiguado hacia la posición inicial.
// ==========================================================

const toInitial = initialP.sub(p);

// Fuerza de retorno
const recoverSpring =
  toInitial
    .mul(params.recoverStrength)
    .mul(params.recoverEnabled);

// Amortiguación específica del recover
const recoverDamping =
  v
    .mul(0.18)
    .mul(params.recoverStrength)
    .mul(params.recoverEnabled)
    .mul(-1.0);

force.addAssign(recoverSpring);
force.addAssign(recoverDamping);

// ==========================================================
// 6. BEAT / IMPACT
// Golpe radial breve.
// ==========================================================

const beatForce = radialDirection
  .negate()
  .mul(params.beatStrength)
  .mul(params.beatEnabled);

force.addAssign(beatForce);



// ==========================================================
// 7. CLAP
// Impulso radial hacia el centro.
// ==========================================================

const clapForce = radialDirection
  .mul(params.clapStrength)
  .mul(params.clapEnabled);

force.addAssign(clapForce);


// ==========================================================
// 8. VOICE
// Perturbación tangencial prolongada.
// ==========================================================

const voiceDirection = vec3(
  radialDirection.y.negate(),
  radialDirection.x,
  radialDirection.z.mul(0.5)
);

const voiceForce = voiceDirection
  .mul(params.voiceStrength)
  .mul(params.voiceEnabled);

force.addAssign(voiceForce);


// ==========================================================
// 9. DROP
// Gran expansión radial.
// ==========================================================

const dropForce = radialDirection
  .negate()
  .mul(params.dropStrength)
  .mul(params.dropEnabled);

force.addAssign(dropForce);




// ==========================================================
// 10. SOFT BOUNDARY
// Mantiene la masa dentro del espacio sin wrap.
// No existe una caja visible.
// ==========================================================

const boundaryDistance =
  p.length();

const boundaryAmount =
  boundaryDistance
    .sub(params.boundaryRadius)
    .max(0.0)
    .div(params.boundarySoftness);

const boundaryDirection =
  p
    .normalize()
    .mul(-10.0);

const boundaryForce =
  boundaryDirection
    .mul(boundaryAmount)
    .mul(params.boundaryStrength)
    .mul(params.boundaryEnabled);

force.addAssign(boundaryForce);
    // ==========================================================
    // INTEGRATION
    // ==========================================================

    // Unit mass:
    // a = F

    // Semi-implicit Euler:
    // 1. update velocity
    // 2. update position

    v.addAssign(
      force.mul(dt)
    );


    // Limitamos velocidad máxima
    const speed =
      v.length();

    If(
      speed.greaterThan(
        params.maxSpeed
      ),
      () => {

        v.assign(
          v
            .normalize()
            .mul(params.maxSpeed)
        );

      }
    );


    // Actualizar posición
    p.addAssign(
      v.mul(dt)
    );


    // ==========================================================
    // PERIODIC BOUNDARIES
    // ==========================================================

   
  })()
    .compute(count)
    .setName('Update Particles');


  // ============================================================
  // RENDER
  // ============================================================

  const material =
    new THREE.SpriteNodeMaterial({

      blending:
        THREE.AdditiveBlending,

      depthWrite:
        false,

      transparent:
        true

    });


  // Position comes directly from GPU state
  material.positionNode =
    positionBuffer.toAttribute();


  // Particle size
  material.scaleNode =
    params.particleSize;


  // ==========================================================
  // COLOR BY SPEED
  // ==========================================================

 material.colorNode =
  Fn(() => {

    const speed =
      velocityBuffer
        .toAttribute()
        .length();

    const t =
      speed
        .div(params.maxSpeed)
        .clamp(0.0, 1.0);

    const c1 = color('#4CC9F0'); // azul
    const c2 = color('#4361EE'); // azul intenso
    const c3 = color('#7209B7'); // violeta
    const c4 = color('#F72585'); // magenta
    const c5 = color('#FF6B6B'); // rosa/rojo
    const c6 = color('#FF9F1C'); // naranja
    const c7 = color('#FFE66D'); // amarillo

    const c12 = mix(c1, c2, t.mul(6.0).clamp(0.0, 1.0));
    const c23 = mix(c2, c3, t.sub(1.0 / 6.0).mul(6.0).clamp(0.0, 1.0));
    const c34 = mix(c3, c4, t.sub(2.0 / 6.0).mul(6.0).clamp(0.0, 1.0));
    const c45 = mix(c4, c5, t.sub(3.0 / 6.0).mul(6.0).clamp(0.0, 1.0));
    const c56 = mix(c5, c6, t.sub(4.0 / 6.0).mul(6.0).clamp(0.0, 1.0));
    const c67 = mix(c6, c7, t.sub(5.0 / 6.0).mul(6.0).clamp(0.0, 1.0));

    return vec4(
      mix(
        mix(
          mix(
            mix(
              mix(
                mix(c12, c23, step(1.0 / 6.0, t)),
                c34,
                step(2.0 / 6.0, t)
              ),
              c45,
              step(3.0 / 6.0, t)
            ),
            c56,
            step(4.0 / 6.0, t)
          ),
          c67,
          step(5.0 / 6.0, t)
        ),
        c67,
        step(5.0 / 6.0, t)
      ),
      1.0
    );

  })();


  // Circular sprite mask
  material.opacityNode =
    step(
      uv().xy.sub(0.5).length(),
      0.5
    );


  const geometry =
    new THREE.PlaneGeometry(
      1,
      1
    );

  const mesh =
    new THREE.InstancedMesh(
      geometry,
      material,
      count
    );

  mesh.frustumCulled =
    false;

  scene.add(mesh);


  // ============================================================
  // PUBLIC API
  // ============================================================

  function reset() {
    renderer.compute(
      initParticles
    );
  }


  function stepSimulation() {
    renderer.compute(
      updateParticles
    );
  }


  function dispose() {

    geometry.dispose();
    material.dispose();

    scene.remove(mesh);
  }


  return {
    count,
    positionBuffer,
    velocityBuffer,
    reset,
    stepSimulation,
    dispose
  };
}
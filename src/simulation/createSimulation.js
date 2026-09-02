import * as THREE from 'three/webgpu';

import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';


// ============================================================
// CONFIG
// ============================================================

const AGENT_HEIGHT = 2.2;


// ============================================================
// PERSONALIDADES
// ============================================================

export const PERSONALITIES = {

  KICK: 0,

  RUMBLE: 1,

  CLAP: 2,

  CLOSED_HAT: 3,

  OPEN_HAT: 4,

  ACID: 5

};


const PERSONALITY_COLORS = [

  '#FF0080',

  '#00FF00',

  '#FFFF00',

  '#00FFFF',

  '#FF00FF',

  '#7CFF00'

];


const PERSONALITY_NAMES = [

  'KICK',

  'RUMBLE',

  'CLAP',

  'CLOSED HAT',

  'OPEN HAT',

  'ACID'

];


// ============================================================
// CANTIDAD DE AGENTES POR PERSONALIDAD
// ============================================================
//
// KICK       24
// RUMBLE     16
// CLAP       12
// CLOSED HAT 20
// OPEN HAT   12
// ACID       12
//
// TOTAL      96
//
// ============================================================

const TYPE_LIMITS = [

  24,

  40,

  52,

  72,

  84,

  96

];


// ============================================================
// OBTENER TIPO
// ============================================================

function getTypeForIndex(index) {

  if (
    index <
    TYPE_LIMITS[0]
  ) {

    return 0;

  }


  if (
    index <
    TYPE_LIMITS[1]
  ) {

    return 1;

  }


  if (
    index <
    TYPE_LIMITS[2]
  ) {

    return 2;

  }


  if (
    index <
    TYPE_LIMITS[3]
  ) {

    return 3;

  }


  if (
    index <
    TYPE_LIMITS[4]
  ) {

    return 4;

  }


  return 5;

}


// ============================================================
// OFFSET DE FASE POR PERSONALIDAD
// ============================================================

function getPhaseOffset(type) {

  switch (
    type
  ) {

    case 0:

      return 0.0;


    case 1:

      return Math.PI *
        0.5;


    case 2:

      return Math.PI *
        0.5;


    case 3:

      return Math.PI *
        0.25;


    case 4:

      return Math.PI *
        0.75;


    case 5:

      return Math.PI *
        0.375;


    default:

      return 0;

  }

}


// ============================================================
// ALTURA DE SALTO
// ============================================================
//
// Todos saltan.
// La personalidad cambia principalmente mediante:
//
// - altura
// - velocidad / forma
// - color
//
// Nadie camina.
// Nadie se desplaza horizontalmente durante la simulación.
//
// ============================================================

function getJumpHeight(type) {

  switch (
    type
  ) {

    case 0:

      return 1.05;


    case 1:

      return 0.62;


    case 2:

      return 0.82;


    case 3:

      return 0.34;


    case 4:

      return 0.58;


    case 5:

      return 1.18;


    default:

      return 0.7;

  }

}


// ============================================================
// FORMA DEL SALTO
// ============================================================
//
// Un número mayor hace que el salto tenga un pico más marcado.
//
// ============================================================

function getJumpSharpness(type) {

  switch (
    type
  ) {

    case 0:

      return 8.0;


    case 1:

      return 3.5;


    case 2:

      return 11.0;


    case 3:

      return 4.5;


    case 4:

      return 5.0;


    case 5:

      return 7.0;


    default:

      return 5.0;

  }

}


// ============================================================
// DISTRIBUCIÓN UNIFORME EN GRID
// ============================================================
//
// Los agentes se distribuyen en una grid ordenada
// con pequeñas variaciones para evitar rigidez.
//
// ============================================================

function generateCrowdPositions(
  count
) {

  const positions = [];

  const width = 28;

  const depth = 20;

  // Calcular grid dimensions
  const gridCols = Math.ceil(
    Math.sqrt(count)
  );

  const gridRows = Math.ceil(
    count / gridCols
  );

  // Espaciado regular
  const spacingX =
    width /
    (gridCols + 1);

  const spacingZ =
    depth /
    (gridRows + 1);

  let index = 0;

  for (
    let row = 0;
    row < gridRows &&
    index < count;
    row++
  ) {

    for (
      let col = 0;
      col < gridCols &&
      index < count;
      col++
    ) {

      // Posición grid base
      const baseX =
        -width * 0.5 +
        spacingX *
        (col + 1);

      const baseZ =
        -depth * 0.5 +
        spacingZ *
        (row + 1);

      // Pequeño offset aleatorio
      // (no uniforme pero sin atravesarse)
      const offsetX =
        (
          Math.random() -
          0.5
        ) *
        spacingX *
        0.35;

      const offsetZ =
        (
          Math.random() -
          0.5
        ) *
        spacingZ *
        0.35;

      positions.push({

        x:
          baseX +
          offsetX,

        z:
          baseZ +
          offsetZ

      });

      index++;

    }

  }

  // Mezclar posiciones.
  //
  // Esto evita que el orden de las personalidades
  // coincida con el orden espacial.
  for (
    let i =
      positions.length - 1;

    i > 0;

    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );


    [
      positions[i],
      positions[j]
    ] = [
      positions[j],
      positions[i]
    ];

  }


  return positions;

}


// ============================================================
// MODO 2 — GRUPOS DE PERSONALIDAD
// ============================================================
//
// Modo 1:
// todos mezclados como una pista real.
//
// Modo 2:
// cada personalidad ocupa una zona distinta.
//
// IMPORTANTE:
// siguen saltando.
// No caminan.
// No hacen coreografías.
// No se desplazan durante la simulación.
//
// ============================================================

function generateGroupedPositions(
  count
) {

  const positions = [];


  const groupCenters = [

    {
      x: -6.0,
      z: -2.6
    },

    {
      x: -2.2,
      z: 2.5
    },

    {
      x: 2.0,
      z: -2.4
    },

    {
      x: 5.5,
      z: 2.5
    },

    {
      x: 4.6,
      z: -1.6
    },

    {
      x: -5.0,
      z: 2.6
    }

  ];


  // ==========================================================
  // CANTIDAD REAL POR PERSONALIDAD
  // ==========================================================
  //
  // Se calcula a partir de TYPE_LIMITS (la misma fuente que
  // usa getTypeForIndex) para que el agrupamiento SIEMPRE
  // coincida con la personalidad real de cada raver, sin
  // importar cuántos agentes tenga la simulación.
  //
  // ==========================================================

  const typeCounts =
    TYPE_LIMITS.map(
      (limit, i) =>
        limit -
        (
          i === 0
            ? 0
            : TYPE_LIMITS[i - 1]
        )
    );


  for (
    let type = 0;
    type < 6;
    type++
  ) {

    const center =
      groupCenters[type];


    const amount =
      typeCounts[type];


    for (
      let i = 0;
      i < amount;
      i++
    ) {

      const angle =
        Math.random() *
        Math.PI *
        2;


      const radius =
        Math.sqrt(
          Math.random()
        ) *
        2.1;


      let x =
        center.x +
        Math.cos(
          angle
        ) *
        radius +
        (
          Math.random() -
          0.5
        ) *
        0.5;


      let z =
        center.z +
        Math.sin(
          angle
        ) *
        radius +
        (
          Math.random() -
          0.5
        ) *
        0.5;


      x =
        THREE.MathUtils.clamp(
          x,
          -8.8,
          8.8
        );


      z =
        THREE.MathUtils.clamp(
          z,
          -5.8,
          5.8
        );


      positions.push({

        x,

        z

      });

    }

  }


  return positions;

}


// ============================================================
// CORRECCIÓN DE SOLAPAMIENTO INICIAL
// ============================================================
//
// MUY IMPORTANTE:
//
// Esto NO obliga a que todos estén a la misma distancia.
//
// Solo corrige situaciones donde dos agentes literalmente
// empiezan uno dentro del otro.
//
// Se ejecuta únicamente al crear/cambiar la distribución.
//
// ============================================================

function resolveInitialOverlaps(
  positions
) {

  const minDistance =
    1.05;


  for (
    let pass = 0;
    pass < 5;
    pass++
  ) {

    for (
      let i = 0;
      i < positions.length;
      i++
    ) {

      for (
        let j = i + 1;
        j < positions.length;
        j++
      ) {

        const a =
          positions[i];


        const b =
          positions[j];


        let dx =
          b.x -
          a.x;


        let dz =
          b.z -
          a.z;


        let distance =
          Math.sqrt(
            dx * dx +
            dz * dz
          );


        // Si dos puntos quedaron exactamente
        // encima del otro, crear un pequeño offset.
        if (
          distance <
          0.0001
        ) {

          dx =
            (
              Math.random() -
              0.5
            ) *
            0.01;


          dz =
            (
              Math.random() -
              0.5
            ) *
            0.01;


          distance =
            Math.sqrt(
              dx * dx +
              dz * dz
            );

        }


        if (
          distance >=
          minDistance
        ) {

          continue;

        }


        const overlap =
          minDistance -
          distance;


        const nx =
          dx /
          distance;


        const nz =
          dz /
          distance;


        // Empujar solo lo necesario.
        const push =
          overlap *
          0.5;


        a.x -=
          nx *
          push;


        a.z -=
          nz *
          push;


        b.x +=
          nx *
          push;


        b.z +=
          nz *
          push;

      }

    }

  }

}


// ============================================================
// NORMALIZAR MODELO
// ============================================================

function normalizeModel(
  object,
  targetHeight =
    AGENT_HEIGHT
) {

  const box =
    new THREE.Box3()
      .setFromObject(
        object
      );


  const size =
    new THREE.Vector3();


  box.getSize(
    size
  );


  if (
    size.y >
      0 &&
    Number.isFinite(
      size.y
    )
  ) {

    const scale =
      targetHeight /
      size.y;


    object.scale.setScalar(
      scale
    );

  }


  // Volver a calcular después del escalado.
  const newBox =
    new THREE.Box3()
      .setFromObject(
        object
      );


  const newCenter =
    new THREE.Vector3();


  newBox.getCenter(
    newCenter
  );


  // Centrar horizontalmente.
  object.position.x -=
    newCenter.x;


  object.position.z -=
    newCenter.z;


  // Apoyar en el piso.
  object.position.y -=
    newBox.min.y;

}


// ============================================================
// MATERIAL SEGÚN PERSONALIDAD
// ============================================================

function applyPersonalityMaterial(
  object,
  type
) {

  const color =
    new THREE.Color(
      PERSONALITY_COLORS[type]
    );


  object.traverse(
    child => {

      if (
        !child.isMesh
      ) {

        return;

      }


      child.castShadow =
        true;


      child.receiveShadow =
        true;


      if (
        !child.material
      ) {

        return;

      }


      child.material =
        child.material.clone();


      if (
        'color'
        in child.material
      ) {

        child.material.color =
          color.clone();

      }


      if (
        'emissive'
        in child.material
      ) {

        child.material.emissive =
          color.clone();

      }


      if (
        'emissiveIntensity'
        in child.material
      ) {

        child.material.emissiveIntensity =
          0.30;

      }


      if (
        'metalness'
        in child.material
      ) {

        child.material.metalness =
          0.72;

      }


      if (
        'roughness'
        in child.material
      ) {

        child.material.roughness =
          0.24;

      }

    }
  );

}


// ============================================================
// CREATE SIMULATION
// ============================================================

export async function createSimulation({

  scene,

  renderer,

  params,

  count = 144,

  modelUrl =
    '/raver.glb'

} = {}) {

  // ==========================================================
  // VALIDACIÓN
  // ==========================================================

  if (
    !scene
  ) {

    throw new Error(
      'createSimulation necesita una scene.'
    );

  }


  // ==========================================================
  // CARGAR MODELO
  // ==========================================================

  const loader =
    new GLTFLoader();


  const gltf =
    await loader.loadAsync(
      modelUrl
    );


  const sourceModel =
    gltf.scene;


  // ==========================================================
  // POSICIONES
  // ==========================================================

  const mode1Positions =
    generateCrowdPositions(
      count
    );


  const mode2Positions =
    generateGroupedPositions(
      count
    );


  // ==========================================================
  // EVITAR SOLAPAMIENTOS
  // ==========================================================

  resolveInitialOverlaps(
    mode1Positions
  );


  resolveInitialOverlaps(
    mode2Positions
  );


  // ==========================================================
  // AGENTES
  // ==========================================================

  const ravers =
    [];


  // ==========================================================
  // MESHES SELECCIONABLES
  // ==========================================================

  const selectableMeshes =
    [];


  // ==========================================================
  // CREACIÓN
  // ==========================================================

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const type =
      getTypeForIndex(
        i
      );


    // --------------------------------------------------------
    // CLONAR MODELO
    // --------------------------------------------------------

    const object =
      SkeletonUtils.clone(
        sourceModel
      );


    // --------------------------------------------------------
    // ESCALA
    // --------------------------------------------------------

    normalizeModel(
      object
    );


    // --------------------------------------------------------
    // MATERIAL
    // --------------------------------------------------------

    applyPersonalityMaterial(
      object,
      type
    );


    // --------------------------------------------------------
    // POSICIÓN INICIAL
    // --------------------------------------------------------

    const spawn =
      mode1Positions[i];


    object.position.set(

      spawn.x,

      0,

      spawn.z

    );


    // --------------------------------------------------------
    // ROTACIÓN INICIAL
    // --------------------------------------------------------
    //
    // Solo para que la gente no quede exactamente
    // mirando en la misma dirección.
    //
    // Después NO se vuelve a modificar.
    //
    // --------------------------------------------------------

    object.rotation.y =
      Math.random() *
      Math.PI *
      2;


    // --------------------------------------------------------
    // DATOS
    // --------------------------------------------------------

    object.userData.index =
      i;


    object.userData.type =
      type;


    scene.add(
      object
    );


    // --------------------------------------------------------
    // ESTADO DEL AGENTE
    // --------------------------------------------------------

    const data = {

      index:
        i,

      type:
        type,

      object:
        object,

      baseY:
        0,

      currentJump:
        0,

      wasAirborne:
        false,

      airborne:
        false,

      landingCooldown:
        0,

      phaseOffset:
        getPhaseOffset(
          type
        ),

      jumpHeight:
        getJumpHeight(
          type
        ),

      jumpSharpness:
        getJumpSharpness(
          type
        )

    };


    ravers.push(
      data
    );


    // --------------------------------------------------------
    // SELECCIÓN
    // --------------------------------------------------------

    object.traverse(
      child => {

        if (
          !child.isMesh
        ) {

          return;

        }


        child.userData.index =
          i;


        child.userData.type =
          type;


        selectableMeshes.push(
          child
        );

      }
    );

  }


  // ==========================================================
  // RESET
  // ==========================================================

  function reset() {

    for (
      let i = 0;
      i < ravers.length;
      i++
    ) {

      const data =
        ravers[i];


      const spawn =
        mode1Positions[i];


      data.object.position.set(

        spawn.x,

        0,

        spawn.z

      );


      data.currentJump =
        0;


      data.wasAirborne =
        false;


      data.airborne =
        false;


      data.landingCooldown =
        0;

    }

  }


  // ==========================================================
  // CAMBIAR DISTRIBUCIÓN
  // ==========================================================

  function setVisualMode(
    mode
  ) {

    const positions =
      mode === 2
        ? mode2Positions
        : mode1Positions;


    for (
      let i = 0;
      i < ravers.length;
      i++
    ) {

      const data =
        ravers[i];


      const target =
        positions[i];


      data.object.position.x =
        target.x;


      data.object.position.z =
        target.z;

    }

  }


  // ==========================================================
  // SIMULACIÓN DE SALTO
  // ==========================================================
  //
  // La fase de Kuramoto determina el salto.
  //
  // Sin caminar.
  // Sin movimiento lateral.
  // Sin coreografía.
  //
  // Cuando el agente baja al suelo:
  //
  //      impacts.push(...)
  //
  // main.js usa ese impacto para activar
  // el sonido correspondiente.
  //
  // ==========================================================

  function stepSimulation({

    phases,

    dt,

    jumpAmount =
      1.0

  }) {

    const impacts =
      [];


    for (
      let i = 0;
      i < ravers.length;
      i++
    ) {

      const data =
        ravers[i];


      // ------------------------------------------------------
      // FASE
      // ------------------------------------------------------

      const phase =
        phases[i] +
        data.phaseOffset;


      // ------------------------------------------------------
      // PULSO SUAVE (GELATINITA)
      // ------------------------------------------------------
      //
      // Sin Math.pow para oscilación suave y ondulante,
      // creando ese efecto de "cuerpo blando" que sube, baja,
      // se comprime y rebota.
      //

      const rawPulse =
        Math.max(

          0,

          Math.sin(
            phase
          )

        );


      // Oscilación suave sin compresión afilada
      const smoothOscillation =
        rawPulse;


      // ------------------------------------------------------
      // ALTURA
      // ------------------------------------------------------

      const targetJump =
        smoothOscillation *
        data.jumpHeight *
        jumpAmount;


      // Suavizado suave (gelatinita)
      const smoothFactor = 0.12;

      // Guardar valor anterior ANTES de actualizar
      const previousJump =
        data.currentJump;

      data.currentJump +=
        (
          targetJump -
          data.currentJump
        ) *
        smoothFactor;


      // ------------------------------------------------------
      // SOLO VERTICAL
      // ------------------------------------------------------

      data.object.position.y =
        data.baseY +
        data.currentJump;


      // ======================================================
      // DEFORMACIÓN TIPO GELATINA
      // ======================================================

      const jumpPhase =
        phase;

      // Cuando baja, se comprime
      const compression =
        Math.max(

          0,

          -Math.sin(
            jumpPhase
          )

        );

      // Cuando sube, se estira
      const stretch =
        Math.max(

          0,

          Math.sin(
            jumpPhase
          )

        );

      // Escala vertical
      const scaleY =
        1.0
        + stretch * 0.15
        - compression * 0.12;

      // Escala horizontal para compensar
      const scaleXZ =
        1.0
        - stretch * 0.07
        + compression * 0.08;

      data.object.scale.y =
        scaleY;

      data.object.scale.x =
        scaleXZ;

      data.object.scale.z =
        scaleXZ;


      // ======================================================
      // ESTADO AÉREO
      // ======================================================

      const airborneThreshold =
        0.045;

      data.airborne =
        data.currentJump >
        airborneThreshold;


      // DETECTAR ATERRIZAJE
      // ======================================================

      const landed =
        data.wasAirborne &&
        !data.airborne;


      // ------------------------------------------------------
      // COOLDOWN
      // ------------------------------------------------------

      if (
        data.landingCooldown >
        0
      ) {

        data.landingCooldown -=
          dt;

      }


      // ------------------------------------------------------
      // IMPACTO
      // ------------------------------------------------------

      if (
        landed &&
        data.landingCooldown <=
          0
      ) {

        const strength =
          THREE.MathUtils.clamp(

            previousJump /
            Math.max(

              data.jumpHeight,

              0.001

            ),

            0.18,

            1

          );


        impacts.push({

          index:
            data.index,

          type:
            data.type,

          x:
            data.object
              .position
              .x,

          z:
            data.object
              .position
              .z,

          strength:
            strength

        });


        data.landingCooldown =
          0.05;

      }


      // ------------------------------------------------------
      // GUARDAR ESTADO
      // ------------------------------------------------------

      data.wasAirborne =
        data.airborne;


      // ======================================================
      // ROTACIONES - MOVIMIENTO "CHARRITO"
      // ======================================================

      data.object.rotation.z =
        Math.sin(phase) *
        data.jumpSharpness *
        0.0045;


      data.object.rotation.x =
        Math.cos(
          phase * 0.7 + data.index
        ) *
        0.04;


      data.object.rotation.y =
        Math.sin(
          phase * 0.55
        ) *
        0.08 *
        (
          1 +
          data.currentJump *
          3.5
        );

    }


    return impacts;

  }


  // ==========================================================
  // RESET INICIAL
  // ==========================================================

  reset();


  // ==========================================================
  // API
  // ==========================================================

  return {

    ravers,

    selectableMeshes,

    reset,

    setVisualMode,

    stepSimulation,

    personalityNames:
      PERSONALITY_NAMES,

    personalityColors:
      PERSONALITY_COLORS

  };

}
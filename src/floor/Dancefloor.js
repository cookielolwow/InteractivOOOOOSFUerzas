import * as THREE from 'three/webgpu';


// ============================================================
// CONFIG
// ============================================================

const FLOOR_WIDTH =
  48;

const FLOOR_DEPTH =
  34;

const TILE_SIZE =
  2;

const TILE_GAP =
  0.14;

const COLS =
  Math.round(
    FLOOR_WIDTH /
    TILE_SIZE
  );

const ROWS =
  Math.round(
    FLOOR_DEPTH /
    TILE_SIZE
  );

const TILE_COUNT =
  COLS *
  ROWS;


// ============================================================
// COLORES
// ============================================================

const NEON_COLORS = [

  '#ffffff',
  

];


const OFF_COLOR_A =
  '#07070c';

const OFF_COLOR_B =
  '#0c0812';


// ============================================================
// RANDOM DETERMINISTA
// ============================================================

function hashRandom(
  a,
  b,
  c
) {

  const seed =
    Math.sin(
      a * 12.9898 +
      b * 78.233 +
      c * 37.719
    ) *
    43758.5453;

  return (
    seed -
    Math.floor(seed)
  );

}


// ============================================================
// DANCE FLOOR
// ============================================================

export function createDanceFloor(
  scene
) {

  const neonColors =
    NEON_COLORS.map(
      color =>
        new THREE.Color(
          color
        )
    );


  const offColorA =
    new THREE.Color(
      OFF_COLOR_A
    );

  const offColorB =
    new THREE.Color(
      OFF_COLOR_B
    );


  const geometry =
    new THREE.BoxGeometry(

      TILE_SIZE -
      TILE_GAP,

      0.06,

      TILE_SIZE -
      TILE_GAP

    );


  const material =
    new THREE.MeshBasicMaterial({

      toneMapped:
        false

    });


  const mesh =
    new THREE.InstancedMesh(

      geometry,

      material,

      TILE_COUNT

    );


  mesh.instanceMatrix.setUsage(
    THREE.DynamicDrawUsage
  );


  mesh.frustumCulled =
    false;


  const dummy =
    new THREE.Object3D();


  const originX =
    -(
      COLS *
      TILE_SIZE
    ) /
    2 +
    TILE_SIZE /
    2;

  const originZ =
    -(
      ROWS *
      TILE_SIZE
    ) /
    2 +
    TILE_SIZE /
    2;


  const tiles =
    [];


  let index =
    0;

  for (
    let row = 0;
    row < ROWS;
    row++
  ) {

    for (
      let col = 0;
      col < COLS;
      col++
    ) {

      const x =
        originX +
        col *
        TILE_SIZE;

      const z =
        originZ +
        row *
        TILE_SIZE;


      dummy.position.set(
        x,
        0.03,
        z
      );

      dummy.updateMatrix();

      mesh.setMatrixAt(
        index,
        dummy.matrix
      );


      const parity =
        (
          col +
          row
        ) %
        2;


      tiles.push({

        col,

        row,

        parity,

        colorIndex:
          (
            col +
            row * 3
          ) %
          neonColors.length

      });


      mesh.setColorAt(
        index,

        parity === 0
          ? offColorA
          : offColorB

      );


      index++;

    }

  }


  mesh.instanceColor.needsUpdate =
    true;


  scene.add(
    mesh
  );


  const tmpColor =
    new THREE.Color();


  // ==========================================================
  // UPDATE — se llama en cada frame del loop principal
  // ==========================================================

  function update({

    elapsed,

    beatSeconds,

    R = 0,

    floorPulse = 0,

    chaosAmount = null

  }) {

    const beatCount =
      Math.floor(
        elapsed /
        beatSeconds
      );

    const beatFraction =
      (
        elapsed %
        beatSeconds
      ) /
      beatSeconds;


    // pulso agudo que pega justo en el beat
    const beatPulse =
      Math.pow(

        Math.max(
          0,

          Math.sin(
            beatFraction *
            Math.PI *
            2
          )

        ),

        6

      );


    // qué mitad del ajedrez está "encendida" este beat
    const activeParity =
      beatCount %
      2;


    // más caos cuando el enjambre está desincronizado (R bajo)
    const chaos =
      chaosAmount ??
      THREE.MathUtils.clamp(
        1 -
        R,
        0,
        1
      );


    for (
      let i = 0;
      i < tiles.length;
      i++
    ) {

      const tile =
        tiles[i];


      const rand =
        hashRandom(
          tile.col,
          tile.row,
          beatCount
        );


      const isCheckerLit =
        tile.parity ===
        activeParity;

      // tiles random que se prenden fuera de patrón — el toque "loco"
      const isChaosLit =
        rand <
        0.22 *
        chaos;


      const lit =
        isCheckerLit ||
        isChaosLit;


      if (
        lit
      ) {

        const baseColor =
          neonColors[
            tile.colorIndex
          ];

        const brightness =
          0.55 +
          beatPulse *
          1.6 +
          floorPulse *
          1.4;

        tmpColor
          .copy(
            baseColor
          )
          .multiplyScalar(
            THREE.MathUtils.clamp(
              brightness,
              0,
              3.2
            )
          );

      } else {

        tmpColor.copy(
          tile.parity === 0
            ? offColorA
            : offColorB
        );

      }


      mesh.setColorAt(
        i,
        tmpColor
      );

    }


    mesh.instanceColor.needsUpdate =
      true;

  }


  return {

    mesh,

    update

  };

}
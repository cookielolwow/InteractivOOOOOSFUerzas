import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';


// ============================================================
// CREATE SIMULATION
// ============================================================

export async function createSimulation({

  renderer,
  scene,
  count = 144

}) {

  const loader =
    new GLTFLoader();


  // ==========================================================
  // LOAD MODEL
  // ==========================================================

  const gltf =
    await loader.loadAsync(
      '/raver.glb'
    );

  console.log(
    'RAVER GLB CARGADO ✅',
    gltf.scene
  );

  const model =
    gltf.scene;


  // ==========================================================
  // NORMALIZAR MODELO
  // ==========================================================

  const initialBox =
    new THREE.Box3().setFromObject(
      model
    );

  const initialSize =
    initialBox.getSize(
      new THREE.Vector3()
    );

  const modelHeight =
    Math.max(
      initialSize.y,
      0.001
    );

  const targetHeight =
    1.8;

  const modelScale =
    targetHeight /
    modelHeight;

  model.scale.setScalar(
    modelScale
  );


  const normalizedBox =
    new THREE.Box3().setFromObject(
      model
    );

  const normalizedCenter =
    normalizedBox.getCenter(
      new THREE.Vector3()
    );

  const normalizedMinY =
    normalizedBox.min.y;


  model.position.x -=
    normalizedCenter.x;

  model.position.y -=
    normalizedMinY;

  model.position.z -=
    normalizedCenter.z;


  console.log(
    'RAVER GLB:',
    model
  );

  console.log(
    'RAVER SIZE:',
    initialSize
  );


  // ==========================================================
  // RAVERS
  // ==========================================================

  const ravers = [];


  // ==========================================================
  // COLORS
  // ==========================================================

  const colors = [

    '#72FF00',
    '#8A00FF',
    '#FFFFFF',
    '#00FF8A',
    '#B100FF',
    '#DFFF00'

  ];


  // ==========================================================
  // PERSONALIDADES
  // ==========================================================

  function getType(
    i
  ) {

    if (
      i < 36
    ) {

      return 0;

    }

    if (
      i < 60
    ) {

      return 1;

    }

    if (
      i < 78
    ) {

      return 2;

    }

    if (
      i < 108
    ) {

      return 3;

    }

    if (
      i < 126
    ) {

      return 4;

    }

    return 5;

  }


  // ==========================================================
  // DATA
  // ==========================================================

  const data = [];


  // ==========================================================
  // HEIGHT
  // ==========================================================

  const previousHeights =
    new Float32Array(
      count
    );


  // ==========================================================
  // FATIGUE
  // ==========================================================

  const fatigue =
    new Float32Array(
      count
    );

  const restTime =
    new Float32Array(
      count
    );

  const resting =
    new Array(
      count
    ).fill(
      false
    );


  // ==========================================================
  // CREATE MULTITUDE
  // ==========================================================

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const type =
      getType(
        i
      );

    const raver =
      SkeletonUtils.clone(
        model
      );

    raver.userData.index =
      i;

    raver.userData.type =
      type;


    // ========================================================
    // POSITION
    // ========================================================

    const goldenAngle =
      Math.PI *
      (
        3 -
        Math.sqrt(5)
      );

    const radiusNorm =
      Math.sqrt(
        (
          i +
          0.5
        ) /
        count
      );

    const angle =
      i *
      goldenAngle;

    const radius =
      radiusNorm *
      15.5;

    const irregularX =
      Math.sin(
        i *
        7.73
      ) *
      0.8;

    const irregularZ =
      Math.cos(
        i *
        5.17
      ) *
      0.8;

    const homeX =
      Math.cos(
        angle
      ) *
      radius +
      irregularX;

    const homeZ =
      Math.sin(
        angle
      ) *
      radius +
      irregularZ;


    // ========================================================
    // MOVIMIENTO
    // ========================================================

    data.push({

      homeX,

      homeZ,

      speed:
        0.022 +
        (
          (
            i *
            17
          ) %
          18
        ) *
        0.006,

      roamRadius:
        1.0 +
        (
          (
            i *
            29
          ) %
          12
        ) *
        0.18,

      sideRadius:
        0.5 +
        (
          (
            i *
            13
          ) %
          10
        ) *
        0.10,

      offset:
        (
          (
            i *
            31
          ) %
          100
        ) *
        0.01,

      direction:
        i %
        2 ===
        0
          ? 1
          : -1,

      fatigueLimit:
        5.0 +
        (
          (
            i *
            31
          ) %
          10
        ) *
        0.40

    });


    raver.position.set(
      homeX,
      0,
      homeZ
    );


    raver.scale.setScalar(
      1
    );


    // ========================================================
    // MATERIAL
    // ========================================================

    raver.traverse(
      object => {

        object.userData.index =
          i;

        object.userData.type =
          type;

        if (
          !object.isMesh
        ) {

          return;

        }

        object.castShadow =
          true;

        object.receiveShadow =
          true;


        if (
          object.material
        ) {

          object.material =
            object.material.clone();


          // --------------------------------------------------
          // COLOR
          // --------------------------------------------------

          if (
            'color'
            in object.material
          ) {

            object.material.color.set(
              colors[type]
            );

            object.material.color.multiplyScalar(
              0.72
            );

          }


          // --------------------------------------------------
          // EMISSIVE
          // --------------------------------------------------

          if (
            'emissive'
            in object.material
          ) {

            object.material.emissive.set(
              colors[type]
            );

            object.material.emissiveIntensity =
              0.22;

          }


          object.material.metalness =
            0.72;

          object.material.roughness =
            0.22;

        }

      }
    );


    scene.add(
      raver
    );

    ravers.push(
      raver
    );

  }


  // ==========================================================
  // NORMAL SCALE
  // ==========================================================

  const normalScale =
    new THREE.Vector3(
      1,
      1,
      1
    );


  // ==========================================================
  // PHASE OFFSETS
  // ==========================================================

  function getPhaseOffset(
    type
  ) {

    if (
      type === 0
    ) {

      return 0.0;

    }

    if (
      type === 1
    ) {

      return 0.50;

    }

    if (
      type === 2
    ) {

      return 0.50;

    }

    if (
      type === 3
    ) {

      return 0.25;

    }

    if (
      type === 4
    ) {

      return 0.75;

    }

    return 0.375;

  }


  // ==========================================================
  // HEIGHT
  // ==========================================================

  function getHeight(
    type,
    jump
  ) {

    if (
      type === 0
    ) {

      return jump *
        1.00;

    }

    if (
      type === 1
    ) {

      return jump *
        0.50;

    }

    if (
      type === 2
    ) {

      return jump *
        0.72;

    }

    if (
      type === 3
    ) {

      return jump *
        0.28;

    }

    if (
      type === 4
    ) {

      return jump *
        0.46;

    }

    return jump *
      1.08;

  }


  // ==========================================================
  // ROTATION
  // ==========================================================

  function getRotation(
    type
  ) {

    if (
      type === 0
    ) {

      return 0.045;

    }

    if (
      type === 1
    ) {

      return 0.06;

    }

    if (
      type === 2
    ) {

      return 0.09;

    }

    if (
      type === 3
    ) {

      return 0.14;

    }

    if (
      type === 4
    ) {

      return 0.18;

    }

    return 0.22;

  }


  // ==========================================================
  // RESET
  // ==========================================================

  function reset() {

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const raver =
        ravers[i];

      const item =
        data[i];

      raver.position.set(
        item.homeX,
        0,
        item.homeZ
      );

      raver.rotation.set(
        0,
        0,
        0
      );

      raver.scale.setScalar(
        1
      );

      raver.visible =
        true;

      fatigue[i] =
        0;

      restTime[i] =
        0;

      resting[i] =
        false;

      previousHeights[i] =
        0;

    }

  }


  // ==========================================================
  // SEPARACIÓN
  // ==========================================================
  //
  // Evita atravesamientos.
  //
  // Se ejecuta varias veces porque separar una pareja puede
  // generar una colisión nueva con otra.
  //

  function resolveSeparation() {

    const minDistance =
      1.28;

    const minDistanceSquared =
      minDistance *
      minDistance;

    const iterations =
      4;


    for (
      let iteration = 0;
      iteration < iterations;
      iteration++
    ) {

      for (
        let i = 0;
        i < count;
        i++
      ) {

        const a =
          ravers[i];

        if (
          !a.visible
        ) {

          continue;

        }


        for (
          let j = i + 1;
          j < count;
          j++
        ) {

          const b =
            ravers[j];

          if (
            !b.visible
          ) {

            continue;

          }


          const dx =
            b.position.x -
            a.position.x;

          const dz =
            b.position.z -
            a.position.z;

          const squared =
            dx * dx +
            dz * dz;


          if (
            squared >=
            minDistanceSquared
          ) {

            continue;

          }


          let distance =
            Math.sqrt(
              squared
            );


          // evita división por cero

          if (
            distance <
            0.0001
          ) {

            distance =
              0.0001;

          }


          const overlap =
            minDistance -
            distance;


          // un poquito más agresivo para
          // impedir que los cuerpos se metan
          // uno dentro del otro

          const push =
            (
              overlap /
              distance
            ) *
            0.58;


          const pushX =
            dx *
            push;

          const pushZ =
            dz *
            push;


          a.position.x -=
            pushX;

          a.position.z -=
            pushZ;

          b.position.x +=
            pushX;

          b.position.z +=
            pushZ;

        }

      }

    }


    // ========================================================
    // LÍMITE EXTERIOR
    // ========================================================

    const maxDistance =
      19;


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const raver =
        ravers[i];

      const distance =
        Math.sqrt(
          raver.position.x *
          raver.position.x +
          raver.position.z *
          raver.position.z
        );


      if (
        distance >
        maxDistance
      ) {

        const factor =
          maxDistance /
          distance;

        raver.position.x *=
          factor;

        raver.position.z *=
          factor;

      }

    }

  }


  // ==========================================================
  // STEP SIMULATION
  // ==========================================================

  function stepSimulation(
    phases,
    freqs,
    dt,
    R
  ) {

    const impacts = [];

    const time =
      performance.now() *
      0.001;


    // ========================================================
    // AGENTS
    // ========================================================

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const raver =
        ravers[i];

      const item =
        data[i];

      const type =
        raver.userData.type;

      const phase =
        phases[i];


      // ======================================================
      // FASE MUSICAL
      // ======================================================

      const cycle =
        phase /
        (
          Math.PI *
          2
        );

      const phaseOffset =
        getPhaseOffset(
          type
        );

      const shiftedCycle =
        cycle +
        phaseOffset;

      const beatPhase =
        shiftedCycle -
        Math.floor(
          shiftedCycle
        );


      // ======================================================
      // JUMP
      // ======================================================

      const jump =
        Math.pow(
          Math.sin(
            Math.PI *
            beatPhase
          ),
          2
        );

      let height =
        getHeight(
          type,
          jump
        );


      // ======================================================
      // FATIGA
      // ======================================================

      const activity =
        jump *
        (
          0.18 +
          R *
          0.62
        );


      if (
        !resting[i]
      ) {

        fatigue[i] +=
          activity *
          dt *
          0.45;


        if (
          fatigue[i] >
          item.fatigueLimit
        ) {

          if (
            Math.random() <
            dt *
            0.12
          ) {

            resting[i] =
              true;

            restTime[i] =
              0;

          }

        }

      } else {

        restTime[i] +=
          dt;

        fatigue[i] =
          Math.max(
            0,
            fatigue[i] -
            dt *
            0.65
          );


        const neededRest =
          1.4 +
          (
            (
              i *
              11
            ) %
            8
          ) *
          0.20;


        if (
          restTime[i] >
          neededRest &&
          fatigue[i] <
          item.fatigueLimit *
          0.30
        ) {

          resting[i] =
            false;

          restTime[i] =
            0;

        }

      }


      // ======================================================
      // REST VISUAL
      // ======================================================

      if (
        resting[i]
      ) {

        height =
          0;

      }


      raver.visible =
        true;


      // ======================================================
      // MOVEMENT
      // ======================================================

      const walkTime =
        time *
        item.speed *
        item.direction +
        item.offset;

      const sideTime =
        time *
        item.speed *
        0.61 *
        item.direction +
        i *
        0.47;


      const walkRadius =
        item.roamRadius *
        (
          0.85 +
          (
            1 -
            R
          ) *
          0.65
        );

      const walkX =
        Math.sin(
          walkTime
        ) *
        walkRadius;

      const walkZ =
        Math.cos(
          walkTime *
          0.81
        ) *
        walkRadius;


      const sideRadius =
        item.sideRadius *
        (
          0.85 +
          (
            1 -
            R
          ) *
          0.90
        );

      const sideX =
        Math.cos(
          sideTime
        ) *
        sideRadius;

      const sideZ =
        Math.sin(
          sideTime *
          0.83
        ) *
        sideRadius;


      const roamRadius =
        1.2 +
        (
          1 -
          R
        ) *
        2.4;

      const roamX =
        Math.sin(
          time *
          0.055 +
          i *
          1.73
        ) *
        roamRadius;

      const roamZ =
        Math.cos(
          time *
          0.047 +
          i *
          1.37
        ) *
        roamRadius;


      // ======================================================
      // PHASE MODULATION
      // ======================================================

      const phaseMove =
        Math.sin(
          phase *
          0.37 +
          i *
          0.13
        ) *
        (
          0.15 +
          R *
          0.25
        );


      // ======================================================
      // TARGET
      // ======================================================

      const targetX =
        item.homeX +
        walkX +
        sideX +
        roamX +
        Math.cos(
          phase *
          0.27 +
          i
        ) *
        phaseMove;

      const targetZ =
        item.homeZ +
        walkZ +
        sideZ +
        roamZ +
        Math.sin(
          phase *
          0.27 +
          i
        ) *
        phaseMove;


      // ======================================================
      // LÍMITE
      // ======================================================

      const maxDistance =
        19;

      const distance =
        Math.sqrt(
          targetX *
          targetX +
          targetZ *
          targetZ
        );

      let finalX =
        targetX;

      let finalZ =
        targetZ;


      if (
        distance >
        maxDistance
      ) {

        const factor =
          maxDistance /
          distance;

        finalX *=
          factor;

        finalZ *=
          factor;

      }


      // ======================================================
      // MOVIMIENTO
      // ======================================================

      const smoothing =
        Math.min(
          1,
          dt *
          1.4
        );

      raver.position.x =
        THREE.MathUtils.lerp(
          raver.position.x,
          finalX,
          smoothing
        );

      raver.position.z =
        THREE.MathUtils.lerp(
          raver.position.z,
          finalZ,
          smoothing
        );


      // ======================================================
      // ALTURA
      // ======================================================

      raver.position.y =
        height;


      // ======================================================
      // ROTATION
      // ======================================================

      const rotation =
        getRotation(
          type
        );


      raver.rotation.y =
        Math.sin(
          walkTime
        ) *
        (
          0.18 +
          (
            1 -
            R
          ) *
          0.18
        );


      raver.rotation.z =
        Math.sin(
          phase
        ) *
        rotation;


      raver.rotation.x =
        Math.cos(
          phase *
          0.7 +
          i
        ) *
        0.045;


      // ======================================================
      // TYPE-SPECIFIC VISUAL CHARACTER
      // ======================================================

      switch (
        type
      ) {

        // KICK
        case 0:

          raver.scale.set(
            1.0 +
            jump *
            0.08,

            1.0 +
            jump *
            0.08,

            1.0 +
            jump *
            0.08
          );

          break;


        // RUMBLE
        case 1:

          raver.rotation.z +=
            Math.sin(
              phase *
              0.5
            ) *
            0.025;

          break;


        // CLAP
        case 2:

          raver.scale.set(
            1.0 +
            jump *
            0.055,

            1.0 -
            jump *
            0.025,

            1.0 +
            jump *
            0.055
          );

          break;


        // CLOSED HAT
        case 3:

          raver.rotation.y +=
            Math.sin(
              phase *
              2
            ) *
            0.05;

          break;


        // OPEN HAT
        case 4:

          raver.rotation.y +=
            Math.cos(
              phase *
              2
            ) *
            0.10;

          break;


        // ACID
        case 5:

          raver.rotation.y +=
            Math.sin(
              phase *
              0.5
            ) *
            0.16;

          break;

      }


      // ======================================================
      // FATIGUE VISUAL
      // ======================================================

      const fatigueRatio =
        THREE.MathUtils.clamp(
          fatigue[i] /
          item.fatigueLimit,
          0,
          1
        );


      raver.traverse(
        object => {

          if (
            !object.isMesh
          ) {

            return;

          }

          if (
            object.material &&
            'color'
            in object.material
          ) {

            const baseColor =
              new THREE.Color(
                colors[type]
              );

            baseColor.multiplyScalar(
              0.65 +
              (
                1 -
                fatigueRatio
              ) *
              0.20
            );

            object.material.color.copy(
              baseColor
            );

          }

        }
      );


      // ======================================================
      // LANDING
      // ======================================================

      const previous =
        previousHeights[i];

      const landing =
        !resting[i] &&
        previous >
        0.08 &&
        height <=
        0.08;


      if (
        landing
      ) {

        const strength =
          Math.min(
            1,
            previous /
            0.8
          );


        impacts.push({

          index:
            i,

          type:
            type,

          strength:
            strength,

          x:
            raver.position.x,

          z:
            raver.position.z

        });


        // golpe visual
        raver.scale.set(
          1.08,
          0.92,
          1.08
        );

      } else {

        // recuperación
        raver.scale.lerp(
          normalScale,
          Math.min(
            1,
            dt *
            12
          )
        );

      }


      previousHeights[i] =
        height;

    }


    // ========================================================
    // SEPARACIÓN
    // ========================================================

    resolveSeparation();


    return impacts;

  }


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    ravers,

    reset,

    stepSimulation

  };

}
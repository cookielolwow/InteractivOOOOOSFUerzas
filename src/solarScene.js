import * as THREE from 'three';

const PLANETS = [
  { name: 'Mercurio', au: 0.39, period: 87.97, radius: 0.48, color: 0xaaa39b },
  { name: 'Venus', au: 0.72, period: 224.70, radius: 0.82, color: 0xd9b77e },
  { name: 'Tierra', au: 1, period: 365.25, radius: 0.86, color: 0x347fc2 },
  { name: 'Marte', au: 1.52, period: 686.98, radius: 0.62, color: 0xb85b42 },
  { name: 'Jupiter', au: 5.20, period: 4332.59, radius: 2.1, color: 0xc99670 },
  { name: 'Saturno', au: 9.54, period: 10759.22, radius: 1.75, color: 0xd8bd86 },
  { name: 'Urano', au: 19.19, period: 30688.5, radius: 1.25, color: 0x86cbd0 },
  { name: 'Neptuno', au: 30.07, period: 60182, radius: 1.22, color: 0x416fc5 }
];

const DISPLAY_RADIUS = (au) => 8 + Math.sqrt(au) * 6.4;
const YEAR_IN_MS = 12000;

function makeOrbit(radius, inclination, twist, color = 0x70bce8) {
  const points = [];
  for (let index = 0; index < 160; index += 1) {
    const angle = (index / 160) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 0.48));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.2 });
  const line = new THREE.LineLoop(geometry, material);
  line.rotation.x = inclination;
  line.rotation.z = twist;
  return line;
}

function makeStars() {
  const positions = [];
  for (let index = 0; index < 1200; index += 1) {
    const radius = 55 + Math.random() * 100;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions.push(
      Math.sin(phi) * Math.cos(theta) * radius,
      Math.cos(phi) * radius * 0.7,
      Math.sin(phi) * Math.sin(theta) * radius
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xbfe6ff, size: 0.18, transparent: true, opacity: 0.8 }));
}

function makeAsteroidBelt() {
  const positions = [];
  for (let index = 0; index < 260; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 18.5 + Math.random() * 3.2;
    positions.push(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.35, Math.sin(angle) * radius * 0.48);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xf28fbe, size: 0.1, transparent: true, opacity: 0.7 }));
}

function makePlanet(planet) {
  const material = new THREE.MeshStandardMaterial({
    color: planet.color,
    roughness: 0.78,
    metalness: 0.04,
    emissive: planet.color,
    emissiveIntensity: planet.name === 'Tierra' ? 0.28 : 0.16
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(planet.radius, 32, 24), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (planet.name === 'Saturno') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.25, 3.35, 64),
      new THREE.MeshStandardMaterial({ color: 0xc9ae78, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }
  return mesh;
}

function createSolarSystem(scene, x) {
  const root = new THREE.Group();
  root.position.x = x;
  scene.add(root);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0xffc857, emissive: 0xff8c42, emissiveIntensity: 2.2, roughness: 0.35 })
  );
  const sunAura = new THREE.Mesh(
    new THREE.SphereGeometry(5.8, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0xffa45b, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  root.add(sunAura);
  root.add(sun);
  const light = new THREE.PointLight(0xffbe55, 8, 100, 1.2);
  root.add(light);

  const bodies = PLANETS.map((planet, index) => {
    const orbitRadius = DISPLAY_RADIUS(planet.au);
    const inclination = (index - 3.5) * 0.09;
    const twist = (index % 2 === 0 ? 1 : -1) * 0.08;
    const orbitColors = [0x009fe1, 0xf28fbe, 0xe83438];
    const orbit = makeOrbit(orbitRadius, inclination, twist, orbitColors[index % orbitColors.length]);
    root.add(orbit);
    const mesh = makePlanet(planet);
    root.add(mesh);
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(36 * 3);
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trail = new THREE.Line(
      trailGeometry,
      new THREE.LineBasicMaterial({ color: orbitColors[index % orbitColors.length], transparent: true, opacity: 0.4 })
    );
    root.add(trail);
    return { planet, mesh, trail, trailPositions, orbitRadius, inclination, twist, angle: Math.random() * Math.PI * 2 };
  });

  root.add(makeAsteroidBelt());
  return { root, sun, sunAura, bodies };
}

export function createSolarScene(container, getSlide) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030914, 0.0032);
  const starField = makeStars();
  scene.add(starField);

  const camera = new THREE.OrthographicCamera(-42, 42, 28, -28, 0.1, 300);
  camera.position.set(13, 22, 70);
  camera.lookAt(13, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'solar-scene';
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x5578a8, 0.55));
  scene.add(new THREE.HemisphereLight(0x9edcff, 0x10182d, 0.42));
  const systems = [createSolarSystem(scene, 0), createSolarSystem(scene, 0)];
  systems[1].root.visible = false;

  function resize() {
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    const aspect = rect.width / rect.height;
    camera.left = -42 * aspect;
    camera.right = 42 * aspect;
    camera.top = 28;
    camera.bottom = -28;
    camera.updateProjectionMatrix();
  }

  function updateSystems(time) {
    const slide = getSlide();
    const dual = ['vision', 'sinergia', 'presente', 'futuro'].includes(slide.id);
    const elapsed = time * 0.001;
    starField.rotation.y = elapsed * 0.006;
    starField.rotation.x = Math.sin(elapsed * 0.08) * 0.025;
    systems[0].root.position.x = dual ? -18 : 18;
    systems[1].root.visible = dual;
    systems[1].root.position.x = 18;
    systems[1].root.rotation.y = Math.PI;

    const visualScale = dual ? 0.68 : 1;
    systems.forEach((system, systemIndex) => {
      system.root.scale.setScalar(visualScale);
      system.sun.rotation.y += 0.002;
      const unstable = slide.id === 'auditorio';
      const attracted = slide.id === 'encuentro' || slide.id === 'impacto';
      const fused = slide.id === 'comunidad' || slide.id === 'futuro';
      system.sun.scale.setScalar(attracted ? 1.35 + Math.sin(elapsed * 2) * 0.08 : fused ? 1.12 : 1);
      system.sunAura.scale.setScalar(1 + Math.sin(elapsed * 2.2) * 0.08);
      system.sunAura.material.opacity = attracted ? 0.24 : 0.16;
      system.bodies.forEach(({ planet, mesh, trail, trailPositions, orbitRadius, inclination, twist, angle }, index) => {
        const speed = (Math.PI * 2) / (planet.period * (YEAR_IN_MS / 365.25));
        const nextAngle = angle + time * speed;
        const drift = unstable ? Math.sin(elapsed * 0.8 + index) * (1.8 + index * 0.3) : 0;
        const pull = fused ? 0.78 : attracted ? 0.94 : 1;
        const position = new THREE.Vector3(
          Math.cos(nextAngle) * (orbitRadius * pull + drift),
          0,
          Math.sin(nextAngle) * (orbitRadius * pull + drift) * 0.48
        );
        position.applyEuler(new THREE.Euler(inclination, 0, twist));
        mesh.position.copy(position);
        for (let trailIndex = 35; trailIndex > 0; trailIndex -= 1) {
          trailPositions[trailIndex * 3] = trailPositions[(trailIndex - 1) * 3];
          trailPositions[trailIndex * 3 + 1] = trailPositions[(trailIndex - 1) * 3 + 1];
          trailPositions[trailIndex * 3 + 2] = trailPositions[(trailIndex - 1) * 3 + 2];
        }
        trailPositions[0] = position.x;
        trailPositions[1] = position.y;
        trailPositions[2] = position.z;
        trail.geometry.attributes.position.needsUpdate = true;
        trail.material.opacity = unstable ? 0.12 : 0.34;
        mesh.rotation.y += 0.004 + systemIndex * 0.001;
        mesh.material.opacity = unstable ? 0.35 + (Math.sin(elapsed + index) + 1) * 0.25 : 1;
        mesh.material.transparent = unstable;
      });
      system.root.rotation.y = slide.id === 'talento' || slide.id === 'ruta' ? time * 0.00016 : Math.sin(elapsed * 0.1) * 0.04;
    });
    const cameraTargetX = dual ? 0 : 18;
    camera.position.x = cameraTargetX + Math.sin(elapsed * 0.08) * (dual ? 3 : 1.5);
    camera.position.y = 22 + Math.sin(elapsed * 0.13) * 1.2;
    camera.position.z = 70 + Math.cos(elapsed * 0.08) * 2;
    camera.lookAt(cameraTargetX, 0, 0);
  }

  function animate(time) {
    updateSystems(time);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(animate);
  return { resize };
}

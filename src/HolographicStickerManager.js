import * as THREE from 'three';

const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vViewPosition;
  varying vec3 vViewNormal;
  varying vec2 vScreenUv;

  void main() {
    vUv = uv;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -viewPosition.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    vec4 clipPosition = projectionMatrix * viewPosition;
    vScreenUv = clipPosition.xy / clipPosition.w * 0.5 + 0.5;
    gl_Position = clipPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uMap;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uIridescence;
  varying vec2 vUv;
  varying vec3 vViewPosition;
  varying vec3 vViewNormal;
  varying vec2 vScreenUv;

  float hash21(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  float valueNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    float a = hash21(cell);
    float b = hash21(cell + vec2(1.0, 0.0));
    float c = hash21(cell + vec2(0.0, 1.0));
    float d = hash21(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
  }

  void main() {
    vec4 artwork = texture2D(uMap, vUv);
    if (artwork.a < 0.015) discard;

    // High-frequency value noise perturbs the normal with a subtle printed-vinyl grain.
    vec2 grainUv = vUv * 92.0 + vec2(uTime * 0.012, -uTime * 0.009);
    float grain = valueNoise(grainUv);
    float grainX = valueNoise(grainUv + vec2(0.035, 0.0)) - valueNoise(grainUv - vec2(0.035, 0.0));
    float grainY = valueNoise(grainUv + vec2(0.0, 0.035)) - valueNoise(grainUv - vec2(0.0, 0.035));
    vec3 normal = normalize(vViewNormal + vec3(grainX, grainY, 0.0) * 1.25);

    // Fresnel is strongest at glancing angles: 1 - dot(view, normal).
    vec3 viewDirection = normalize(vViewPosition);
    float facing = max(dot(normal, viewDirection), 0.0);
    float fresnel = pow(1.0 - facing, 2.1);

    // Phase-shifted cosine waves create the moving cyan, pink, and gold foil spectrum.
    float phase = vUv.x * 2.4 + vUv.y * 0.85 + uTime * 0.12 + fresnel * 2.4 + grain * 0.14;
    vec3 foil = 0.5 + 0.5 * cos(6.28318 * (phase + vec3(0.0, 0.33, 0.67)));
    float foilWeight = clamp(0.38 + fresnel * 0.72, 0.0, 0.94) * uIridescence;
    vec3 foilColor = mix(artwork.rgb * 0.28, foil, 0.72);
    vec3 printedColor = mix(artwork.rgb, foilColor, foilWeight);

    // Convert normalized device coordinates to screen UV before evaluating the pointer glare.
    vec2 pointerUv = uMouse * 0.5 + 0.5;
    vec2 pointerDelta = vScreenUv - pointerUv;
    float glareAxis = dot(pointerDelta, normalize(vec2(0.82, 0.57)));
    float glareBand = exp(-pow(glareAxis * 13.0, 2.0));
    float glareFalloff = exp(-dot(pointerDelta, pointerDelta) * 3.2);
    float glare = glareBand * glareFalloff * 0.92;

    // Preserve the PNG alpha so foil only appears on the sticker artwork, never its clear border.
    vec3 finalColor = printedColor + vec3(1.0, 0.96, 0.9) * glare;
    finalColor *= 0.96 + grain * 0.08;
    gl_FragColor = vec4(finalColor, artwork.a);
  }
`;

const STICKER_ASSETS = [
  'gato sticker.png',
  'otro sticker.png',
  'sticker perro.png',
  'sticker.png',
  'gato sticker.png',
  'sticker perro.png',
];

export class HolographicStickerManager {
  constructor({ mount }) {
    this.mount = mount;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 100);
    this.camera.position.z = 20;
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'holographic-sticker-canvas';
    this.mount.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;
    this.loader = new THREE.TextureLoader();
    this.stickers = [];
    this.mouse = new THREE.Vector2(3, 3);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = () => this.mouse.set(3, 3);

    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerleave', this.onPointerLeave);
    this.resize();
    this.load();
  }

  onPointerMove(event) {
    const rect = this.mount.getBoundingClientRect();
    this.mouse.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
  }

  async load() {
    await Promise.all(STICKER_ASSETS.map(async (filename, index) => {
      try {
        const texture = await this.loader.loadAsync(`/${encodeURIComponent(filename)}`);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        const aspect = texture.image.width / texture.image.height;
        const uniforms = {
          uMap: { value: texture },
          uMouse: { value: this.mouse },
          uTime: { value: 0 },
          uIridescence: { value: 1 },
        };
        const material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1), material);
        mesh.userData = {
          index,
          aspect,
          phase: index * 1.2,
          sizeFactor: [0.56, 0.82, 0.66, 0.94, 0.61, 0.76][index],
          baseRotation: mesh.rotation.clone(),
          baseX: 0,
          baseY: 0,
        };
        this.stickers.push(mesh);
        this.scene.add(mesh);
        this.layoutStickers();
      } catch (error) {
        console.warn(`No se pudo cargar el sticker ${filename}.`, error);
      }
    }));
  }

  layoutStickers() {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    if (!width || !height) return;

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = height;
    this.camera.bottom = 0;
    this.camera.updateProjectionMatrix();

    const rootRect = this.mount.getBoundingClientRect();
    const menuRect = document.querySelector('.paint-menubar').getBoundingClientRect();
    const toolsRect = document.querySelector('.paint-tools').getBoundingClientRect();
    const stageRect = document.querySelector('.stage-shell').getBoundingClientRect();
    const footerRect = document.querySelector('.paint-footer').getBoundingClientRect();
    const paletteRect = document.querySelector('.palette-area').getBoundingClientRect();
    const footerStart = Math.max(0, paletteRect.right - rootRect.left + 10);
    const footerSpace = Math.max(8, width - footerStart - 8);
    const footerSlot = footerSpace / 4;
    const anchors = [
      {
        x: toolsRect.left - rootRect.left + toolsRect.width * 0.5,
        y: stageRect.top - rootRect.top + stageRect.height * 0.53,
        width: toolsRect.width - 8,
        height: 68,
      },
      {
        x: width - 20,
        y: menuRect.top - rootRect.top + menuRect.height * 0.5,
        width: Math.max(18, Math.min(48, width - 28)),
        height: menuRect.height + 12,
      },
      ...Array.from({ length: 4 }, (_, index) => ({
        x: footerStart + footerSlot * (index + 0.5),
        y: footerRect.top - rootRect.top + footerRect.height * (index % 2 ? 0.34 : 0.39),
        width: footerSlot - 3,
        height: Math.min(54, footerRect.height * 0.72),
      })),
    ];
    this.stickers.forEach((mesh) => {
      const { index, aspect, sizeFactor } = mesh.userData;
      const anchor = anchors[index];
      const size = Math.max(8, Math.min(anchor.height * sizeFactor, anchor.width / aspect));
      mesh.scale.set(size * aspect, size, 1);
      mesh.position.set(anchor.x, height - anchor.y, -index * 0.01);
      mesh.userData.baseX = mesh.position.x;
      mesh.userData.baseY = mesh.position.y;
    });
  }

  resize() {
    this.layoutStickers();
  }

  update(time) {
    this.stickers.forEach((sticker) => {
      const { phase, baseRotation, baseX, baseY } = sticker.userData;
      sticker.material.uniforms.uTime.value = time;
      sticker.position.x = baseX + Math.sin(this.mouse.x * 0.4 + phase) * 1.2;
      sticker.position.y = baseY + Math.sin(time * 0.55 + phase) * 1.4;
      sticker.rotation.x = baseRotation.x + Math.sin(time * 0.45 + phase) * 0.025;
      sticker.rotation.y = baseRotation.y + Math.cos(time * 0.38 + phase) * 0.045;
      sticker.rotation.z = baseRotation.z + Math.sin(time * 0.31 + phase) * 0.028;
    });
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerleave', this.onPointerLeave);
    this.stickers.forEach((sticker) => {
      sticker.geometry.dispose();
      sticker.material.uniforms.uMap.value.dispose();
      sticker.material.dispose();
    });
    this.stickers.length = 0;
    this.mount.removeChild(this.canvas);
    this.renderer.dispose();
  }
}
import './styles.css';
import QRCode from 'qrcode';
import forumLogoUrl from './upb-forum-logo-transparent.png';

const slides = [
  {
    id: 'cover',
    kicker: { es: 'FÓRUM UPB • Centro de Eventos', en: 'FÓRUM UPB • Event Center', pt: 'FÓRUM UPB • Centro de Eventos' },
    title: {
      es: 'RELEVO GENERACIONAL: LA VENTAJA QUE NADIE ESTÁ APROVECHANDO',
      en: 'GENERATIONAL SHIFT: THE ADVANTAGE NOBODY IS TAKING',
      pt: 'RELEVO GERACIONAL: A VANTAGEM QUE NINGUÉM ESTÁ APROVEITANDO'
    },
    subtitle: { es: '', en: '', pt: '' },
    tag: '@centrodeeventosupb',
    theme: { accent: '#009fe1', accent2: '#f28fbe', accent3: '#e83438' },
    layout: 'hero'
  },
  {
    id: 'auditorio',
    kicker: { es: 'FÓRUM UPB', en: 'FÓRUM UPB', pt: 'FÓRUM UPB' },
    title: { es: '¿Un gran auditorio solo para hacer grados?', en: 'Was a big auditorium only for graduation ceremonies?', pt: 'Um grande auditório só para formaturas?' },
    subtitle: { es: 'El espacio universitario se volvió estático.', en: 'University space became static.', pt: 'O espaço universitário ficou estático.' },
    tag: 'FOTO 1',
    image: 'foto-1.jpg',
    theme: { accent: '#e83438', accent2: '#009fe1', accent3: '#f28fbe' },
    layout: 'photo'
  },
  {
    id: 'encuentro',
    kicker: { es: 'TRANSICIÓN', en: 'TRANSITION', pt: 'TRANSIÇÃO' },
    title: { es: 'Los eventos no llegaron a la Universidad.', en: 'Events did not reach the University.', pt: 'Os eventos não chegaram à Universidade.' },
    subtitle: { es: 'La Universidad decidió encontrarse con el mundo.', en: 'The University chose to meet the world.', pt: 'A Universidade decidiu encontrar o mundo.' },
    tag: 'FÓRUM / MUNDO',
    theme: { accent: '#f28fbe', accent2: '#009fe1', accent3: '#e83438' },
    layout: 'split'
  },
  {
    id: 'triada',
    kicker: { es: 'PILARES', en: 'PILLARS', pt: 'PILARES' },
    title: { es: 'Academia + Industria + Ciudad', en: 'Academia + Industry + City', pt: 'Academia + Indústria + Cidade' },
    subtitle: { es: 'Tres fuerzas que hacen comunidad.', en: 'Three forces that build community.', pt: 'Três forças que constroem comunidade.' },
    tag: 'ecosistema',
    image: 'foto-2.jpeg',
    theme: { accent: '#009fe1', accent2: '#f28fbe', accent3: '#e83438' },
    layout: 'columns',
    columns: {
      es: [
        { label: 'Academia', text: 'Saber y formación.' },
        { label: 'Industria', text: 'Oportunidades reales.' },
        { label: 'Ciudad', text: 'Personas y redes.' }
      ],
      en: [
        { label: 'Academia', text: 'Knowledge and training.' },
        { label: 'Industry', text: 'Real opportunities.' },
        { label: 'City', text: 'People and networks.' }
      ],
      pt: [
        { label: 'Academia', text: 'Conhecimento e formação.' },
        { label: 'Indústria', text: 'Oportunidades reais.' },
        { label: 'Cidade', text: 'Pessoas e redes.' }
      ]
    }
  },
  {
    id: 'impacto',
    kicker: { es: 'FUERZA', en: 'FORCE', pt: 'FORÇA' },
    title: { es: 'Los eventos nunca fueron el objetivo.', en: 'Events were never the goal.', pt: 'Os eventos nunca foram o objetivo.' },
    subtitle: { es: 'El impacto sí.', en: 'The impact was.', pt: 'O impacto sim.' },
    tag: 'impacto',
    image: 'foto-3.jpg',
    theme: { accent: '#e83438', accent2: '#f28fbe', accent3: '#009fe1' },
    layout: 'split'
  },
  {
    id: 'comunidad',
    kicker: { es: 'CONVERGENCIA', en: 'CONVERGENCE', pt: 'CONVERGÊNCIA' },
    title: { es: 'Un evento trae personas.', en: 'An event brings people.', pt: 'Um evento traz pessoas.' },
    subtitle: { es: 'Una comunidad trae transformación.', en: 'A community brings transformation.', pt: 'Uma comunidade traz transformação.' },
    tag: 'FÓRUM / comunidad',
    theme: { accent: '#009fe1', accent2: '#e83438', accent3: '#f28fbe' },
    layout: 'split'
  },
  {
    id: 'talento',
    kicker: { es: 'ESPIRAL', en: 'SPIRAL', pt: 'ESPIRAL' },
    title: { es: 'El talento crece a la velocidad de la confianza.', en: 'Talent grows at the speed of trust.', pt: 'O talento cresce à velocidade da confiança.' },
    tag: 'crecimiento',
    theme: { accent: '#f28fbe', accent2: '#009fe1', accent3: '#e83438' },
    layout: 'quote'
  },
  {
    id: 'ruta',
    kicker: { es: 'RUTAS', en: 'PATHS', pt: 'CAMINHOS' },
    title: { es: 'La experiencia construye el camino.', en: 'Experience builds the path.', pt: 'A experiência constrói o caminho.' },
    subtitle: { es: 'Las nuevas generaciones descubren nuevas rutas.', en: 'New generations discover new routes.', pt: 'As novas gerações descobrem novas rotas.' },
    tag: 'generación',
    image: 'foto-4.jpg',
    theme: { accent: '#009fe1', accent2: '#e83438', accent3: '#f28fbe' },
    layout: 'split'
  },
  {
    id: 'vision',
    kicker: { es: 'DIÁLOGO', en: 'DIALOGUE', pt: 'DIÁLOGO' },
    title: { es: 'Una visión.', en: 'One vision.', pt: 'Uma visão.' },
    subtitle: { es: 'Dos generaciones.', en: 'Two generations.', pt: 'Duas gerações.' },
    tag: 'mirada',
    theme: { accent: '#f28fbe', accent2: '#009fe1', accent3: '#e83438' },
    layout: 'duo'
  },
  {
    id: 'sinergia',
    kicker: { es: 'TRABAJO EN RED', en: 'NETWORKED WORK', pt: 'TRABALHO EM REDE' },
    title: { es: 'El crecimiento no ocurre cuando una generación reemplaza a otra.', en: 'Growth does not happen when one generation replaces another.', pt: 'O crescimento não acontece quando uma geração substitui a outra.' },
    subtitle: { es: 'Ocurre cuando trabajan juntas.', en: 'It happens when they work together.', pt: 'Acontece quando trabalham juntas.' },
    tag: 'colaboración',
    theme: { accent: '#e83438', accent2: '#009fe1', accent3: '#f28fbe' },
    layout: 'quote'
  },
  {
    id: 'presente',
    kicker: { es: 'PRESENCIA', en: 'PRESENCE', pt: 'PRESENÇA' },
    title: { es: 'Los jóvenes no son el futuro.', en: 'Young people are not the future.', pt: 'Os jovens não são o futuro.' },
    subtitle: { es: 'Son el presente que muchas organizaciones aún no ven.', en: 'They are the present many organizations still do not see.', pt: 'São o presente que muitas organizações ainda não enxergam.' },
    tag: 'ahora',
    theme: { accent: '#009fe1', accent2: '#f28fbe', accent3: '#e83438' },
    layout: 'split'
  },
  {
    id: 'futuro',
    kicker: { es: 'NUEVO CICLO', en: 'NEW CYCLE', pt: 'NOVO CICLO' },
    title: { es: 'El futuro no se hereda.', en: 'The future is not inherited.', pt: 'O futuro não é herdado.' },
    subtitle: { es: 'Se construye.', en: 'It is built.', pt: 'É construído.' },
    tag: 'construcción',
    image: 'foto-5.jpeg',
    theme: { accent: '#e83438', accent2: '#f28fbe', accent3: '#009fe1' },
    layout: 'quote'
  },
  {
    id: 'qr',
    kicker: { es: 'QR • REDES', en: 'QR • SOCIALS', pt: 'QR • REDES' },
    title: { es: 'Conecta con la comunidad', en: 'Connect with the community', pt: 'Conecte-se com a comunidade' },
    tag: '@centrodeeventosupb',
    image: 'foto-6.jpg',
    theme: { accent: '#009fe1', accent2: '#f28fbe', accent3: '#e83438' },
    layout: 'qr'
  }
];

const LANGUAGES = {
  es: 'Español',
  en: 'English',
  pt: 'Português'
};

const state = {
  lang: 'es',
  current: 0,
  uiVisible: true,
  enteredAt: 0,
  prevMode: null
};

const app = document.querySelector('#app');

const shell = document.createElement('div');
shell.className = 'presentation-shell';
app.appendChild(shell);

const backgroundLayer = document.createElement('div');
backgroundLayer.className = 'background-layer';
const photoBackground = document.createElement('div');
photoBackground.className = 'photo-background';
backgroundLayer.appendChild(photoBackground);
const canvas = document.createElement('canvas');
canvas.className = 'legacy-canvas';
backgroundLayer.appendChild(canvas);
shell.appendChild(backgroundLayer);

const overlay = document.createElement('div');
overlay.className = 'presentation-overlay';
shell.appendChild(overlay);

const slidesLayer = document.createElement('div');
slidesLayer.className = 'slides-layer';
overlay.appendChild(slidesLayer);

const panel = document.createElement('aside');
panel.className = 'control-panel';
panel.innerHTML = `
  <div class="panel-top">
    <div class="brand">
      <span class="brand-main">FÓRUM</span>
      <span class="brand-sub">UPB</span>
    </div>
    <button class="toggle-ui" type="button" aria-label="Ocultar interfaz">Ocultar UI</button>
  </div>
  <div class="panel-controls">
    <label class="field">
      <span>Idioma</span>
      <select id="languageSelect" aria-label="Cambiar idioma">
        <option value="es">Español</option>
        <option value="en">English</option>
        <option value="pt">Português</option>
      </select>
    </label>
    <div class="counter-wrap">
      <span id="counterCurrent">01</span>
      <span class="counter-divider">/</span>
      <span id="counterTotal">13</span>
    </div>
    <div class="nav-row">
      <button class="nav-button" type="button" data-action="prev">Anterior</button>
      <button class="nav-button primary" type="button" data-action="next">Siguiente</button>
    </div>
  </div>
`;
app.appendChild(panel);

const identity = document.createElement('div');
identity.className = 'institutional-identity';
identity.innerHTML = `
  <img class="identity-lockup" src="${forumLogoUrl}" alt="UPB Fórum Centro de Eventos" />
`;
app.appendChild(identity);

const languageSelect = panel.querySelector('#languageSelect');
const counterCurrent = panel.querySelector('#counterCurrent');
const counterTotal = panel.querySelector('#counterTotal');
const toggleUiButton = panel.querySelector('.toggle-ui');

const localize = (value, lang) => {
  if (typeof value === 'object' && value !== null) {
    return value[lang] ?? value.es ?? '';
  }
  return value ?? '';
};

function buildColumns(columns, lang) {
  const list = columns?.[lang] ?? columns?.es ?? [];
  return `
    <div class="three-columns">
      ${list.map(item => `
        <article class="info-card">
          <span>${item.label}</span>
          <p>${item.text}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function buildSlideMarkup(slide, index) {
  const activeLang = state.lang;
  const title = localize(slide.title, activeLang);
  const subtitle = localize(slide.subtitle, activeLang);
  const kicker = localize(slide.kicker, activeLang);
  const tag = slide.tag ?? '';
  const media = slide.image ? `<div class="slide-media"><img src="${slide.image}" alt="${tag}" /></div>` : '';

  const base = `
    <div class="slide-content ${slide.layout}">
      <div class="slide-kicker">${kicker}</div>
      <h1 class="slide-title">${title}</h1>
      ${subtitle ? `<h2 class="slide-subtitle">${subtitle}</h2>` : ''}
      ${tag ? `<div class="slide-tag">${tag}</div>` : ''}
    </div>
  `;

  if (slide.layout === 'columns') {
    return `
      <section class="slide ${index === state.current ? 'is-active' : ''}" data-index="${index}">
        ${media}
        ${base}
        ${buildColumns(slide.columns, activeLang)}
      </section>
    `;
  }

  if (slide.layout === 'photo') {
    return `
      <section class="slide ${index === state.current ? 'is-active' : ''}" data-index="${index}">
        ${media}
        ${base}
      </section>
    `;
  }

  if (slide.layout === 'duo') {
    return `
      <section class="slide ${index === state.current ? 'is-active' : ''}" data-index="${index}">
        ${media}
        ${base}
        <div class="duo-layout">
          <div class="dual-disc dual-a"><span>${activeLang === 'es' ? 'Generación actual' : activeLang === 'en' ? 'Current generation' : 'Geração atual'}</span></div>
          <div class="dual-disc dual-b"><span>${activeLang === 'es' ? 'Generación nueva' : activeLang === 'en' ? 'New generation' : 'Nova geração'}</span></div>
        </div>
      </section>
    `;
  }

  if (slide.layout === 'qr') {
    return `
      <section class="slide ${index === state.current ? 'is-active' : ''}" data-index="${index}">
        ${media}
        ${base}
        <div class="qr-layout">
          <div class="qr-card qr-card-left">
            <div class="qr-frame" data-qr="https://www.instagram.com/centrodeeventosupb/"></div>
            <div class="qr-label">Anais</div>
          </div>
          <div class="qr-card qr-card-right">
            <div class="qr-frame" data-qr="https://www.instagram.com/centrodeeventosupb/"></div>
            <div class="qr-label">@centrodeeventosupb</div>
          </div>
        </div>
      </section>
    `;
  }

  if (slide.layout === 'quote') {
    return `
      <section class="slide ${index === state.current ? 'is-active' : ''}" data-index="${index}">
        ${media}
        ${base}
        <div class="quote-mark">“</div>
      </section>
    `;
  }

  return `
    <section class="slide ${index === state.current ? 'is-active' : ''}" data-index="${index}">
      ${media}
      ${base}
    </section>
  `;
}

function renderSlides() {
  slidesLayer.innerHTML = slides.map((slide, index) => buildSlideMarkup(slide, index)).join('');
}

function updateCounter() {
  counterCurrent.textContent = String(state.current + 1).padStart(2, '0');
  counterTotal.textContent = String(slides.length).padStart(2, '0');
}

async function renderQrCodes() {
  const qrNodes = document.querySelectorAll('.qr-frame');

  for (const node of qrNodes) {
    const href = node.dataset.qr;
    if (!href) continue;

    try {
      const dataUrl = await QRCode.toDataURL(href, {
        width: 180,
        margin: 1,
        color: {
          dark: '#111111',
          light: '#ffffff'
        }
      });

      node.innerHTML = `<img src="${dataUrl}" alt="QR code" />`;
    } catch (error) {
      node.textContent = 'QR';
    }
  }
}

function applyTheme(theme) {
  document.documentElement.style.setProperty('--accent', theme.accent || '#009fe1');
  document.documentElement.style.setProperty('--accent-2', theme.accent2 || '#f28fbe');
  document.documentElement.style.setProperty('--accent-3', theme.accent3 || '#e83438');
}

function setActiveSlide(index) {
  const safeIndex = Math.max(0, Math.min(index, slides.length - 1));
  if (safeIndex !== state.current) {
    state.prevMode = getSlideVisualMode(slides[state.current]);
    state.enteredAt = performance.now();
  }
  state.current = safeIndex;
  const slideNodes = slidesLayer.querySelectorAll('.slide');
  slideNodes.forEach((node, i) => node.classList.toggle('is-active', i === safeIndex));
  const slide = slides[safeIndex];
  photoBackground.style.backgroundImage = slide.image
    ? `url("${import.meta.env.BASE_URL}${slide.image}")`
    : 'none';
  applyTheme(slide.theme);
  updateCounter();
}

function changeLanguage(lang) {
  state.lang = lang;
  languageSelect.value = lang;
  renderSlides();
  setActiveSlide(state.current);
}

function toggleUi() {
  state.uiVisible = !state.uiVisible;
  document.body.classList.toggle('ui-hidden', !state.uiVisible);
  toggleUiButton.textContent = state.uiVisible ? 'Ocultar UI' : 'Mostrar UI';
}

function nextSlide() {
  setActiveSlide(state.current + 1);
}

function previousSlide() {
  setActiveSlide(state.current - 1);
}

panel.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'next') nextSlide();
  if (action === 'prev') previousSlide();
  if (event.target.closest('.toggle-ui')) toggleUi();
});

languageSelect.addEventListener('change', (event) => {
  changeLanguage(event.target.value);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
    event.preventDefault();
    nextSlide();
  }

  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();
    previousSlide();
  }
});

const ctx = canvas.getContext('2d');

const solarPlanets = [
  { name: 'Mercurio', au: 0.39, period: 87.97, eccentricity: 0.206, size: 5, tint: '#b8b1a8', type: 'rocky', offset: 0.2 },
  { name: 'Venus', au: 0.72, period: 224.70, eccentricity: 0.007, size: 8, tint: '#e7c58d', type: 'cloud', offset: 1.0 },
  { name: 'Tierra', au: 1.00, period: 365.25, eccentricity: 0.017, size: 9, tint: '#3187c7', type: 'earth', offset: 2.0 },
  { name: 'Marte', au: 1.52, period: 686.98, eccentricity: 0.094, size: 7, tint: '#bd6247', type: 'mars', offset: 3.0 },
  { name: 'Jupiter', au: 5.20, period: 4332.59, eccentricity: 0.049, size: 20, tint: '#d6a579', type: 'jupiter', offset: 4.3 },
  { name: 'Saturno', au: 9.54, period: 10759.22, eccentricity: 0.057, size: 17, tint: '#d9c08b', type: 'saturn', offset: 5.2 },
  { name: 'Urano', au: 19.19, period: 30688.5, eccentricity: 0.046, size: 13, tint: '#8bd5da', type: 'ice', offset: 6.1 },
  { name: 'Neptuno', au: 30.07, period: 60182, eccentricity: 0.010, size: 13, tint: '#477bd1', type: 'neptune', offset: 6.8 }
];

const stars = Array.from({ length: 220 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.7 + 0.5,
  alpha: Math.random() * 0.9 + 0.1
}));

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = backgroundLayer.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawBackground(width, height, time) {
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.52, 30, width * 0.5, height * 0.52, Math.max(width, height) * 0.85);
  gradient.addColorStop(0, 'rgba(12, 28, 40, 0.96)');
  gradient.addColorStop(0.38, 'rgba(7, 16, 24, 0.94)');
  gradient.addColorStop(1, 'rgba(2, 5, 9, 1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const nebulaColors = ['rgba(0,159,225,0.12)', 'rgba(242,143,190,0.12)', 'rgba(232,52,56,0.08)'];

  nebulaColors.forEach((color, index) => {
    const nebula = ctx.createRadialGradient(
      width * (0.25 + index * 0.2),
      height * (0.35 + index * 0.2),
      0,
      width * (0.25 + index * 0.2),
      height * (0.35 + index * 0.2),
      Math.max(width, height) * (0.28 + index * 0.16)
    );
    nebula.addColorStop(0, color);
    nebula.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);
  });

  stars.forEach((star) => {
    const x = star.x * width;
    const y = ((star.y + time * 0.00002) % 1) * height;
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function getSlideVisualMode(slide) {
  switch (slide.id) {
    case 'cover': return 'galaxy';
    case 'auditorio': return 'scatter';
    case 'encuentro': return 'attract';
    case 'triada': return 'triad';
    case 'impacto': return 'gravity';
    case 'comunidad': return 'cluster';
    case 'talento': return 'spiral';
    case 'ruta': return 'paths';
    case 'vision': return 'duality';
    case 'sinergia': return 'network';
    case 'presente': return 'present';
    case 'futuro': return 'merge';
    case 'qr': return 'final';
    default: return 'orbit';
  }
}

function drawSystem(width, height, time) {
  const activeSlide = slides[state.current];
  const theme = activeSlide.theme;
  const colors = [theme.accent, theme.accent2, theme.accent3, '#dfe7ff', '#c9f0ff', '#ffd166'];
  const mode = getSlideVisualMode(activeSlide);
  const baseCenterX = mode === 'duality' || mode === 'network' ? width * 0.58 : width * 0.68;
  const baseCenterY = height * 0.58;
  let centerX = baseCenterX;
  let centerY = baseCenterY;
  const orbitalScale = Math.min(1, width / 1700);
  const textSafe = {
    x: width * 0.04,
    y: height * 0.12,
    w: width * 0.39,
    h: height * 0.65
  };

  // Time since THIS slide became active. Every narrative transition below is
  // driven off this instead of the global clock, so a structural change
  // (dissolve, fusion, convergence...) always happens once, on entry, in
  // response to the slide — not as an endless ambient loop.
  const localElapsed = Math.max(0, time - state.enteredAt);
  const transitionT = Math.min(1, localElapsed / 2600);
  const easeT = transitionT < 0.5
    ? 4 * transitionT * transitionT * transitionT
    : 1 - Math.pow(-2 * transitionT + 2, 3) / 2;

  if (mode === 'spiral') {
    const travel = localElapsed * 0.00055;
    const travelRadius = 42 + Math.min(110, localElapsed * 0.012);
    centerX = baseCenterX + Math.cos(travel) * travelRadius;
    centerY = baseCenterY + Math.sin(travel) * travelRadius * 0.42;
  }

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.82);
  glow.addColorStop(0, 'rgba(255,247,188,0.45)');
  glow.addColorStop(0.1, 'rgba(255,214,102,0.22)');
  glow.addColorStop(0.3, 'rgba(0,159,225,0.18)');
  glow.addColorStop(0.65, 'rgba(242,143,190,0.08)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(centerX, centerY, Math.max(width, height) * 0.75, 0, Math.PI * 2);
  ctx.fill();

  const orbitRadius = (planet) => 78 + Math.sqrt(planet.au) * 58;
  const isDual = mode === 'duality' || mode === 'network' || mode === 'present' || mode === 'merge';
  const isTriad = mode === 'triad';
  const isPaths = mode === 'paths';
  const mergeProgress = mode === 'merge' ? Math.min(1, easeT + Math.sin(time * 0.00045) * 0.05) : 0;
  const leftSunX = centerX - (mode === 'merge' ? 150 * (1 - mergeProgress) : 170);
  const rightSunX = centerX + (mode === 'merge' ? 150 * (1 - mergeProgress) : 170);
  const triadSpread = 190 * (1 - easeT * 0.72);
  const triadNode = (group) => {
    const nodeAngle = group * ((Math.PI * 2) / 3) - Math.PI / 2;
    return { x: centerX + Math.cos(nodeAngle) * triadSpread, y: centerY + Math.sin(nodeAngle) * triadSpread * 0.5 };
  };
  const pathNode = (planetIndex) => {
    const nodeAngle = planetIndex * ((Math.PI * 2) / solarPlanets.length) - Math.PI / 2;
    const nodeRadius = 170 * orbitalScale;
    return {
      x: centerX + Math.cos(nodeAngle) * nodeRadius,
      y: centerY + Math.sin(nodeAngle) * nodeRadius * 0.5
    };
  };
  const guideCenters = isDual
    ? [{ x: leftSunX, y: centerY }, { x: rightSunX, y: centerY }]
    : isTriad
      ? [0, 1, 2].map(triadNode)
      : isPaths
        ? solarPlanets.map((_, index) => pathNode(index))
      : [{ x: centerX, y: centerY }];
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = 1;
  guideCenters.forEach((guideCenter) => {
    const guidePlanets = isDual ? solarPlanets.slice(0, 4) : isTriad ? solarPlanets.slice(0, 3) : isPaths ? [solarPlanets[guideCenters.indexOf(guideCenter)]] : solarPlanets;
    guidePlanets.forEach((planet) => {
      const radius = (isDual ? 34 + Math.sqrt(planet.au) * 18 : isTriad ? 40 + Math.sqrt(planet.au) * 15 : orbitRadius(planet)) * orbitalScale;
      ctx.beginPath();
      ctx.ellipse(guideCenter.x, guideCenter.y, radius, radius * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
  });
  const lerpChannel = (a, b, t) => Math.round(a + (b - a) * t);
  const lerpHex = (hexA, hexB, t) => {
    const a = parseInt(hexA.slice(1), 16);
    const b = parseInt(hexB.slice(1), 16);
    const r = lerpChannel((a >> 16) & 255, (b >> 16) & 255, t);
    const g = lerpChannel((a >> 8) & 255, (b >> 8) & 255, t);
    const bl = lerpChannel(a & 255, b & 255, t);
    return `rgb(${r}, ${g}, ${bl})`;
  };

  const drawSun = (x, y, scale = 1, tint = '#ffd76a') => {
    const localGlow = ctx.createRadialGradient(x, y, 0, x, y, 110 * scale);
    localGlow.addColorStop(0, 'rgba(255,246,193,1)');
    localGlow.addColorStop(0.2, 'rgba(255,190,90,0.9)');
    localGlow.addColorStop(0.45, 'rgba(255,120,95,0.48)');
    localGlow.addColorStop(1, 'rgba(255,120,95,0)');
    ctx.fillStyle = localGlow;
    ctx.beginPath();
    ctx.arc(x, y, 110 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = tint;
    ctx.shadowBlur = 40 * scale;
    ctx.shadowColor = tint;
    ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const drawGalaxyHalo = (x, y, tint, scale = 1) => {
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 190 * scale);
    halo.addColorStop(0, `${tint}55`);
    halo.addColorStop(0.42, `${tint}20`);
    halo.addColorStop(1, `${tint}00`);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.18);
    ctx.scale(1, 0.34);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 190 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  if (isDual && !(mode === 'merge' && mergeProgress > 0.72)) {
    drawGalaxyHalo(leftSunX, centerY, '#009fe1', mode === 'present' ? 0.9 : 1);
    drawGalaxyHalo(rightSunX, centerY, '#f28fbe', mode === 'present' ? 1.15 : 1);
    drawSun(leftSunX, centerY, mode === 'present' ? 0.86 : 0.72, '#ffd76a');
    drawSun(rightSunX, centerY, mode === 'present' ? 1.05 : 0.72, mode === 'present' ? '#f28fbe' : '#ffd76a');
  } else if (mode === 'merge') {
    drawSun(centerX, centerY, 0.72 + mergeProgress * 0.42, '#f5c66b');
  } else if (isTriad) {
    [0, 1, 2].forEach((group) => {
      const node = triadNode(group);
      drawSun(node.x, node.y, 0.42 + easeT * 0.3, colors[group]);
    });
  } else {
    // 'comunidad': dust and rock fusing under their own gravity, heating up
    // and finally igniting into a single living planet (magma -> living core).
    const sunScale = mode === 'attract' || mode === 'gravity'
      ? 1.28
      : mode === 'cluster' ? 0.55 + easeT * 1.05
        : mode === 'scatter' ? 1 - easeT * 0.32
          : 1;
    const sunTint = mode === 'cluster' ? lerpHex('#ff8c42', '#3fd68f', easeT) : '#ffd76a';
    drawSun(centerX, centerY, sunScale, sunTint);
  }

  if (mode === 'paths') {
    solarPlanets.forEach((planet, index) => {
      const node = pathNode(index);
      drawSun(node.x, node.y, 0.24 + (index % 3) * 0.025, colors[index % colors.length]);
    });
  }

  solarPlanets.forEach((planet, index) => {
    const baseRadius = orbitRadius(planet) * orbitalScale;
    let radius = baseRadius;
    const orbitalSpeed = (Math.PI * 2) / (planet.period * 32.85);
    let angle = time * orbitalSpeed + planet.offset + state.current * 0.02;
    let x = centerX;
    let y = centerY;
    let orbitCenterX = centerX;
    let orbitCenterY = centerY;
    let planetAlpha = 1;
    let planetScale = 1;

    switch (mode) {
      case 'scatter': {
        // El sistema pierde el rumbo: la órbita se rompe y todo se disuelve
        // progresivamente en el espacio a partir del instante en que entra el slide.
        const driftMag = (36 + index * 4) * (0.35 + easeT * 1.4);
        radius = baseRadius + Math.sin(localElapsed * 0.0015 + index) * driftMag + easeT * (55 + index * 16);
        angle += Math.sin(localElapsed * 0.001 + index) * 1.2 + easeT * 0.5;
        orbitCenterX += Math.cos(angle * 1.8) * (18 + index * 8) * (0.5 + easeT);
        orbitCenterY += Math.sin(angle * 1.4) * (12 + index * 5) * (0.5 + easeT);
        planetAlpha = Math.max(0.06, (0.55 + index * 0.05) * (1 - easeT * 0.78));
        planetScale = 0.72 + (1 - easeT) * 0.22;
        break;
      }
      case 'attract':
        radius = baseRadius * (0.96 + Math.sin(time * 0.0013 + index) * 0.025) * (0.88 + easeT * 0.12);
        angle += 0.2;
        planetScale = 1.05 + easeT * 0.18;
        break;
      case 'gravity':
        radius = baseRadius * (0.92 + Math.sin(time * 0.0017 + index) * 0.04);
        angle += 0.12;
        planetScale = 0.88 + (index / solarPlanets.length) * 0.3;
        break;
      case 'cluster': {
        // Fusión: las partículas caen hacia el centro y se funden en un solo cuerpo.
        radius = baseRadius * (0.82 - easeT * 0.62) + Math.cos(time * 0.0014 + index) * (6 * (1 - easeT));
        angle += index * 0.2 + easeT * 0.7;
        planetAlpha = Math.max(0, 1 - easeT * 0.92);
        planetScale = 0.64 + easeT * 0.35;
        break;
      }
      case 'triad': {
        const group = index % 3;
        const node = triadNode(group);
        orbitCenterX = centerX + (node.x - centerX) * easeT;
        orbitCenterY = centerY + (node.y - centerY) * easeT;
        radius = (46 + Math.floor(index / 3) * 22) * (0.7 + easeT * 0.3);
        angle += time * 0.0004 + group * 1.4;
        planetScale = 0.78 + easeT * 0.16;
        break;
      }
      case 'spiral':
        angle += time * 0.00032 + index * 0.9;
        radius = baseRadius + index * 7 + (time * 0.004 * (index + 1)) % 26;
        planetScale = 0.9 + (index % 3) * 0.08;
        break;
      case 'paths': {
        const node = pathNode(index);
        orbitCenterX = node.x;
        orbitCenterY = node.y;
        orbitCenterX = centerX + (orbitCenterX - centerX) * easeT;
        orbitCenterY = centerY + (orbitCenterY - centerY) * easeT;
        radius = 25 + (index % 3) * 7;
        angle += time * 0.00055 + index * 0.42;
        planetScale = 0.76 + (index % 3) * 0.1;
        break;
      }
      case 'duality':
        orbitCenterX = index < 4 ? leftSunX : rightSunX;
        radius = 48 + (index % 4) * 24;
        planetScale = 0.84;
        break;
      case 'network':
        if (index === 2 || index === 3 || index === 4 || index === 5) {
          const share = (Math.sin(time * 0.0007 + index) + 1) * 0.5;
          orbitCenterX = leftSunX + (rightSunX - leftSunX) * share;
          orbitCenterY = centerY + Math.sin(time * 0.0008 + index) * 18;
        } else {
          orbitCenterX = index < 4 ? leftSunX : rightSunX;
        }
        radius = 52 + (index % 4) * 26;
        angle += Math.sin(time * 0.0008) * 0.25;
        planetScale = index === 2 || index === 3 || index === 4 || index === 5 ? 1.12 : 0.92;
        break;
      case 'present':
        orbitCenterX = index < 4 ? leftSunX : rightSunX;
        radius = 52 + (index % 4) * 25;
        if (index < 4) planetAlpha = 0.22;
        if (index >= 4) planetScale = 1.28;
        if (index < 4) planetScale = 0.82;
        break;
      case 'merge':
        orbitCenterX = index < 4 ? leftSunX : rightSunX;
        orbitCenterX += (centerX - orbitCenterX) * mergeProgress;
        orbitCenterY = centerY + Math.sin(time * 0.001 + index) * mergeProgress * 14;
        radius = 52 + (index % 4) * 24;
        radius *= 1 - mergeProgress * 0.26;
        angle += mergeProgress * 0.5 + time * 0.00012;
        planetScale = 0.82 + mergeProgress * 0.28;
        break;
      case 'final':
        radius = baseRadius * 0.86;
        angle += time * 0.00042 + index * 0.18;
        planetScale = 1.02;
        break;
      default:
        break;
    }

    if (!isDual) {
      const trueRadius = radius * (1 - planet.eccentricity * planet.eccentricity) / (1 + planet.eccentricity * Math.cos(angle));
      x = orbitCenterX + Math.cos(angle) * trueRadius;
      y = orbitCenterY + Math.sin(angle) * trueRadius * 0.48;
    } else {
      x = orbitCenterX + Math.cos(angle) * radius;
      y = orbitCenterY + Math.sin(angle) * radius * 0.48;
    }

    const tint = planet.tint;

    if (mode === 'spiral') {
      ctx.save();
      ctx.beginPath();
      for (let trailStep = 10; trailStep >= 0; trailStep -= 1) {
        const trailAngle = angle - trailStep * 0.045;
        const trailRadius = radius * (1 - trailStep * 0.004);
        const trailX = orbitCenterX + Math.cos(trailAngle) * trailRadius;
        const trailY = orbitCenterY + Math.sin(trailAngle) * trailRadius * 0.48;
        if (trailStep === 10) ctx.moveTo(trailX, trailY); else ctx.lineTo(trailX, trailY);
      }
      ctx.strokeStyle = tint;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = Math.max(0.8, planet.size * 0.1);
      ctx.stroke();
      ctx.restore();
    }

    const shade = ctx.createRadialGradient(x - planet.size * 0.35, y - planet.size * 0.4, 1, x, y, planet.size * 1.5);
    shade.addColorStop(0, '#ffffff');
    shade.addColorStop(0.16, tint);
    shade.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.beginPath();
    ctx.fillStyle = shade;
    ctx.globalAlpha = planetAlpha;
    ctx.shadowBlur = 20;
    ctx.shadowColor = tint;
    ctx.arc(x, y, (planet.size + (mode === 'gravity' ? 2 : 0)) * planetScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (planet.type === 'jupiter' || planet.type === 'saturn') {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = planet.type === 'jupiter' ? '#8b604d' : '#8e795f';
      ctx.lineWidth = Math.max(1, planet.size * 0.14);
      [-0.35, 0, 0.35].forEach((band) => {
        ctx.beginPath();
        ctx.ellipse(x, y + band * planet.size, planet.size * 0.78, planet.size * 0.1, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    if (planet.type === 'saturn') {
      ctx.save();
      ctx.strokeStyle = 'rgba(235, 215, 166, 0.8)';
      ctx.lineWidth = Math.max(1, planet.size * 0.18);
      ctx.beginPath();
      ctx.ellipse(x, y, planet.size * 1.85, planet.size * 0.5, -0.16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });

  if (mode === 'cluster' && easeT > 0.52) {
    const earthProgress = Math.min(1, (easeT - 0.52) / 0.48);
    const earthRadius = 8 + earthProgress * 7;
    const earthGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, earthRadius * 2.5);
    earthGlow.addColorStop(0, 'rgba(63, 214, 143, 0.52)');
    earthGlow.addColorStop(0.45, 'rgba(49, 135, 199, 0.24)');
    earthGlow.addColorStop(1, 'rgba(49, 135, 199, 0)');
    ctx.fillStyle = earthGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    const earth = ctx.createRadialGradient(centerX - earthRadius * 0.35, centerY - earthRadius * 0.45, 1, centerX, centerY, earthRadius);
    earth.addColorStop(0, '#d9ffff');
    earth.addColorStop(0.18, '#3187c7');
    earth.addColorStop(0.62, '#24709e');
    earth.addColorStop(0.78, '#3fd68f');
    earth.addColorStop(1, '#0c344d');
    ctx.fillStyle = earth;
    ctx.shadowBlur = 28;
    ctx.shadowColor = '#3fd68f';
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function animate(time) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  drawBackground(width, height, time);
  drawSystem(width, height, time);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
renderSlides();
changeLanguage(state.lang);
setActiveSlide(0);
resizeCanvas();
renderQrCodes();
requestAnimationFrame(animate);

counterTotal.textContent = String(slides.length).padStart(2, '0');
languageSelect.value = state.lang;
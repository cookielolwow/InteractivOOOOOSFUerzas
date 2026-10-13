const STICKER_FILES = [
  'considerable puffy dog sticker.jpg',
  'gato sticker.png',
  'otro sticker.png',
  'sticker 4.png',
  'sticker perro.png',
  'sticker.png',
  'sticker2.png',
  'sticker3.png',
  'sticker5.png',
];

const STICKER_INSTANCES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 6];

function seededRandom(seed) {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

export class HolographicStickerDOMManager {
  constructor({ mount }) {
    this.mount = mount;
    this.stickers = [];
    this.onPointerMove = this.onPointerMove.bind(this);
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('resize', () => this.layout());
    this.createStickers();
    this.layout();
  }

  createStickers() {
    STICKER_INSTANCES.forEach((assetIndex, instanceIndex) => {
      const filename = STICKER_FILES[assetIndex];
      const source = `/${encodeURIComponent(filename)}`;
      const random = seededRandom(instanceIndex * 197 + assetIndex * 31);
      const image = document.createElement('img');
      const sticker = document.createElement('div');
      const foil = document.createElement('canvas');

      sticker.className = 'ui-sticker';
      sticker.setAttribute('aria-hidden', 'true');
      sticker.dataset.zone = instanceIndex < 3 ? 'menu' : instanceIndex < 9 ? 'rail' : 'footer';
      sticker.style.setProperty('--sticker-scale', (0.88 + random * 0.34).toFixed(2));
      sticker.style.setProperty('--sticker-rotation', `${(-17 + random * 34).toFixed(1)}deg`);
      sticker.style.setProperty('--sticker-float', `${(-1 + random * 2).toFixed(1)}px`);
      sticker.style.setProperty('--mouse-x', '50%');
      sticker.style.setProperty('--mouse-y', '50%');
      sticker.style.setProperty('--glare-opacity', '0.5');

      image.className = 'ui-sticker__image';
      image.src = source;
      image.alt = '';
      image.draggable = false;
      image.decoding = 'async';
      image.addEventListener('load', () => this.layout());

      foil.className = 'ui-sticker__foil';
      sticker.append(image, foil);
      this.mount.appendChild(sticker);
      this.stickers.push({
        element: sticker,
        image,
        foil,
        foilContext: foil.getContext('2d'),
        assetIndex,
        instanceIndex,
        random,
        jitterX: seededRandom(instanceIndex * 241 + assetIndex * 37),
        jitterY: seededRandom(instanceIndex * 347 + assetIndex * 43),
        mouseX: 0.5,
        mouseY: 0.5,
      });
    });
  }

  onPointerMove(event) {
    this.stickers.forEach((sticker) => {
      const { element } = sticker;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const localX = ((event.clientX - rect.left) / rect.width) * 100;
      const localY = ((event.clientY - rect.top) / rect.height) * 100;
      const distance = Math.hypot((event.clientX - (rect.left + rect.width / 2)) / rect.width, (event.clientY - (rect.top + rect.height / 2)) / rect.height);
      const glare = Math.max(0, 1 - distance * 1.25);
      sticker.mouseX = localX / 100;
      sticker.mouseY = localY / 100;
      element.style.setProperty('--mouse-x', `${localX.toFixed(1)}%`);
      element.style.setProperty('--mouse-y', `${localY.toFixed(1)}%`);
      element.style.setProperty('--glare-opacity', (0.42 + glare * 0.58).toFixed(2));
    });
  }

  layout() {
    const root = this.mount.getBoundingClientRect();
    const menu = document.querySelector('.paint-menubar');
    const menuItems = [...menu.querySelectorAll('button')];
    const tools = document.querySelector('.paint-tools');
    const stage = document.querySelector('.stage-shell');
    const footer = document.querySelector('.paint-footer');
    const palette = document.querySelector('.palette-area');
    if (!root.width || !root.height || !stage) return;

    const menuRect = menu.getBoundingClientRect();
    const lastMenuItem = menuItems.at(-1).getBoundingClientRect();
    const toolsRect = tools.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const paletteRect = palette.getBoundingClientRect();
    const statusRect = document.querySelector('.paint-status').getBoundingClientRect();
    const menuStart = lastMenuItem.right - root.left + 3;
    const menuWidth = Math.max(0, root.width - menuStart - 4);
    const railTop = Math.max(toolsRect.bottom + 15, stageRect.top + 12);
    const railBottom = stageRect.bottom - 14;
    const railLeft = toolsRect.left - root.left + 2;
    const railRight = stageRect.left - root.left - 3;
    const railWidth = Math.max(10, railRight - railLeft);
    const footerStart = Math.min(root.width - 8, paletteRect.right - root.left + 6);
    const footerWidth = Math.max(0, root.width - footerStart - 8);
    const footerTop = footerRect.top - root.top + 8;
    const footerBottom = Math.min(footerRect.bottom, statusRect.top).valueOf() - root.top - 6;
    const footerHeight = Math.max(0, footerBottom - footerTop);
    const placed = { menu: [], rail: [], footer: [] };
    this.stickers.forEach(({ element, image, foil, instanceIndex, jitterX, jitterY }) => {
      const zone = element.dataset.zone;
      let x;
      let y;
      let maxWidth;
      let maxHeight;

      if (zone === 'menu') {
        maxWidth = Math.max(10, Math.min(42, menuWidth * 0.48));
        maxHeight = Math.max(12, menuRect.height - 2);
        x = menuStart + maxWidth * 0.5 + jitterX * Math.max(0, menuWidth - maxWidth);
        y = menuRect.top - root.top + maxHeight * 0.5 + jitterY * Math.max(0, menuRect.height - maxHeight);
      } else if (zone === 'rail') {
        maxWidth = Math.max(10, Math.min(42, railWidth * 0.88));
        maxHeight = Math.min(48, Math.max(12, railBottom - railTop));
        x = railLeft + maxWidth * 0.5 + jitterX * Math.max(0, railWidth - maxWidth);
        y = railTop + maxHeight * 0.5 + jitterY * Math.max(0, railBottom - railTop - maxHeight);
      } else {
        maxWidth = Math.max(10, Math.min(52, footerWidth * 0.34));
        maxHeight = Math.max(12, Math.min(46, footerHeight * 0.54));
        x = footerStart + maxWidth * 0.5 + jitterX * Math.max(0, footerWidth - maxWidth);
        y = footerTop + maxHeight * 0.5 + jitterY * Math.max(0, footerHeight - maxHeight);
      }

      const naturalWidth = image.naturalWidth || 1;
      const naturalHeight = image.naturalHeight || 1;
      const aspect = naturalWidth / naturalHeight;
      const scale = Number(element.style.getPropertyValue('--sticker-scale')) || 1;
      const rotation = Number(element.style.getPropertyValue('--sticker-rotation').replace('deg', '')) || 0;
      const radians = Math.abs(rotation * Math.PI / 180);
      const projectedWidth = Math.abs(Math.cos(radians)) * aspect + Math.abs(Math.sin(radians));
      const projectedHeight = Math.abs(Math.sin(radians)) * aspect + Math.abs(Math.cos(radians));
      let imageHeight = Math.min(
        48 * (0.75 + jitterY * 0.3),
        maxHeight / (scale * projectedHeight),
        maxWidth / (scale * projectedWidth),
      );
      const safeArea = zone === 'menu'
        ? { left: menuStart + 2, right: root.width - 4, top: menuRect.top - root.top + 2, bottom: menuRect.bottom - root.top - 2 }
        : zone === 'rail'
          ? { left: railLeft + 2, right: railRight - 2, top: railTop + 2, bottom: railBottom - 2 }
          : { left: footerStart + 2, right: root.width - 5, top: footerTop + 2, bottom: footerBottom - 2 };
      let placement = null;

      for (let shrink = 0; shrink < 7 && !placement; shrink += 1) {
        const width = imageHeight * aspect;
        const height = imageHeight;
        const boundsWidth = (width * Math.abs(Math.cos(radians)) + height * Math.abs(Math.sin(radians))) * scale + 3;
        const boundsHeight = (width * Math.abs(Math.sin(radians)) + height * Math.abs(Math.cos(radians))) * scale + 3;
        if (boundsWidth <= safeArea.right - safeArea.left && boundsHeight <= safeArea.bottom - safeArea.top) {
          for (let attempt = 0; attempt < 140; attempt += 1) {
            const randomX = seededRandom(instanceIndex * 1709 + attempt * 2 + shrink * 31);
            const randomY = seededRandom(instanceIndex * 2029 + attempt * 2 + 1 + shrink * 47);
            const centerX = safeArea.left + boundsWidth * 0.5 + randomX * (safeArea.right - safeArea.left - boundsWidth);
            const centerY = safeArea.top + boundsHeight * 0.5 + randomY * (safeArea.bottom - safeArea.top - boundsHeight);
            const box = { left: centerX - boundsWidth * 0.5, right: centerX + boundsWidth * 0.5, top: centerY - boundsHeight * 0.5, bottom: centerY + boundsHeight * 0.5 };
            const noCollision = placed[zone].every((other) =>
              box.right <= other.left || box.left >= other.right || box.bottom <= other.top || box.top >= other.bottom,
            );
            if (noCollision) {
              placement = { centerX, centerY, box, width, height };
              break;
            }
          }
        }
        imageHeight *= 0.86;
      }

      if (!placement) return;
      placed[zone].push(placement.box);
      element.style.left = `${placement.centerX}px`;
      element.style.top = `${placement.centerY}px`;
      element.style.width = `${placement.width}px`;
      element.style.height = `${placement.height}px`;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      foil.width = Math.max(1, Math.round(placement.width * pixelRatio));
      foil.height = Math.max(1, Math.round(placement.height * pixelRatio));
    });
  }

  resize() {
    this.layout();
  }

  update(time) {
    this.stickers.forEach(({ element, image, foil, foilContext, instanceIndex, mouseX, mouseY }) => {
      const rotation = Number(element.style.getPropertyValue('--sticker-rotation').replace('deg', '')) || 0;
      const scale = Number(element.style.getPropertyValue('--sticker-scale')) || 1;
      const phase = instanceIndex * 1.17;
      const float = Math.sin(time * 0.7 + phase) * 1.25;
      element.style.transform = `translate(-50%, -50%) rotate(${rotation + Math.sin(time * 0.34 + phase) * 1.2}deg) scale(${scale}) translateY(${float}px)`;

      if (!image.complete || !image.naturalWidth || !foilContext) return;
      const width = foil.width;
      const height = foil.height;
      const drift = Math.sin(time * 0.22 + phase) * width * 0.28;
      const rainbow = foilContext.createLinearGradient(-width * 0.22 + drift, height, width * 1.2 + drift, 0);
      [
        [0, '#32fff4'], [0.17, '#3ab7ff'], [0.34, '#8b72ff'],
        [0.52, '#ef63ff'], [0.68, '#ff5da8'], [0.84, '#fff06d'], [1, '#62ffc1'],
      ].forEach(([stop, color]) => rainbow.addColorStop(stop, color));

      foilContext.clearRect(0, 0, width, height);
      foilContext.globalCompositeOperation = 'source-over';
      foilContext.globalAlpha = 0.84;
      foilContext.fillStyle = rainbow;
      foilContext.fillRect(0, 0, width, height);

      const pointerX = mouseX * width;
      const pointerY = mouseY * height;
      const radius = Math.max(width, height) * 0.9;
      const glare = foilContext.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, radius);
      glare.addColorStop(0, 'rgba(255,255,255,1)');
      glare.addColorStop(0.13, 'rgba(235,255,255,.8)');
      glare.addColorStop(0.4, 'rgba(255,255,255,.16)');
      glare.addColorStop(1, 'rgba(255,255,255,0)');
      foilContext.globalAlpha = 0.9;
      foilContext.fillStyle = glare;
      foilContext.fillRect(0, 0, width, height);

      const stripe = foilContext.createLinearGradient(pointerX - height, pointerY + height, pointerX + height, pointerY - height);
      stripe.addColorStop(0, 'rgba(255,255,255,0)');
      stripe.addColorStop(0.48, 'rgba(255,255,255,0)');
      stripe.addColorStop(0.5, 'rgba(255,255,255,.95)');
      stripe.addColorStop(0.52, 'rgba(255,255,255,0)');
      stripe.addColorStop(1, 'rgba(255,255,255,0)');
      foilContext.globalAlpha = 0.9;
      foilContext.fillStyle = stripe;
      foilContext.fillRect(0, 0, width, height);

      foilContext.globalCompositeOperation = 'destination-in';
      foilContext.globalAlpha = 1;
      foilContext.drawImage(image, 0, 0, width, height);
      foilContext.globalCompositeOperation = 'source-over';
    });
  }

  dispose() {
    window.removeEventListener('pointermove', this.onPointerMove);
    this.stickers.forEach(({ element }) => element.remove());
    this.stickers.length = 0;
  }
}
export const PALETTE = {
  CHERRY_RED: '#CC0033',
  ROYAL_BLUE: '#1a3a8a',
  COBALT: '#2255AA', 
  GOLD: '#D4A853',
  CREAM: '#E8D5A3',
  DARK_NAVY: '#0A0E2A',
  HOT_PINK: '#FF1493',
  PEARL: '#FFF5EE',
  BLACK: '#1A1A1A'
};

const LYRICS = [
  "gIrL LiKe mE",
  "fAnCy tHaT!",
  "come talk to me",
  "bOy'S a lIaR",
  "JuSt fOr Me",
  "i mUsT aPoLoGiZe"
];

const FONTS = ["Arial", "Courier New", "Georgia", "Comic Sans MS", "Impact"];
const LYRIC_COLORS = [PALETTE.CHERRY_RED, PALETTE.GOLD, PALETTE.ROYAL_BLUE, '#FFFFFF'];

function drawStar(ctx, x, y, radius, points) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? radius : radius / 2;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCherry(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  // Stems
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(-size/2, -size/2, -size/2, 0);
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size/2, -size/2, size/2, 0);
  ctx.strokeStyle = '#228B22';
  ctx.lineWidth = size / 10;
  ctx.stroke();
  // Cherries
  ctx.fillStyle = PALETTE.CHERRY_RED;
  ctx.beginPath();
  ctx.arc(-size/2, 0, size/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size/2, 0, size/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y - size/4);
  ctx.beginPath();
  ctx.moveTo(0, size/4);
  ctx.bezierCurveTo(-size/2, -size/4, -size, size/2, 0, size);
  ctx.bezierCurveTo(size, size/2, size/2, -size/4, 0, size/4);
  ctx.fill();
  ctx.restore();
}

function drawCrown(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-size, size/2);
  ctx.lineTo(-size, -size/2);
  ctx.lineTo(-size/3, 0);
  ctx.lineTo(0, -size/1.2);
  ctx.lineTo(size/3, 0);
  ctx.lineTo(size, -size/2);
  ctx.lineTo(size, size/2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLip(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.quadraticCurveTo(-size/2, -size/2, 0, -size/6);
  ctx.quadraticCurveTo(size/2, -size/2, size, 0);
  ctx.quadraticCurveTo(size/2, size/3, 0, size/3);
  ctx.quadraticCurveTo(-size/2, size/3, -size, 0);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.quadraticCurveTo(0, size/1.5, size, 0);
  ctx.quadraticCurveTo(0, size/3, -size, 0);
  ctx.fill();
  ctx.restore();
}

export class FancyBackground {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.beatPulse = 0;
    
    this.initTartan();
    
    this.elements = [];
    const numElements = 30;
    const types = ['star', 'cherry', 'heart', 'crown', 'lip'];
    for (let i = 0; i < numElements; i++) {
      this.elements.push({
        type: types[Math.floor(Math.random() * types.length)],
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 15 + Math.random() * 25,
        rotation: Math.random() * Math.PI * 2,
        opacity: 0.15 + Math.random() * 0.25,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vrot: (Math.random() - 0.5) * 0.05
      });
    }

    this.lyrics = [];
    this.rings = [];
  }

  initTartan() {
    const size = 300;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = size;
    offCanvas.height = size;
    const offCtx = offCanvas.getContext('2d');

    // Base
    offCtx.fillStyle = PALETTE.CHERRY_RED;
    offCtx.fillRect(0, 0, size, size);

    // Black stripes (blend)
    offCtx.fillStyle = 'rgba(26, 26, 26, 0.35)';
    offCtx.fillRect(40, 0, 60, size);
    offCtx.fillRect(180, 0, 25, size);
    offCtx.fillRect(0, 40, size, 60);
    offCtx.fillRect(0, 180, size, 25);

    // Cobalt stripes
    offCtx.fillStyle = 'rgba(34, 85, 170, 0.45)';
    offCtx.fillRect(120, 0, 40, size);
    offCtx.fillRect(0, 120, size, 40);

    // Gold thin lines
    offCtx.fillStyle = PALETTE.CREAM;
    offCtx.fillRect(70, 0, 4, size);
    offCtx.fillRect(190, 0, 4, size);
    offCtx.fillRect(0, 70, size, 4);
    offCtx.fillRect(0, 190, size, 4);

    this.tartanCanvas = offCanvas;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  update(time, beatPulse) {
    const dt = time - this.time;
    this.time = time;
    this.beatPulse = beatPulse;

    // Elements
    for (let el of this.elements) {
      el.x += el.vx;
      el.y += el.vy;
      el.rotation += el.vrot;
      if (el.x < -100) el.x = this.width + 100;
      if (el.x > this.width + 100) el.x = -100;
      if (el.y < -100) el.y = this.height + 100;
      if (el.y > this.height + 100) el.y = -100;
    }

    // Lyrics
    if (Math.random() < 0.015 && this.lyrics.length < 5) {
      const text = LYRICS[Math.floor(Math.random() * LYRICS.length)];
      const font = FONTS[Math.floor(Math.random() * FONTS.length)];
      const color = LYRIC_COLORS[Math.floor(Math.random() * LYRIC_COLORS.length)];
      this.lyrics.push({
        text,
        x: this.width * 0.2 + Math.random() * this.width * 0.6,
        y: this.height * 0.2 + Math.random() * this.height * 0.6,
        font: `bold ${24 + Math.random() * 32}px "${font}"`,
        color,
        rotation: (Math.random() - 0.5) * 0.5,
        life: 0,
        maxLife: 3 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 30,
        vy: -10 - Math.random() * 20
      });
    }

    for (let i = this.lyrics.length - 1; i >= 0; i--) {
      let l = this.lyrics[i];
      l.life += dt;
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      if (l.life >= l.maxLife) {
        this.lyrics.splice(i, 1);
      }
    }

    // Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      let r = this.rings[i];
      r.life += dt;
      if (r.life >= r.maxLife) {
        this.rings.splice(i, 1);
      }
    }
  }

  triggerBeatRing(x, y, color) {
    this.rings.push({
      x, y, color, life: 0, maxLife: 0.8
    });
  }

  render(ctx) {
    // 1. Tartan Background
    ctx.save();
    const pattern = ctx.createPattern(this.tartanCanvas, 'repeat');
    ctx.fillStyle = pattern;
    
    // Scroll diagonally
    const scrollX = (this.time * 50) % 300;
    const scrollY = (this.time * 30) % 300;
    ctx.translate(-scrollX, -scrollY);
    ctx.fillRect(scrollX, scrollY, this.width + 300, this.height + 300);
    ctx.restore();

    // 2. Royal Blue Vignette
    ctx.save();
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = Math.max(cx, cy) * 1.5;
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    const pulseAlpha = 0.3 + this.beatPulse * 0.15;
    // convert #1a3a8a to rgb(26,58,138)
    grad.addColorStop(1, `rgba(26, 58, 138, ${pulseAlpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    // 3. Floating Elements
    for (let el of this.elements) {
      ctx.save();
      ctx.globalAlpha = el.opacity;
      
      switch(el.type) {
        case 'star':
          ctx.fillStyle = PALETTE.GOLD;
          drawStar(ctx, el.x, el.y, el.size, 5);
          break;
        case 'cherry':
          drawCherry(ctx, el.x, el.y, el.size);
          break;
        case 'heart':
          ctx.fillStyle = PALETTE.CHERRY_RED;
          drawHeart(ctx, el.x, el.y, el.size);
          break;
        case 'crown':
          ctx.fillStyle = PALETTE.GOLD;
          drawCrown(ctx, el.x, el.y, el.size);
          break;
        case 'lip':
          ctx.fillStyle = PALETTE.CHERRY_RED;
          drawLip(ctx, el.x, el.y, el.size);
          break;
      }
      ctx.restore();
    }

    // 4. Floating Lyrics
    for (let l of this.lyrics) {
      ctx.save();
      const progress = l.life / l.maxLife;
      let alpha = 1;
      if (progress < 0.1) alpha = progress / 0.1;
      if (progress > 0.8) alpha = (1 - progress) / 0.2;
      
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rotation);
      
      ctx.font = l.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Shadow / scrapbook effect
      ctx.fillStyle = PALETTE.DARK_NAVY;
      ctx.fillText(l.text, 3, 3);
      
      // Inner fill
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, 0, 0);
      
      ctx.strokeStyle = PALETTE.PEARL;
      ctx.lineWidth = 1.5;
      ctx.strokeText(l.text, 0, 0);
      
      ctx.restore();
    }

    // 5. Beat Pulse Rings
    for (let r of this.rings) {
      ctx.save();
      const progress = r.life / r.maxLife;
      // ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const radius = easeOut * 200;
      
      ctx.globalAlpha = 1 - progress;
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 8 * (1 - progress);
      ctx.stroke();
      
      // inner ring
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3 * (1 - progress);
      ctx.stroke();
      ctx.restore();
    }
  }
}

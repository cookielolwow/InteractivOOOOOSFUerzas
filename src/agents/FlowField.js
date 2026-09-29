// Flow Field generator based on Simplex Noise
// Designed with 138 BPM temporal modulation for UK Garage rhythms

import { noise } from '../noise.js';

export class FlowField {
  constructor(resolution = 32) {
    this.resolution = resolution;
    this.cols = 0;
    this.rows = 0;
    this.grid = [];
    this.zOffset = 0;
    this.swirlCenter = { x: 0, y: 0, strength: 0 };
    this.noiseScale = 0.0035;
    this.timeSpeed = 0.0008;
    this.mode = 'stream'; // 'stream', 'swirl', 'waves'
  }

  resize(width, height) {
    this.cols = Math.ceil(width / this.resolution);
    this.rows = Math.ceil(height / this.resolution);
    this.grid = new Float32Array(this.cols * this.rows);
  }

  setMode(mode) {
    this.mode = mode;
  }

  triggerSwirl(x, y, strength = 1.0) {
    this.swirlCenter = { x, y, strength };
  }

  update(time, tempoMod = 1.0) {
    this.zOffset += this.timeSpeed * tempoMod;

    // Decay swirl
    if (this.swirlCenter.strength > 0.01) {
      this.swirlCenter.strength *= 0.96;
    } else {
      this.swirlCenter.strength = 0;
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.resolution;
        const y = r * this.resolution;

        let angle = noise.noise2D(x * this.noiseScale, y * this.noiseScale + this.zOffset) * Math.PI * 2;

        if (this.mode === 'waves') {
          // Syncopated wave pulses
          angle += Math.sin(x * 0.01 + this.zOffset * 10) * 0.8;
        }

        // Swirl vortex if active
        if (this.swirlCenter.strength > 0.05) {
          const dx = x - this.swirlCenter.x;
          const dy = y - this.swirlCenter.y;
          const dist = Math.hypot(dx, dy) + 1;
          const swirlFactor = (1000 / (dist + 200)) * this.swirlCenter.strength;
          const tangentAngle = Math.atan2(dy, dx) + Math.PI * 0.5;
          angle = angle * (1 - swirlFactor * 0.5) + tangentAngle * (swirlFactor * 0.5);
        }

        this.grid[r * this.cols + c] = angle;
      }
    }
  }

  getAngleAt(x, y) {
    const c = Math.floor(x / this.resolution);
    const r = Math.floor(y / this.resolution);

    const clampedC = Math.max(0, Math.min(this.cols - 1, c));
    const clampedR = Math.max(0, Math.min(this.rows - 1, r));

    return this.grid[clampedR * this.cols + clampedC] || 0;
  }

  // Draw flow field vectors for visual debug / performance feedback
  draw(ctx, opacity = 0.15) {
    if (opacity <= 0.01) return;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 112, 166, ${opacity})`;
    ctx.lineWidth = 1;

    const len = this.resolution * 0.45;
    for (let r = 0; r < this.rows; r += 2) {
      for (let c = 0; c < this.cols; c += 2) {
        const x = c * this.resolution + this.resolution * 0.5;
        const y = r * this.resolution + this.resolution * 0.5;
        const angle = this.grid[r * this.cols + c];

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

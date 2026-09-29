// Interactive Physarum Trail Buffer (Slime Mold chemical deposition & diffusion)
// Generates dreamy phosphorescent trails matching PinkPantheress Y2K aesthetic

export class PhysarumTrailBuffer {
  constructor(width, height) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.width = width;
    this.height = height;

    // Trail simulation parameters
    this.decayRate = 0.07; // Fade speed [0.01 - 0.2]
    this.diffusion = true;
    this.active = true;
    this.readCounter = 0;
    this.cachedImageData = null;

    this.resize(width, height);
  }

  resize(width, height) {
    this.width = Math.max(10, width);
    this.height = Math.max(10, height);
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Initialize with dark dreamy background
    this.ctx.fillStyle = '#0B0410';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // Deposit chemical / bioluminescent trail from an agent
  deposit(x, y, radius, colorHex, intensity = 1.0) {
    if (!this.active) return;

    this.ctx.save();
    this.ctx.globalAlpha = Math.min(1.0, 0.45 * intensity);
    this.ctx.shadowBlur = 10 * intensity;
    this.ctx.shadowColor = colorHex;
    this.ctx.fillStyle = colorHex;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * 0.9, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  // Diffuse and evaporate the chemical trail map
  diffuseAndDecay() {
    if (!this.active) return;

    // Evaporation (chemical decay)
    this.ctx.save();
    this.ctx.fillStyle = `rgba(11, 4, 16, ${this.decayRate})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();

    // Cache image data every 3 frames for sensor reading (boosts FPS to 60+ effortlessly)
    this.readCounter++;
    if (this.readCounter % 3 === 0) {
      try {
        this.cachedImageData = this.ctx.getImageData(0, 0, this.width, this.height).data;
      } catch (e) {
        // Fallback if canvas is tainted or in edge cases
        this.cachedImageData = null;
      }
    }
  }

  getTrailData() {
    return this.cachedImageData;
  }

  clear() {
    this.ctx.fillStyle = '#0B0410';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // Render the trail layer onto main display
  renderTo(targetCtx, opacity = 0.85) {
    if (!this.active || opacity <= 0.01) return;

    targetCtx.save();
    targetCtx.globalAlpha = opacity;
    targetCtx.drawImage(this.canvas, 0, 0);
    targetCtx.restore();
  }
}

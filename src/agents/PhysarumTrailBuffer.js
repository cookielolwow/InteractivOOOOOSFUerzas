// Interactive Physarum Trail Buffer (Slime Mold chemical deposition & diffusion)
// Generates dreamy phosphorescent trails matching PinkPantheress Y2K aesthetic

export class PhysarumTrailBuffer {
  constructor(width, height) {
    // The trail is a soft chemical field; half-resolution keeps its texture
    // while cutting full-screen diffusion and sensor readbacks to one quarter.
    this.resolutionScale = 0.5;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.diffusionCanvas = document.createElement('canvas');
    this.diffusionCtx = this.diffusionCanvas.getContext('2d');
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
    this.screenWidth = Math.max(10, width);
    this.screenHeight = Math.max(10, height);
    this.width = Math.max(10, Math.round(this.screenWidth * this.resolutionScale));
    this.height = Math.max(10, Math.round(this.screenHeight * this.resolutionScale));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.diffusionCanvas.width = this.width;
    this.diffusionCanvas.height = this.height;

    // Initialize with dark dreamy background
    this.ctx.fillStyle = '#0B0410';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // Deposit chemical / bioluminescent trail from an agent
  deposit(x, y, radius, colorHex, intensity = 1.0) {
    if (!this.active) return;

    this.ctx.save();
    this.ctx.globalAlpha = Math.min(0.46, 0.27 * intensity);
    // Blur is applied once to the trail layer during diffusion, avoiding a
    // costly per-agent shadow filter on every frame.
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = colorHex;

    this.ctx.beginPath();
    this.ctx.arc(x * this.resolutionScale, y * this.resolutionScale,
      Math.max(1, radius * this.resolutionScale * 0.9), 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  // Diffuse and evaporate the chemical trail map
  diffuseAndDecay() {
    if (!this.active) return;

    this.readCounter++;
    // A light blur spreads the deposited chemical locally; every third frame
    // keeps the visible trail and the agents' sampled field in agreement.
    if (this.diffusion && this.readCounter % 3 === 0) {
      this.diffusionCtx.clearRect(0, 0, this.width, this.height);
      this.diffusionCtx.drawImage(this.canvas, 0, 0);
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.filter = 'blur(1.15px)';
      this.ctx.drawImage(this.diffusionCanvas, 0, 0);
      this.ctx.filter = 'none';
      this.ctx.restore();
    }

    // Evaporation (chemical decay)
    this.ctx.save();
    this.ctx.fillStyle = `rgba(11, 4, 16, ${this.decayRate})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();

    // Sensor data is refreshed every fourth frame; the field changes slowly
    // enough that the agents still follow it fluidly.
    if (this.readCounter % 4 === 0) {
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
    targetCtx.globalCompositeOperation = 'screen';
    targetCtx.drawImage(this.canvas, 0, 0, this.screenWidth, this.screenHeight);
    targetCtx.restore();
  }
}

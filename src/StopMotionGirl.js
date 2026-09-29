export class StopMotionGirl {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.frame = 0;
    this.lastBeatTime = 0;
  }

  update(time, pulse) {
    // Change frame on strong pulse (beat hit)
    if (pulse > 0.8 && time - this.lastBeatTime > 200) {
      this.frame = Math.floor(Math.random() * 4);
      this.lastBeatTime = time;
    }
  }

  drawGirl(ctx, x, y, scale, frameIdx) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Stop motion paper cutout effect (slight rotation per frame)
    const shakeRot = (Math.random() - 0.5) * 0.05;
    ctx.rotate(shakeRot);

    // Colors
    const skin = '#D99A75';
    const hair = '#A85B32';
    const lip = '#CC0033';
    const black = '#111';
    const white = '#FFF';

    // Face base
    ctx.fillStyle = skin;
    ctx.beginPath();
    // Jawline
    ctx.moveTo(-40, 20);
    ctx.bezierCurveTo(-30, 70, 30, 70, 40, 20);
    ctx.bezierCurveTo(40, -40, -40, -40, -40, 20);
    ctx.fill();

    // Neck
    ctx.beginPath();
    ctx.moveTo(-15, 60);
    ctx.lineTo(-20, 100);
    ctx.lineTo(20, 100);
    ctx.lineTo(15, 60);
    ctx.fill();

    // Hair (Back layer)
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -10, 55, Math.PI, 0);
    ctx.lineTo(60, 80);
    ctx.lineTo(-60, 80);
    ctx.fill();

    // Hair (Bangs)
    ctx.beginPath();
    ctx.moveTo(-50, -10);
    ctx.bezierCurveTo(-20, -20, 20, -20, 50, -10);
    ctx.bezierCurveTo(30, 10, -30, 10, -50, -10);
    ctx.fill();
    // Extra bangs
    ctx.fillRect(-15, -30, 5, 40);
    ctx.fillRect(0, -30, 4, 35);
    ctx.fillRect(15, -30, 5, 40);

    // Eyes
    ctx.fillStyle = white;
    // Left eye
    if (frameIdx === 1) { // Winking
      ctx.strokeStyle = black;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-35, 10);
      ctx.bezierCurveTo(-25, 0, -15, 10, -35, 10);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(-25, 10, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = black;
      ctx.beginPath();
      ctx.arc(-25, 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Right eye
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.ellipse(25, 10, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = black;
    ctx.beginPath();
    ctx.arc(25, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyeliner / lashes
    ctx.strokeStyle = black;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, 8);
    ctx.quadraticCurveTo(25, 0, 35, 8);
    ctx.stroke();
    if (frameIdx !== 1) {
      ctx.beginPath();
      ctx.moveTo(-35, 8);
      ctx.quadraticCurveTo(-25, 0, -15, 8);
      ctx.stroke();
    }

    // Lips
    ctx.fillStyle = lip;
    if (frameIdx === 2) {
      // open O mouth
      ctx.beginPath();
      ctx.ellipse(0, 45, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = black;
      ctx.beginPath();
      ctx.ellipse(0, 45, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (frameIdx === 3) {
      // big smile
      ctx.beginPath();
      ctx.moveTo(-15, 40);
      ctx.quadraticCurveTo(0, 55, 15, 40);
      ctx.quadraticCurveTo(0, 45, -15, 40);
      ctx.fill();
    } else {
      // normal lips
      ctx.beginPath();
      ctx.moveTo(-15, 42);
      ctx.quadraticCurveTo(0, 35, 15, 42);
      ctx.quadraticCurveTo(0, 50, -15, 42);
      ctx.fill();
      // teeth
      ctx.fillStyle = white;
      ctx.fillRect(-5, 42, 10, 2);
    }

    // Cutout shadow/border to make it look like a paper sticker
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(-65, -65, 130, 170); // Just a generic frame around her

    ctx.restore();
  }

  render(ctx, pulse) {
    // We can draw a 3x3 grid of her face in the background, or just one big one.
    // Let's do a Rhythm Heaven style popup in the center that bounces.
    
    // Squash and stretch based on pulse
    const bounce = 1 + (pulse * 0.2);
    const scaleX = 2.5 * (1 + pulse * 0.1);
    const scaleY = 2.5 * (1 - pulse * 0.1);
    
    ctx.save();
    ctx.globalAlpha = 0.85;
    
    // Draw 3x3 Warhol style Grid
    const gw = 180;
    const gh = 200;
    const cx = this.width / 2;
    const cy = this.height / 2;
    
    // Only show grid on strong beats? Or always show? Let's just draw one big one in the center 
    // and maybe some small ones around
    this.drawGirl(ctx, cx, cy, 3 * bounce, this.frame);
    
    // Draw some side ones with different frames
    this.drawGirl(ctx, cx - 350, cy, 1.5, (this.frame + 1) % 4);
    this.drawGirl(ctx, cx + 350, cy, 1.5, (this.frame + 2) % 4);

    ctx.restore();
  }
}

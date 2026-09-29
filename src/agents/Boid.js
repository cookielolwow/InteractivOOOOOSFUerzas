// Autonomous Agent (Boid) with Reynolds Steering, Flocking, Flow Field & Physarum Chemotaxis
// Tailored for the Y2K Aesthetic of PinkPantheress & Rhythm Heaven Bouncy Style

export class Boid {
  constructor(x, y, id, type = 0) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.0;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.ax = 0;
    this.ay = 0;

    this.maxSpeed = 3.6 + Math.random() * 1.2;
    this.maxForce = 0.16;
    this.mass = 1.0;
    this.baseRadius = 4.1 + Math.random() * 2.0;

    this.perceptionRadius = 75;
    this.separationRadius = 28;

    this.sensorAngle = 0.45;
    this.sensorDistance = 22;
    this.rotationAngle = 0.35;

    // Rhythm Heaven Spring Physics State
    this.springPhase = 0;
    this.springAmplitude = 0;
    this.springDamping = 0.12;
    this.springSpeed = 0.62;
    this.currentScale = 1.0;
    this.rhythmStretch = 0;
    this.rhythmSquash = 0;
    this.impact = 0;

    this.setupVisuals();
  }

  setupVisuals() {
    const palettes = [
      { primary: '#f5e6ca', outline: '#a64453', name: 'VOICE' },
      { primary: '#c94b59', outline: '#fff0d5', name: 'BASS' },
      { primary: '#e3b84f', outline: '#684052', name: 'SNARE' },
      { primary: '#74aeb0', outline: '#294c5b', name: 'HAT' }
    ];
    this.palette = palettes[this.type % palettes.length];
  }

  applyForce(fx, fy) {
    this.ax += fx / this.mass;
    this.ay += fy / this.mass;
  }

  steerTowards(targetX, targetY, maxSpeed = this.maxSpeed, maxForce = this.maxForce) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return { fx: 0, fy: 0 };
    const desiredX = (dx / dist) * maxSpeed;
    const desiredY = (dy / dist) * maxSpeed;
    let fx = desiredX - this.vx;
    let fy = desiredY - this.vy;
    const forceMag = Math.hypot(fx, fy);
    if (forceMag > maxForce) {
      fx = (fx / forceMag) * maxForce;
      fy = (fy / forceMag) * maxForce;
    }
    return { fx, fy };
  }

  separate(neighbors, customRadius = this.separationRadius) {
    let steerX = 0, steerY = 0, count = 0;
    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < customRadius) {
        steerX += dx / (d * d);
        steerY += dy / (d * d);
        count++;
      }
    }
    if (count > 0) {
      steerX /= count; steerY /= count;
      const mag = Math.hypot(steerX, steerY);
      if (mag > 0) {
        steerX = (steerX / mag) * this.maxSpeed - this.vx;
        steerY = (steerY / mag) * this.maxSpeed - this.vy;
        const fMag = Math.hypot(steerX, steerY);
        if (fMag > this.maxForce * 1.5) {
          steerX = (steerX / fMag) * (this.maxForce * 1.5);
          steerY = (steerY / fMag) * (this.maxForce * 1.5);
        }
      }
    }
    return { fx: steerX, fy: steerY };
  }

  align(neighbors, customRadius = this.perceptionRadius) {
    let sumVx = 0, sumVy = 0, count = 0;
    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this) continue;
      const d = Math.hypot(this.x - other.x, this.y - other.y);
      if (d > 0 && d < customRadius) {
        sumVx += other.vx; sumVy += other.vy; count++;
      }
    }
    if (count > 0) {
      sumVx /= count; sumVy /= count;
      const mag = Math.hypot(sumVx, sumVy);
      if (mag > 0) {
        const desiredX = (sumVx / mag) * this.maxSpeed;
        const desiredY = (sumVy / mag) * this.maxSpeed;
        let fx = desiredX - this.vx, fy = desiredY - this.vy;
        const fMag = Math.hypot(fx, fy);
        if (fMag > this.maxForce) {
          fx = (fx / fMag) * this.maxForce;
          fy = (fy / fMag) * this.maxForce;
        }
        return { fx, fy };
      }
    }
    return { fx: 0, fy: 0 };
  }

  cohere(neighbors, customRadius = this.perceptionRadius) {
    let sumX = 0, sumY = 0, count = 0;
    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this) continue;
      const d = Math.hypot(this.x - other.x, this.y - other.y);
      if (d > 0 && d < customRadius) {
        sumX += other.x; sumY += other.y; count++;
      }
    }
    if (count > 0) return this.steerTowards(sumX / count, sumY / count);
    return { fx: 0, fy: 0 };
  }

  followFlow(flowField) {
    const angle = flowField.getAngleAt(this.x, this.y);
    const desiredX = Math.cos(angle) * this.maxSpeed;
    const desiredY = Math.sin(angle) * this.maxSpeed;
    let fx = desiredX - this.vx, fy = desiredY - this.vy;
    const fMag = Math.hypot(fx, fy);
    if (fMag > this.maxForce) {
      fx = (fx / fMag) * this.maxForce;
      fy = (fy / fMag) * this.maxForce;
    }
    return { fx, fy };
  }

  physarumSense(trailData, width, height, weight = 1, fieldWidth = width, fieldHeight = height) {
    if (!trailData) return;
    const currentHeading = Math.atan2(this.vy, this.vx);
    const sensorDist = this.sensorDistance;
    const sAngle = this.sensorAngle;
    const lx = Math.round(this.x + Math.cos(currentHeading - sAngle) * sensorDist);
    const ly = Math.round(this.y + Math.sin(currentHeading - sAngle) * sensorDist);
    const leftVal = this.sampleTrail(trailData, lx, ly, width, height, fieldWidth, fieldHeight);
    const cx = Math.round(this.x + Math.cos(currentHeading) * sensorDist);
    const cy = Math.round(this.y + Math.sin(currentHeading) * sensorDist);
    const centerVal = this.sampleTrail(trailData, cx, cy, width, height, fieldWidth, fieldHeight);
    const rx = Math.round(this.x + Math.cos(currentHeading + sAngle) * sensorDist);
    const ry = Math.round(this.y + Math.sin(currentHeading + sAngle) * sensorDist);
    const rightVal = this.sampleTrail(trailData, rx, ry, width, height, fieldWidth, fieldHeight);
    let turn = 0;
    if (centerVal > leftVal && centerVal > rightVal) turn = 0;
    else if (centerVal < leftVal && centerVal < rightVal) turn = (Math.random() < 0.5 ? -1 : 1) * this.rotationAngle;
    else if (leftVal > rightVal) turn = -this.rotationAngle;
    else if (rightVal > leftVal) turn = this.rotationAngle;
    if (turn !== 0) {
      const newHeading = currentHeading + turn * Math.max(0, Math.min(1.5, weight));
      const speed = Math.hypot(this.vx, this.vy);
      this.vx = Math.cos(newHeading) * speed;
      this.vy = Math.sin(newHeading) * speed;
    }
  }

  sampleTrail(trailData, px, py, width, height, fieldWidth = width, fieldHeight = height) {
    const screenX = (px % width + width) % width;
    const screenY = (py % height + height) % height;
    const x = Math.min(fieldWidth - 1, Math.floor(screenX * fieldWidth / width));
    const y = Math.min(fieldHeight - 1, Math.floor(screenY * fieldHeight / height));
    const index = (y * fieldWidth + x) * 4;
    return trailData[index] + trailData[index + 1] + trailData[index + 2];
  }

  // Trigger Rhythm Heaven Bounce
  triggerBeatStep(intensity = 1.0) {
    this.springPhase = 0;
    this.springAmplitude = Math.min(0.9, 0.28 + intensity * 0.46);
    this.impact = Math.max(this.impact, Math.min(1, intensity));
  }

  update(width, height, delta = 1.0) {
    this.vx += this.ax * delta;
    this.vy += this.ay * delta;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    this.x += this.vx * delta;
    this.y += this.vy * delta;

    this.ax = 0;
    this.ay = 0;

    if (this.x < 0) this.x += width;
    if (this.x >= width) this.x -= width;
    if (this.y < 0) this.y += height;
    if (this.y >= height) this.y -= height;

    // Short, stable spring: impact squash first, then a visible forward stretch.
    if (this.springAmplitude > 0.01) {
      this.springPhase += delta * this.springSpeed;
      const envelope = Math.exp(-0.42 * this.springPhase);
      const wave = Math.sin(this.springPhase);
      this.currentScale = 1 + wave * this.springAmplitude * envelope * 0.16;
      this.rhythmStretch = Math.max(0, wave) * this.springAmplitude * envelope * 0.42;
      this.rhythmSquash = Math.max(0, -wave) * this.springAmplitude * envelope * 0.24;
      if (this.springPhase > 10) {
        this.springAmplitude = 0;
        this.currentScale = 1.0;
      }
    } else {
      this.currentScale = 1.0;
      this.rhythmStretch = 0;
      this.rhythmSquash = 0;
    }
    this.impact *= Math.exp(-0.28 * delta);
  }

  draw(ctx) {
    const heading = Math.atan2(this.vy, this.vx);
    const speed = Math.hypot(this.vx, this.vy);
    
    // x points into the direction of travel after rotation: longer when moving,
    // wider on impact, so the symbols read as bouncing rather than trembling.
    const travelStretch = Math.min(speed / this.maxSpeed, 1.0) * 0.11;
    const impactSquash = this.impact * 0.16;
    const scaleX = 1 + travelStretch + this.rhythmStretch - impactSquash - this.rhythmSquash * .18;
    const scaleY = 1 - travelStretch * .35 - this.rhythmStretch * .52 + impactSquash + this.rhythmSquash;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(heading + Math.sin(this.id * 12.9898) * .1); // Slightly misregistered paper poses.
    ctx.scale(this.currentScale * scaleX, this.currentScale * scaleY);

    const s = this.baseRadius * 1.48;
    const typeMod = this.type % 4;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = this.palette.primary;
    ctx.beginPath();

    if (typeMod === 0) {
      // Voice: a hand-cut petal with a folded-paper vein.
      ctx.moveTo(-s, s * .04);
      ctx.quadraticCurveTo(-s * .88, -s * .72, -s * .12, -s * .63);
      ctx.quadraticCurveTo(s * .84, -s * .8, s * 1.05, -s * .12);
      ctx.quadraticCurveTo(s * .72, s * .46, -s * .08, s * .56);
      ctx.quadraticCurveTo(-s * .67, s * .52, -s, s * .04);
    } else if (typeMod === 1) {
      // Bass: short torn ribbon; the bent edge nods with the flock's heading.
      ctx.moveTo(-s * 1.18, -s * .26);
      ctx.quadraticCurveTo(-s * .35, -s * .56, s * .12, -s * .28);
      ctx.quadraticCurveTo(s * .65, s * .02, s * 1.08, -s * .2);
      ctx.lineTo(s * .98, s * .25);
      ctx.quadraticCurveTo(s * .36, s * .56, -s * .12, s * .27);
      ctx.quadraticCurveTo(-s * .67, 0, -s * 1.18, s * .25);
    } else if (typeMod === 2) {
      // Snare: uneven punched scrap, deliberately off-centre rather than a star.
      ctx.moveTo(-s * .76, -s * .3);
      ctx.lineTo(-s * .22, -s * .54);
      ctx.lineTo(s * .1, -s * .92);
      ctx.lineTo(s * .42, -s * .35);
      ctx.lineTo(s * .91, -s * .1);
      ctx.lineTo(s * .48, s * .21);
      ctx.lineTo(s * .63, s * .74);
      ctx.lineTo(s * .04, s * .51);
      ctx.lineTo(-s * .49, s * .69);
      ctx.lineTo(-s * .34, s * .19);
      ctx.lineTo(-s * .9, s * .02);
    } else {
      // Hi-hat: two thin scraps that flutter past one another.
      ctx.moveTo(-s * 1.08, -s * .22);
      ctx.quadraticCurveTo(-s * .12, -s * .47, s * .8, -s * .16);
      ctx.lineTo(s * .93, s * .04);
      ctx.quadraticCurveTo(-s * .09, -s * .05, -s * 1.08, s * .13);
    }
    ctx.closePath();
    // Double keyline keeps the tiny paper silhouettes readable over both
    // tartan checks and colored photo cut-outs: warm paper outside, ink inside.
    ctx.strokeStyle = 'rgba(255, 248, 231, .98)';
    ctx.lineWidth = Math.max(2.8, s * .42); ctx.stroke();
    ctx.fill();
    ctx.strokeStyle = this.palette.outline;
    ctx.lineWidth = Math.max(1.25, s * .18); ctx.stroke();

    // One offset ink seam reads as a real cutout detail at close range.
    ctx.globalAlpha = .34; ctx.strokeStyle = this.palette.outline;
    ctx.lineWidth = Math.max(.7, s * .085); ctx.beginPath();
    if (typeMod === 0) { ctx.moveTo(-s * .48, s * .02); ctx.quadraticCurveTo(0, -s * .03, s * .56, -s * .2); }
    else if (typeMod === 1) { ctx.moveTo(-s * .62, s * .02); ctx.quadraticCurveTo(0, -s * .1, s * .58, s * .03); }
    else if (typeMod === 2) { ctx.moveTo(-s * .21, -s * .08); ctx.lineTo(s * .14, s * .04); }
    else { ctx.moveTo(-s * .34, s * .35); ctx.lineTo(s * .55, s * .14); }
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}

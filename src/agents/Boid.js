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
    this.baseRadius = 4.2 + Math.random() * 2.1;

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
      { primary: '#fff0c2', outline: '#d84455', name: 'VOICE' },
      { primary: '#d9364e', outline: '#fff0c2', name: 'BASS' },
      { primary: '#ffd260', outline: '#8d3151', name: 'SNARE' },
      { primary: '#62c7cf', outline: '#26314f', name: 'HAT' }
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

  physarumSense(trailData, width, height, weight = 1) {
    if (!trailData) return;
    const currentHeading = Math.atan2(this.vy, this.vx);
    const sensorDist = this.sensorDistance;
    const sAngle = this.sensorAngle;
    const lx = Math.round(this.x + Math.cos(currentHeading - sAngle) * sensorDist);
    const ly = Math.round(this.y + Math.sin(currentHeading - sAngle) * sensorDist);
    const leftVal = this.sampleTrail(trailData, lx, ly, width, height);
    const cx = Math.round(this.x + Math.cos(currentHeading) * sensorDist);
    const cy = Math.round(this.y + Math.sin(currentHeading) * sensorDist);
    const centerVal = this.sampleTrail(trailData, cx, cy, width, height);
    const rx = Math.round(this.x + Math.cos(currentHeading + sAngle) * sensorDist);
    const ry = Math.round(this.y + Math.sin(currentHeading + sAngle) * sensorDist);
    const rightVal = this.sampleTrail(trailData, rx, ry, width, height);
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

  sampleTrail(trailData, px, py, width, height) {
    const x = (px % width + width) % width;
    const y = (py % height + height) % height;
    const index = (y * width + x) * 4;
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
    ctx.rotate(heading); // Rotate based on heading
    ctx.scale(this.currentScale * scaleX, this.currentScale * scaleY);

    ctx.shadowBlur = 3;
    ctx.shadowColor = this.palette.primary;

    const s = this.baseRadius * 1.72;

    // Helper for specular highlight
    const drawHighlight = (hx, hy) => {
      ctx.beginPath();
      ctx.fillStyle = '#FFFFFF';
      ctx.arc(hx, hy, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
    };

    const typeMod = this.type % 4;
    
    if (typeMod === 0) {
      // Vocal: soft petal/voice mark.
      ctx.fillStyle = this.palette.primary;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.08, s * 0.68, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = this.palette.outline; ctx.lineWidth = Math.max(1, s * 0.14); ctx.stroke();
      ctx.fillStyle = '#fff9e9'; ctx.beginPath(); ctx.ellipse(s * 0.22, -s * 0.05, s * 0.3, s * 0.15, -0.2, 0, Math.PI * 2); ctx.fill();

    } else if (typeMod === 1) {
      // Bass: deep double pulse diamond.
      ctx.fillStyle = this.palette.primary;
      if (this.palette.outline) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = this.palette.outline;
      }
      ctx.beginPath(); ctx.moveTo(0, -s * 1.1); ctx.lineTo(s * 0.86, 0); ctx.lineTo(0, s * 1.1); ctx.lineTo(-s * 0.86, 0); ctx.closePath();
      ctx.fill();
      ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2); ctx.stroke();

    } else if (typeMod === 2) {
      // Snare: crisp cut-paper burst.
      ctx.fillStyle = this.palette.primary;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? s * 0.48 : s * 1.18; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = this.palette.outline; ctx.lineWidth = Math.max(1, s * 0.12); ctx.stroke();
      ctx.fillStyle = '#fff9e9'; ctx.beginPath();
      ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
      ctx.fill();

    } else if (typeMod === 3) {
      // Hi-hat: bright double glint.
      ctx.fillStyle = this.palette.primary;
      ctx.beginPath();
      ctx.moveTo(-s * 1.3, 0); ctx.lineTo(0, -s * 0.25); ctx.lineTo(s * 1.3, 0); ctx.lineTo(0, s * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = this.palette.outline; ctx.lineWidth = Math.max(1, s * 0.13); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.58, -s * 0.62); ctx.lineTo(0, 0); ctx.lineTo(s * 0.58, s * 0.62); ctx.stroke();
    }

    ctx.restore();
  }
}

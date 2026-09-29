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
    this.baseRadius = 3.5 + Math.random() * 2.0;

    this.perceptionRadius = 75;
    this.separationRadius = 28;

    this.sensorAngle = 0.45;
    this.sensorDistance = 22;
    this.rotationAngle = 0.35;

    // Rhythm Heaven Spring Physics State
    this.springPhase = 0;
    this.springAmplitude = 0;
    this.springDamping = 0.12;
    this.springSpeed = 0.4;
    this.currentScale = 1.0;

    this.setupVisuals();
  }

  setupVisuals() {
    const palettes = [
      { primary: '#D4A853', outline: null, name: 'STAR' },       // Type 0
      { primary: '#CC0033', outline: '#D4A853', name: 'HEART' }, // Type 1
      { primary: '#CC0033', outline: null, name: 'CHERRY' },     // Type 2
      { primary: '#D4A853', outline: null, name: 'CROWN' },      // Type 3
      { primary: '#FF1493', outline: null, name: 'SPARKLE' },    // Type 4
      { primary: '#2255AA', outline: null, name: 'DIAMOND' }     // Type 5
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

  physarumSense(trailData, width, height) {
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
      const newHeading = currentHeading + turn;
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
    this.springAmplitude = intensity * 1.2; 
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

    // Rhythm Heaven Spring Physics Scale
    if (this.springAmplitude > 0.01) {
      this.springPhase += delta * this.springSpeed;
      // Spring formula: 1 + amp * sin(phase) * exp(-damping * phase)
      this.currentScale = 1.0 + this.springAmplitude * Math.sin(this.springPhase) * Math.exp(-this.springDamping * this.springPhase);
      
      // Gradually reduce amplitude when phase is large enough to save computation
      if (this.springPhase > 20) {
        this.springAmplitude = 0;
        this.currentScale = 1.0;
      }
    } else {
      this.currentScale = 1.0;
    }
  }

  draw(ctx) {
    const heading = Math.atan2(this.vy, this.vx);
    const speed = Math.hypot(this.vx, this.vy);
    
    // Squash and stretch: squash in direction of movement (wider perpendicular)
    const stretch = Math.min(speed / this.maxSpeed, 1.0) * 0.2; 
    const scaleX = 1.0 - stretch; // Squashed along movement
    const scaleY = 1.0 + stretch; // Stretched perpendicular

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(heading); // Rotate based on heading
    ctx.scale(this.currentScale * scaleX, this.currentScale * scaleY);

    ctx.shadowBlur = 8;
    ctx.shadowColor = this.palette.primary;

    const s = this.baseRadius * 1.5;

    // Helper for specular highlight
    const drawHighlight = (hx, hy) => {
      ctx.beginPath();
      ctx.fillStyle = '#FFFFFF';
      ctx.arc(hx, hy, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
    };

    const typeMod = this.type % 6;
    
    if (typeMod === 0) {
      // STAR
      ctx.fillStyle = this.palette.primary;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const radius = s * 1.4;
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      drawHighlight(s * 0.3, -s * 0.3);

    } else if (typeMod === 1) {
      // HEART
      ctx.fillStyle = this.palette.primary;
      if (this.palette.outline) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = this.palette.outline;
      }
      ctx.beginPath();
      ctx.moveTo(0, s * 0.4);
      ctx.bezierCurveTo(s * 1.5, -s * 0.8, s * 0.8, -s * 1.5, 0, -s * 0.5);
      ctx.bezierCurveTo(-s * 0.8, -s * 1.5, -s * 1.5, -s * 0.8, 0, s * 0.4);
      ctx.fill();
      if (this.palette.outline) ctx.stroke();
      drawHighlight(-s * 0.4, -s * 0.6);

    } else if (typeMod === 2) {
      // CHERRY
      ctx.fillStyle = '#2E8B57'; // Green stem
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.5);
      ctx.quadraticCurveTo(s * 0.5, -s * 0.5, s * 0.6, s * 0.2);
      ctx.moveTo(0, -s * 1.5);
      ctx.quadraticCurveTo(-s * 0.5, -s * 0.5, -s * 0.6, s * 0.2);
      ctx.stroke();

      ctx.fillStyle = this.palette.primary;
      ctx.beginPath();
      ctx.arc(s * 0.6, s * 0.2, s * 0.6, 0, Math.PI * 2);
      ctx.fill();
      drawHighlight(s * 0.4, s * 0.0);

      ctx.beginPath();
      ctx.arc(-s * 0.6, s * 0.2, s * 0.6, 0, Math.PI * 2);
      ctx.fill();
      drawHighlight(-s * 0.8, s * 0.0);

    } else if (typeMod === 3) {
      // CROWN
      ctx.fillStyle = this.palette.primary;
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.8);
      ctx.lineTo(s, s * 0.8);
      ctx.lineTo(s * 1.2, -s * 0.8);
      ctx.lineTo(s * 0.5, 0);
      ctx.lineTo(0, -s * 1.2);
      ctx.lineTo(-s * 0.5, 0);
      ctx.lineTo(-s * 1.2, -s * 0.8);
      ctx.closePath();
      ctx.fill();
      drawHighlight(0, 0);

    } else if (typeMod === 4) {
      // SPARKLE
      ctx.fillStyle = this.palette.primary;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.8);
      ctx.quadraticCurveTo(0, 0, s * 1.8, 0);
      ctx.quadraticCurveTo(0, 0, 0, s * 1.8);
      ctx.quadraticCurveTo(0, 0, -s * 1.8, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s * 1.8);
      ctx.fill();
      drawHighlight(0, 0);

    } else if (typeMod === 5) {
      // DIAMOND
      ctx.fillStyle = this.palette.primary;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.2);
      ctx.lineTo(s, 0);
      ctx.lineTo(0, s * 1.2);
      ctx.lineTo(-s, 0);
      ctx.closePath();
      ctx.fill();
      
      // Facet highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.2);
      ctx.lineTo(s * 0.5, -s * 0.6);
      ctx.lineTo(0, 0);
      ctx.lineTo(-s * 0.5, -s * 0.6);
      ctx.closePath();
      ctx.fill();

      drawHighlight(0, -s * 0.4);
    }

    ctx.restore();
  }
}

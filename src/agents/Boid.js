// Autonomous Agent (Boid) with Reynolds Steering, Flocking, Flow Field & Physarum Chemotaxis
// Tailored for the Y2K Aesthetic of PinkPantheress "Girl Like Me"

export class Boid {
  constructor(x, y, id, type = 0) {
    this.id = id;
    this.type = type; // 0: Vocal / Pink, 1: Bass / Magenta, 2: Snare / Cyber Lilac, 3: Hat / Pearl Sparkle
    this.x = x;
    this.y = y;
    
    // Initial random velocity
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.0;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.ax = 0;
    this.ay = 0;

    // Physical limits (The Nature of Code Ch. 5)
    this.maxSpeed = 3.6 + Math.random() * 1.2;
    this.maxForce = 0.16;
    this.mass = 1.0;
    this.baseRadius = 3.5 + Math.random() * 2.0;

    // Perceptual limits
    this.perceptionRadius = 75;
    this.separationRadius = 28;

    // Physarum parameters (Slime Mold algorithm)
    this.sensorAngle = 0.45; // ~26 degrees
    this.sensorDistance = 22; // Lookahead distance
    this.rotationAngle = 0.35; // Turn speed upon chemical trail detection

    // Rhythmic Stepped Scaling (PinkPantheress video edit effect)
    this.scalePulse = 0; // Quantized pulse [0..1]
    this.currentScale = 1.0;
    this.trailIntensity = 1.0;

    // Visual attributes
    this.setupVisuals();
  }

  setupVisuals() {
    // PinkPantheress Y2K color palette
    const palettes = [
      { primary: '#FF70A6', glow: 'rgba(255, 112, 166, 0.85)', name: 'VOCAL' },      // Baby Pink
      { primary: '#FF007F', glow: 'rgba(255, 0, 127, 0.9)', name: 'BASS_2STEP' },     // Neon Magenta
      { primary: '#D8B4FE', glow: 'rgba(216, 180, 254, 0.85)', name: 'SNARE_CLAP' },  // Cyber Lilac
      { primary: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.95)', name: 'SPARKLE_HAT' }  // Pearl White
    ];
    this.palette = palettes[this.type % palettes.length];
  }

  // Apply steering force: F = ma
  applyForce(fx, fy) {
    this.ax += fx / this.mass;
    this.ay += fy / this.mass;
  }

  // Reynolds Steering: Steer = Desired - Velocity
  steerTowards(targetX, targetY, maxSpeed = this.maxSpeed, maxForce = this.maxForce) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) return { fx: 0, fy: 0 };

    // Desired velocity vector pointing directly to target
    const desiredX = (dx / dist) * maxSpeed;
    const desiredY = (dy / dist) * maxSpeed;

    // Steering force
    let fx = desiredX - this.vx;
    let fy = desiredY - this.vy;

    // Clamp to maxForce
    const forceMag = Math.hypot(fx, fy);
    if (forceMag > maxForce) {
      fx = (fx / forceMag) * maxForce;
      fy = (fy / forceMag) * maxForce;
    }
    return { fx, fy };
  }

  // 1. Separation: Avoid crowding local flockmates
  separate(neighbors, customRadius = this.separationRadius) {
    let steerX = 0;
    let steerY = 0;
    let count = 0;

    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this) continue;

      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const d = Math.hypot(dx, dy);

      if (d > 0 && d < customRadius) {
        // Inverse distance weighting: closer agents push harder
        const nx = dx / (d * d);
        const ny = dy / (d * d);
        steerX += nx;
        steerY += ny;
        count++;
      }
    }

    if (count > 0) {
      steerX /= count;
      steerY /= count;

      const mag = Math.hypot(steerX, steerY);
      if (mag > 0) {
        steerX = (steerX / mag) * this.maxSpeed;
        steerY = (steerY / mag) * this.maxSpeed;

        steerX -= this.vx;
        steerY -= this.vy;

        const fMag = Math.hypot(steerX, steerY);
        if (fMag > this.maxForce * 1.5) {
          steerX = (steerX / fMag) * (this.maxForce * 1.5);
          steerY = (steerY / fMag) * (this.maxForce * 1.5);
        }
      }
    }
    return { fx: steerX, fy: steerY };
  }

  // 2. Alignment: Steer towards the average heading of local flockmates
  align(neighbors, customRadius = this.perceptionRadius) {
    let sumVx = 0;
    let sumVy = 0;
    let count = 0;

    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this) continue;

      const d = Math.hypot(this.x - other.x, this.y - other.y);
      if (d > 0 && d < customRadius) {
        sumVx += other.vx;
        sumVy += other.vy;
        count++;
      }
    }

    if (count > 0) {
      sumVx /= count;
      sumVy /= count;

      const mag = Math.hypot(sumVx, sumVy);
      if (mag > 0) {
        const desiredX = (sumVx / mag) * this.maxSpeed;
        const desiredY = (sumVy / mag) * this.maxSpeed;

        let fx = desiredX - this.vx;
        let fy = desiredY - this.vy;

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

  // 3. Cohesion: Steer towards center of mass of local flockmates
  cohere(neighbors, customRadius = this.perceptionRadius) {
    let sumX = 0;
    let sumY = 0;
    let count = 0;

    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this) continue;

      const d = Math.hypot(this.x - other.x, this.y - other.y);
      if (d > 0 && d < customRadius) {
        sumX += other.x;
        sumY += other.y;
        count++;
      }
    }

    if (count > 0) {
      return this.steerTowards(sumX / count, sumY / count);
    }
    return { fx: 0, fy: 0 };
  }

  // 4. Flow Field Following: Sample the vector direction of the field
  followFlow(flowField) {
    const angle = flowField.getAngleAt(this.x, this.y);
    const desiredX = Math.cos(angle) * this.maxSpeed;
    const desiredY = Math.sin(angle) * this.maxSpeed;

    let fx = desiredX - this.vx;
    let fy = desiredY - this.vy;

    const fMag = Math.hypot(fx, fy);
    if (fMag > this.maxForce) {
      fx = (fx / fMag) * this.maxForce;
      fy = (fy / fMag) * this.maxForce;
    }
    return { fx, fy };
  }

  // 5. Physarum Slime Mold Chemotaxis:
  // 3 forward sensors sample chemical trail density and rotate heading
  physarumSense(trailData, width, height) {
    if (!trailData) return;

    const currentHeading = Math.atan2(this.vy, this.vx);
    const sensorDist = this.sensorDistance;
    const sAngle = this.sensorAngle;

    // Sample Left Sensor
    const lx = Math.round(this.x + Math.cos(currentHeading - sAngle) * sensorDist);
    const ly = Math.round(this.y + Math.sin(currentHeading - sAngle) * sensorDist);
    const leftVal = this.sampleTrail(trailData, lx, ly, width, height);

    // Sample Center Sensor
    const cx = Math.round(this.x + Math.cos(currentHeading) * sensorDist);
    const cy = Math.round(this.y + Math.sin(currentHeading) * sensorDist);
    const centerVal = this.sampleTrail(trailData, cx, cy, width, height);

    // Sample Right Sensor
    const rx = Math.round(this.x + Math.cos(currentHeading + sAngle) * sensorDist);
    const ry = Math.round(this.y + Math.sin(currentHeading + sAngle) * sensorDist);
    const rightVal = this.sampleTrail(trailData, rx, ry, width, height);

    let turn = 0;
    if (centerVal > leftVal && centerVal > rightVal) {
      // Keep straight ahead
      turn = 0;
    } else if (centerVal < leftVal && centerVal < rightVal) {
      // Random turn
      turn = (Math.random() < 0.5 ? -1 : 1) * this.rotationAngle;
    } else if (leftVal > rightVal) {
      // Turn left towards higher concentration
      turn = -this.rotationAngle;
    } else if (rightVal > leftVal) {
      // Turn right towards higher concentration
      turn = this.rotationAngle;
    }

    if (turn !== 0) {
      const newHeading = currentHeading + turn;
      const speed = Math.hypot(this.vx, this.vy);
      this.vx = Math.cos(newHeading) * speed;
      this.vy = Math.sin(newHeading) * speed;
    }
  }

  sampleTrail(trailData, px, py, width, height) {
    // Toroidal wrapping for sensor coords
    const x = (px % width + width) % width;
    const y = (py % height + height) % height;
    const index = (y * width + x) * 4;
    // Return luminescence/trail density (R + G + B)
    return trailData[index] + trailData[index + 1] + trailData[index + 2];
  }

  // Trigger Rhythmic Stepped Scale (Quantized beat jump)
  triggerBeatStep(intensity = 1.0) {
    this.scalePulse = Math.max(this.scalePulse, intensity);
  }

  // Update position, velocity, and quantized scale
  update(width, height, delta = 1.0) {
    // Update velocity
    this.vx += this.ax * delta;
    this.vy += this.ay * delta;

    // Limit speed
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    // Move
    this.x += this.vx * delta;
    this.y += this.vy * delta;

    // Reset acceleration for next frame
    this.ax = 0;
    this.ay = 0;

    // Toroidal boundary wrapping (smooth wrap around canvas)
    if (this.x < 0) this.x += width;
    if (this.x >= width) this.x -= width;
    if (this.y < 0) this.y += height;
    if (this.y >= height) this.y -= height;

    // QUANTIZED STEPPED SCALE (The PinkPantheress Video Edit Aesthetic)
    // Decays in 4 discrete steps (stutter) rather than a smooth fade
    if (this.scalePulse > 0.01) {
      this.scalePulse = Math.max(0, this.scalePulse - 0.028 * delta);
      // Discrete quantization in 4 steps: [0.25, 0.5, 0.75, 1.0]
      const steps = 4;
      const quantized = Math.ceil(this.scalePulse * steps) / steps;
      this.currentScale = 1.0 + quantized * 1.8;
      this.trailIntensity = 1.0 + quantized * 1.5;
    } else {
      this.scalePulse = 0;
      this.currentScale = 1.0;
      this.trailIntensity = 1.0;
    }
  }

  // Draw agent as a glowing Y2K 4-pointed sparkle star / cross
  draw(ctx) {
    const heading = Math.atan2(this.vy, this.vx);
    const radius = this.baseRadius * this.currentScale;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(heading);

    // Dynamic glow during stepped scale jumps
    if (this.scalePulse > 0.2) {
      ctx.shadowBlur = 14 * this.currentScale;
      ctx.shadowColor = this.palette.primary;
    } else {
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.palette.glow;
    }

    // Y2K 4-Pointed Sparkle Star
    ctx.beginPath();
    ctx.fillStyle = this.palette.primary;

    const rOuter = radius * 1.6;
    const rInner = radius * 0.38;

    // Star geometry
    ctx.moveTo(0, -rOuter);
    ctx.quadraticCurveTo(0, 0, rOuter, 0);
    ctx.quadraticCurveTo(0, 0, 0, rOuter);
    ctx.quadraticCurveTo(0, 0, -rOuter, 0);
    ctx.quadraticCurveTo(0, 0, 0, -rOuter);
    ctx.closePath();
    ctx.fill();

    // Center Core / White pearl highlight
    ctx.beginPath();
    ctx.fillStyle = '#FFFFFF';
    ctx.arc(0, 0, Math.max(1.2, radius * 0.35), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// AgentSystem: Master swarm controller combining Reynolds Steering, Flocking,
// Flow Fields, and Interactive Physarum with PinkPantheress Stepped Scaling

import { Boid } from './Boid.js';
import { FlowField } from './FlowField.js';
import { PhysarumTrailBuffer } from './PhysarumTrailBuffer.js';

export class AgentSystem {
  constructor(width, height, agentCount = 320) {
    this.width = width;
    this.height = height;
    this.agentCount = agentCount;
    this.agents = [];

    // Spatial hash grid for high-performance neighbor lookups (guarantees 60 FPS)
    this.cellSize = 80;
    this.grid = new Map();

    // Flow Field & Physarum Trail systems
    this.flowField = new FlowField(28);
    this.flowField.resize(width, height);
    this.trailBuffer = new PhysarumTrailBuffer(width, height);

    // Expressive Steering Weights (Modulated live by human performer)
    this.params = {
      separationWeight: 1.6,
      alignmentWeight: 1.0,
      cohesionWeight: 1.1,
      flowFieldWeight: 0.9,
      physarumWeight: 0.8,
      perceptionRadius: 75,
      separationRadius: 30,
      maxSpeed: 4.2,
      maxForce: 0.18,
      trailDecay: 0.07,
      showFlowField: false,
      showTrails: true,
      quantizeSteps: 4 // Stepped scaling quantization levels
    };

    // Beat Pulse / Stepped Scale state
    this.globalBeatPulse = 0;
    this.beatCounter = 0;
    this.interactionMode = 'drift';
    this.interactionCenter = { x: width * .5, y: height * .5 };
    this.interactionTime = 0;
    this.interactionStrength = 0;
    this.clickModeIndex = 0;
    this.flowUpdateFrame = 0;

    this.initAgents();
  }

  initAgents() {
    this.agents = [];
    const count = this.agentCount;

    for (let i = 0; i < count; i++) {
      // Distribute in a soft circular cloud around center
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Math.min(this.width, this.height) * 0.35;
      const x = this.width * 0.5 + Math.cos(angle) * radius;
      const y = this.height * 0.5 + Math.sin(angle) * radius;

      // Assign instrument voice type
      const type = i % 4; // 0: Vocal, 1: Bass, 2: Snare, 3: Hat
      const boid = new Boid(x, y, i, type);
      boid.perceptionRadius = this.params.perceptionRadius;
      boid.separationRadius = this.params.separationRadius;
      boid.maxSpeed = this.params.maxSpeed;
      boid.maxForce = this.params.maxForce;

      this.agents.push(boid);
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.flowField.resize(width, height);
    this.trailBuffer.resize(width, height);
  }

  setAgentCount(newCount) {
    this.agentCount = Math.max(50, Math.min(800, newCount));
    this.initAgents();
  }

  // Trigger Rhythmic Stepped Scale (Beat Quantization Jump)
  // Replicates the iconic stepped scaling and cuts in PinkPantheress's video
  triggerBeat(intensity = 1.0, direction = null) {
    this.globalBeatPulse = 1.0;
    this.beatCounter++;

    // Swirl flow field briefly on beat
    this.flowField.triggerSwirl(
      this.width * 0.5,
      this.height * 0.5,
      intensity * 1.2
    );

    // Apply quantized stepped jump to all agents
    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];
      agent.triggerBeatStep(intensity);

      // Micro impulse along current heading or perpendicular
      if (Math.random() < 0.4) {
        const kickAngle = Math.atan2(agent.vy, agent.vx) + (Math.random() - 0.5) * 0.8;
        agent.applyForce(Math.cos(kickAngle) * 0.8 * intensity, Math.sin(kickAngle) * 0.8 * intensity);
      }
    }
  }

  setInteractionMode(mode, x = this.width * .5, y = this.height * .5, duration = 2.8) {
    this.interactionMode = mode;
    this.interactionCenter = { x, y };
    this.interactionTime = duration;
    this.interactionStrength = 1;
    if (mode === 'orbit') this.flowField.triggerSwirl(x, y, 2.2);
    if (mode === 'gather') this.flowField.triggerSwirl(x, y, 1.1);
  }

  interactAt(x, y) {
    const modes = ['scatter', 'gather', 'orbit', 'drift'];
    const mode = modes[this.clickModeIndex++ % modes.length];
    this.setInteractionMode(mode, x, y, mode === 'drift' ? 1.1 : 3.2);
    const radius = Math.min(this.width, this.height) * .38;
    for (const agent of this.agents) {
      const dx = agent.x - x, dy = agent.y - y;
      const distance = Math.hypot(dx, dy);
      if (distance < radius && distance > 0.01) {
        const direction = mode === 'gather' ? -1 : 1;
        const impulse = (1 - distance / radius) * (mode === 'orbit' ? .95 : .75);
        const angle = mode === 'orbit' ? Math.atan2(dy, dx) + Math.PI * .5 : Math.atan2(dy, dx);
        agent.applyForce(Math.cos(angle) * impulse * direction, Math.sin(angle) * impulse * direction);
        agent.triggerBeatStep(.45 + impulse * .5);
      }
    }
  }

  // Update Spatial Partitioning Grid
  updateGrid() {
    this.grid.clear();
    const invCell = 1 / this.cellSize;

    for (let i = 0; i < this.agents.length; i++) {
      const boid = this.agents[i];
      const cx = Math.floor(boid.x * invCell);
      const cy = Math.floor(boid.y * invCell);
      const key = `${cx},${cy}`;

      let cell = this.grid.get(key);
      if (!cell) {
        cell = [];
        this.grid.set(key, cell);
      }
      cell.push(boid);
    }
  }

  // Query neighbors in adjacent 3x3 cells
  getNeighbors(boid, radius) {
    const invCell = 1 / this.cellSize;
    const cx = Math.floor(boid.x * invCell);
    const cy = Math.floor(boid.y * invCell);
    const cellRange = Math.ceil(radius * invCell);
    const neighbors = [];

    for (let ox = -cellRange; ox <= cellRange; ox++) {
      for (let oy = -cellRange; oy <= cellRange; oy++) {
        const key = `${cx + ox},${cy + oy}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (let j = 0; j < cell.length; j++) {
            neighbors.push(cell[j]);
          }
        }
      }
    }
    return neighbors;
  }

  // Update whole swarm
  update(time, delta = 1.0) {
    // 1. Update Flow Field
    // Flow fields drift slowly; recomputing the full noise grid every other
    // frame is visually indistinguishable and frees time for the flock.
    if ((this.flowUpdateFrame++ & 1) === 0) this.flowField.update(time);
    this.interactionTime = Math.max(0, this.interactionTime - delta / 60);
    this.interactionStrength = Math.min(1, this.interactionTime / .7);

    // 2. Diffuse & Evaporate Physarum chemical trail map
    this.trailBuffer.decayRate = this.params.trailDecay;
    this.trailBuffer.active = this.params.showTrails;
    this.trailBuffer.diffuseAndDecay();
    const trailData = this.trailBuffer.getTrailData();

    // 3. Rebuild spatial grid
    this.updateGrid();

    // 4. Stepped pulse decay for global UI/readout
    if (this.globalBeatPulse > 0.01) {
      this.globalBeatPulse = Math.max(0, this.globalBeatPulse - 0.03 * delta);
    } else {
      this.globalBeatPulse = 0;
    }

    // 5. Update each autonomous agent
    const {
      separationWeight,
      alignmentWeight,
      cohesionWeight,
      flowFieldWeight,
      physarumWeight,
      perceptionRadius,
      separationRadius
    } = this.params;

    for (let i = 0; i < this.agents.length; i++) {
      const boid = this.agents[i];

      // Local neighbors query (Perception limit)
      const neighbors = this.getNeighbors(boid, perceptionRadius);

      // A) Reynolds Flocking forces
      const sep = boid.separate(neighbors, separationRadius);
      const ali = boid.align(neighbors, perceptionRadius);
      const coh = boid.cohere(neighbors, perceptionRadius);

      // B) Flow Field force
      const flow = boid.followFlow(this.flowField);

      // Click/keyboard gesture modes briefly steer the flock as a whole. The
      // falloff leaves the interaction local and lets the autonomous motion return.
      let gestureFx = 0, gestureFy = 0;
      if (this.interactionTime > 0.01 && this.interactionMode !== 'drift') {
        const dx = boid.x - this.interactionCenter.x;
        const dy = boid.y - this.interactionCenter.y;
        const distance = Math.hypot(dx, dy);
        const radius = Math.min(this.width, this.height) * .46;
        if (distance > 1 && distance < radius) {
          const falloff = (1 - distance / radius) * this.interactionStrength;
          let angle = Math.atan2(dy, dx);
          if (this.interactionMode === 'gather') angle += Math.PI;
          if (this.interactionMode === 'orbit') angle += Math.PI * .5;
          gestureFx = Math.cos(angle) * falloff * .42;
          gestureFy = Math.sin(angle) * falloff * .42;
        }
      }

      // C) Physarum chemotaxis sensing (steers heading towards trail concentrations)
      if (this.params.showTrails && physarumWeight > 0.05 && trailData) {
        boid.physarumSense(trailData, this.width, this.height, physarumWeight,
          this.trailBuffer.width, this.trailBuffer.height);
      }

      // Apply combined forces: F_total = sum(w_i * F_i)
      const totalFx =
        sep.fx * separationWeight +
        ali.fx * alignmentWeight +
        coh.fx * cohesionWeight +
        flow.fx * flowFieldWeight;

      const totalFy =
        sep.fy * separationWeight +
        ali.fy * alignmentWeight +
        coh.fy * cohesionWeight +
        flow.fy * flowFieldWeight;
      boid.applyForce(gestureFx, gestureFy);

      boid.applyForce(totalFx, totalFy);

      // Update position, limits, and stepped scale
      boid.update(this.width, this.height, delta);

      // Deposit bioluminescent chemical trail
      if (this.params.showTrails) {
        this.trailBuffer.deposit(
          boid.x,
          boid.y,
          boid.baseRadius * boid.currentScale * 1.2,
          boid.palette.primary,
          boid.trailIntensity * (physarumWeight + 0.3)
        );
      }
    }
  }

  // Draw full system: trails, flow field debug (if enabled), and agent swarm
  render(ctx) {
    // A) Render Physarum trail buffer
    if (this.params.showTrails) {
      this.trailBuffer.renderTo(ctx, 0.52);
    }

    // B) Optional Flow Field vector overlay
    if (this.params.showFlowField) {
      this.flowField.draw(ctx, 0.22);
    }

    // C) Draw each autonomous agent as glowing Y2K sparkle star
    for (let i = 0; i < this.agents.length; i++) {
      this.agents[i].draw(ctx);
    }

    // Beat feedback is rendered as paper snaps by the background collage;
    // avoid drawing a literal circular shockwave over the composition.
  }
}

// Moving paper-collage London backdrop for the live visual instrument.
export class FancyBackground {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.pulse = 0;
    this.musicClock = null;
    this.bpm = 138;
    this.beatIndex = -1;
    this.barColorIndex = 0;
    this.scrollOffset = 0;
    this.scrollKick = 0;
    this.lastSceneTime = null;
    this.rings = [];
    this.palette = [
      ['#f3d7c4', '#f5b4a4', '#e53c43'],
      ['#f5eee0', '#83cbd0', '#e7344f'],
      ['#f74783', '#421b54', '#ffd946'],
      ['#e8d9c5', '#2c3153', '#e64c40'],
      ['#211631', '#be315c', '#f8ba45'],
      ['#e8d7ce', '#566d91', '#c93345']
    ];
    this.section = 0;
  }

  resize(width, height) { this.width = width; this.height = height; }
  setSection(index) { this.section = index % this.palette.length; }
  triggerBeatRing(x, y, color = '#fff1b8') {
    this.rings.push({ x, y, radius: 12, alpha: 0.8, color });
    this.triggerRhythmShift(1);
  }
  triggerRhythmShift(intensity = 1) {
    this.scrollKick = Math.min(3.1, this.scrollKick + 0.72 * intensity);
    this.pulse = Math.max(this.pulse, Math.min(1, 0.5 + intensity * 0.35));
  }
  update(time, pulse = 0, musicTime = null, bpm = 138) {
    this.musicClock = Number.isFinite(musicTime) ? musicTime : null;
    this.time = this.musicClock ?? time / 1000;
    this.bpm = bpm || 138;
    const sceneDelta = this.lastSceneTime === null ? 1 / 60 : Math.max(0, Math.min(.08, this.time - this.lastSceneTime));
    this.lastSceneTime = this.time;
    this.scrollKick *= Math.exp(-5.2 * sceneDelta);
    this.scrollOffset += (16 + this.scrollKick * 230) * sceneDelta;
    this.pulse = Math.max(this.pulse * Math.exp(-7.8 * sceneDelta), pulse || 0);
    if (this.musicClock !== null) {
      const beat = Math.floor(this.musicClock * this.bpm / 60);
      if (beat !== this.beatIndex && beat >= 0) {
        this.beatIndex = beat;
        this.barColorIndex = Math.floor(beat / 8) % 4;
        this.pulse = Math.max(this.pulse, beat % 4 === 0 ? 0.75 : 0.42);
      }
    }
    for (const ring of this.rings) { ring.radius += 7; ring.alpha *= 0.95; }
    this.rings = this.rings.filter(ring => ring.alpha > 0.04);
  }

  render(ctx) {
    const w = this.width, h = this.height;
    const [baseSky, basePaper, baseAccent] = this.palette[this.section];
    const songTints = ['#e94456', '#52a8bb', '#eab447', '#8c579f'];
    const colorProgress = this.musicClock === null ? 0 : ((this.musicClock * this.bpm / 60) % 8) / 8;
    const easedColorProgress = colorProgress * colorProgress * (3 - 2 * colorProgress);
    const blendHex = (first, second, amount) => {
      const a = first.match(/[\da-f]{2}/gi).map(v => parseInt(v, 16));
      const b = second.match(/[\da-f]{2}/gi).map(v => parseInt(v, 16));
      return `#${a.map((value, i) => Math.round(value * (1 - amount) + b[i] * amount).toString(16).padStart(2, '0')).join('')}`;
    };
    const tint = blendHex(songTints[this.barColorIndex], songTints[(this.barColorIndex + 1) % songTints.length], easedColorProgress);
    const tintMix = this.musicClock === null ? 0 : 0.24 + this.pulse * 0.18;
    const mix = (base, overlay, amount) => {
      const a = base.match(/[\da-f]{2}/gi).map(v => parseInt(v, 16));
      const b = overlay.match(/[\da-f]{2}/gi).map(v => parseInt(v, 16));
      return `rgb(${a.map((v, i) => Math.round(v * (1 - amount) + b[i] * amount)).join(',')})`;
    };
    const sky = mix(baseSky, tint, tintMix), paper = mix(basePaper, tint, tintMix * 0.72);
    const accent = this.musicClock === null ? baseAccent : tint;
    const pulse = Math.min(this.pulse, 1);
    const skyWash = ctx.createLinearGradient(0, 0, 0, h);
    skyWash.addColorStop(0, sky);
    skyWash.addColorStop(0.68, paper);
    skyWash.addColorStop(1, '#f5e9d9');
    ctx.fillStyle = skyWash;
    ctx.fillRect(0, 0, w, h);

    this.drawCollageMarks(ctx, w, h, accent, pulse);
    this.drawConcertAtmosphere(ctx, w, h, accent, pulse);
    this.drawY2KOrbs(ctx, w, h, accent, pulse);

    // Torn-paper clouds and distant rooftops drift slowly across the sky.
    ctx.save();
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 5; i++) {
      const x = ((i * w / 4 + this.time * (8 + i * 2) - this.scrollOffset * .14) % (w + 220)) - 110;
      const y = h * (0.13 + (i % 2) * 0.11) + Math.sin(this.time * 0.35 + i) * 9;
      this.paperCloud(ctx, x, y, 0.7 + (i % 3) * 0.18);
    }
    ctx.restore();

    const farShift = (this.time * 13 + this.scrollOffset * .42) % 240;
    for (let x = -240 - farShift; x < w + 240; x += 240) this.drawTerrace(ctx, x, h * 0.68, 0.72, '#c87570', '#f4d9c9', pulse);
    this.drawClockTower(ctx, w * 0.17 - ((this.time * 5 + this.scrollOffset * .18) % 90), h * 0.67 - pulse * 8, Math.min(w, h) * 0.21);
    this.drawBridge(ctx, w, h, accent, pulse);

    // Foreground houses move faster, giving the street a gentle parallax drift.
    const nearShift = (this.time * 32 + this.scrollOffset) % 330;
    for (let x = -330 - nearShift; x < w + 330; x += 330) {
      this.drawTerrace(ctx, x, h * 0.83, 1.05, accent, '#f5e6d1', pulse);
    }
    this.drawThames(ctx, w, h, accent);
    this.drawTaxi(ctx, w, h, pulse);
    this.drawBusStop(ctx, w, h);
    this.drawLondonBus(ctx, w, h, pulse);
    this.drawTelephoneBox(ctx, w, h, pulse);
    this.drawAudienceSilhouette(ctx, w, h, pulse);
    this.drawPaperGrain(ctx, w, h);
    this.drawProjectionGrade(ctx, w, h, accent);

    for (const ring of this.rings) {
      ctx.save(); ctx.globalAlpha = ring.alpha; ctx.strokeStyle = ring.color;
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    // Collage caption stays legible while the scene shifts through song sections.
    ctx.save();
    ctx.translate(w * 0.055, h * 0.43);
    ctx.rotate(-0.045);
    ctx.fillStyle = '#fff8e9'; ctx.strokeStyle = '#ad494a'; ctx.lineWidth = 2;
    ctx.fillRect(-8, -17, 210, 39); ctx.strokeRect(-8, -17, 210, 39);
    ctx.fillStyle = '#ad494a'; ctx.font = 'bold 14px "Space Mono", monospace';
    ctx.fillText('LONDON / 2-STEP', 3, 8);
    ctx.restore();
  }

  paperCloud(ctx, x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = '#fff5ea';
    ctx.beginPath(); ctx.moveTo(-72, 8); ctx.lineTo(-62, -7); ctx.lineTo(-34, -9); ctx.lineTo(-25, -24); ctx.lineTo(-5, -19); ctx.lineTo(4, -31); ctx.lineTo(24, -17); ctx.lineTo(48, -19); ctx.lineTo(57, -4); ctx.lineTo(74, 0); ctx.lineTo(70, 11); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  drawCollageMarks(ctx, w, h, accent, pulse) {
    ctx.save();
    // Chorus passages borrow the spinning pink print and oversized cutout shapes.
    if (this.section === 2 || this.section === 4) {
      ctx.translate(w * 0.62, h * 0.49);
      ctx.rotate(this.time * (this.section === 2 ? 0.08 : -0.06));
      ctx.globalAlpha = 0.2 + pulse * 0.12;
      ctx.strokeStyle = this.section === 2 ? '#f50067' : '#f7bb52';
      for (let i = 0; i < 5; i++) {
        ctx.lineWidth = 18 - i * 2;
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(w, h) * (0.18 + i * 0.055) + Math.sin(this.time * 2 + i) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // Misregistered paint swatches, like overlapping screen prints.
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = accent;
    const drift = (this.time * 13 + this.scrollOffset * .35) % (w + 180);
    ctx.beginPath(); ctx.moveTo(drift - 180, h * 0.23); ctx.lineTo(drift - 100, h * 0.20); ctx.lineTo(drift + 42, h * 0.44); ctx.lineTo(drift - 12, h * 0.48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#182238'; ctx.globalAlpha = 0.16;
    ctx.beginPath(); ctx.moveTo(w * 0.03, h * 0.60); ctx.lineTo(w * 0.35, h * 0.58); ctx.lineTo(w * 0.42, h * 0.64); ctx.lineTo(w * 0.07, h * 0.66); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Soft light beams and bloom create a projected-stage feel without hiding the city.
  drawConcertAtmosphere(ctx, w, h, accent, pulse) {
    const energy = 0.22 + pulse * 0.62;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = energy * 0.34;
    for (let i = 0; i < 6; i++) {
      const phase = this.time * (0.35 + i * 0.03) + i * 1.72;
      const topX = w * (.08 + i * .17) + Math.sin(phase) * w * .11;
      const beam = ctx.createLinearGradient(topX, 0, topX + Math.sin(phase * 1.7) * 130, h * .83);
      beam.addColorStop(0, `${accent}bb`);
      beam.addColorStop(.48, `${accent}24`);
      beam.addColorStop(1, `${accent}00`);
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(topX - 3, 0); ctx.lineTo(topX + 3, 0);
      ctx.lineTo(topX + Math.sin(phase * 1.7) * 190 + 100, h * .82);
      ctx.lineTo(topX + Math.sin(phase * 1.7) * 190 - 100, h * .82);
      ctx.closePath(); ctx.fill();
    }
    // Two blurred light pools sit behind the swarm like an LED backline.
    ctx.filter = `blur(${18 + pulse * 16}px)`;
    ctx.globalAlpha = .18 + pulse * .23;
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.ellipse(w * .36, h * .56, w * .16, h * .08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w * .68, h * .48, w * .12, h * .06, 0, 0, Math.PI * 2); ctx.fill();
    ctx.filter = 'none';
    ctx.restore();
  }

  drawY2KOrbs(ctx, w, h, accent, pulse) {
    const bubbles = [[.13, .23, 18], [.78, .17, 28], [.89, .42, 13], [.27, .49, 16], [.57, .16, 10]];
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < bubbles.length; i++) {
      const [rx, ry, radius] = bubbles[i];
      const x = w * rx + Math.sin(this.time * (.7 + i * .09) + i) * (10 + pulse * 9);
      const y = h * ry + Math.cos(this.time * (.55 + i * .1) + i) * (7 + pulse * 7);
      const r = radius * (1 + pulse * .16);
      const glow = ctx.createRadialGradient(x - r * .32, y - r * .35, 1, x, y, r * 1.6);
      glow.addColorStop(0, 'rgba(255,255,255,.86)');
      glow.addColorStop(.18, accent);
      glow.addColorStop(.58, 'rgba(255,255,255,.10)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = .32 + pulse * .2;
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .74;
      ctx.fillStyle = 'rgba(255,255,255,.72)';
      ctx.beginPath(); ctx.arc(x - r * .34, y - r * .32, Math.max(2, r * .15), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  drawTerrace(ctx, x, ground, scale, wall, trim, pulse = 0) {
    const bob = -pulse * (8 + (Math.sin(x * 0.04) + 1) * 2);
    ctx.save();
    // Scale around each terrace's centre, so the pulse reads as a soft paper bounce.
    ctx.translate(x + 102 * scale, ground + bob);
    ctx.scale(1 + pulse * .042, 1 - pulse * .045);
    ctx.translate(-102 * scale, 0);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(24, 18, 38, .23)';
    ctx.fillRect(8, -102, 204, 112);
    ctx.fillStyle = '#744957'; ctx.fillRect(0, -108, 204, 108);
    for (let i = 0; i < 3; i++) {
      const bx = i * 68;
      ctx.fillStyle = wall; ctx.fillRect(bx + 4, -108, 62, 108);
      ctx.fillStyle = '#4d3c4b'; ctx.beginPath(); ctx.moveTo(bx, -108); ctx.lineTo(bx + 34, -145); ctx.lineTo(bx + 70, -108); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f8e9c9';
      for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
        const wx = bx + 13 + col * 29, wy = -94 + row * 36;
        ctx.fillRect(wx, wy, 17, 24); ctx.fillStyle = '#526d83'; ctx.fillRect(wx + 3, wy + 3, 11, 16); ctx.fillStyle = '#f8e9c9';
      }
      ctx.fillStyle = trim; ctx.fillRect(bx + 29, -31, 16, 31); ctx.fillRect(bx + 8, -74, 51, 4);
    }
    ctx.restore();
  }

  drawClockTower(ctx, x, base, size) {
    ctx.save(); ctx.translate(x, base); ctx.scale(size / 150, size / 150);
    ctx.fillStyle = '#a78a70'; ctx.fillRect(0, -260, 94, 260);
    ctx.fillStyle = '#765f62'; ctx.beginPath(); ctx.moveTo(-10, -260); ctx.lineTo(47, -330); ctx.lineTo(104, -260); ctx.closePath(); ctx.fill();
    for (let y = -230; y < -65; y += 52) {
      ctx.fillStyle = '#efe1bf'; ctx.fillRect(16, y, 62, 43);
      ctx.fillStyle = '#47617b'; ctx.fillRect(22, y + 6, 50, 31);
      ctx.strokeStyle = '#efe1bf'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(47, y + 6); ctx.lineTo(47, y + 37); ctx.stroke();
    }
    ctx.fillStyle = '#e7c675'; ctx.beginPath(); ctx.arc(47, -245, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#775a49'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(47, -245); ctx.lineTo(47, -259); ctx.moveTo(47, -245); ctx.lineTo(57, -241); ctx.stroke();
    ctx.restore();
  }

  drawBridge(ctx, w, h, accent, pulse) {
    const y = h * 0.76, span = Math.min(w * 0.66, 790), left = (w - span) / 2;
    const bob = Math.sin(this.time * 1.3) * 3 + pulse * 6;
    ctx.save(); ctx.translate(0, bob);
    ctx.fillStyle = '#596d82'; ctx.fillRect(left, y, span, 14);
    ctx.strokeStyle = '#596d82'; ctx.lineWidth = 7; ctx.beginPath();
    ctx.moveTo(left, y + 3); ctx.bezierCurveTo(w * 0.33, y + 66, w * 0.67, y + 66, left + span, y + 3); ctx.stroke();
    for (let i = 0; i <= 16; i++) {
      const px = left + span * i / 16;
      ctx.beginPath(); ctx.moveTo(px, y + 4); ctx.lineTo(px, y + 40 + Math.sin(i / 16 * Math.PI) * 30); ctx.stroke();
    }
    ctx.fillStyle = '#e9d7b2'; ctx.fillRect(left - 8, y - 17, 17, 38); ctx.fillRect(left + span - 8, y - 17, 17, 38);
    ctx.restore();
    ctx.fillStyle = accent; ctx.globalAlpha = 0.34; ctx.fillRect(0, h * 0.88, w, h * 0.12); ctx.globalAlpha = 1;
  }

  drawThames(ctx, w, h, accent) {
    const y = h * 0.88;
    ctx.fillStyle = '#547f9b'; ctx.globalAlpha = 0.78;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y - 4); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.38; ctx.strokeStyle = '#fff0d1'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const x = ((i * w / 8 + this.time * (22 + i) - this.scrollOffset * .55) % (w + 80)) - 40;
      const yy = y + 16 + (i % 4) * 13;
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 36 + i % 5 * 9, yy + Math.sin(this.time + i) * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawTaxi(ctx, w, h, pulse = 0) {
    const scale = Math.max(0.32, Math.min(0.76, h / 1050));
    const x = w - ((this.time * 52 + this.scrollOffset * .92) % (w + 230));
    const y = h * 0.63 + Math.sin(this.time * 1.8) * 5 - pulse * 7;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.035); ctx.scale(scale, scale);
    ctx.fillStyle = '#f7e4c8'; ctx.strokeStyle = '#fff8ea'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-84, -16); ctx.lineTo(-68, -46); ctx.lineTo(-20, -48); ctx.lineTo(2, -24); ctx.lineTo(69, -21); ctx.lineTo(82, -4); ctx.lineTo(78, 14); ctx.lineTo(-82, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#171c2d'; ctx.fillRect(-53, -39, 28, 21); ctx.fillRect(-19, -39, 20, 21);
    ctx.fillStyle = '#e23a45'; ctx.fillRect(-6, -58, 26, 9);
    ctx.fillStyle = '#efb927'; ctx.fillRect(46, -15, 17, 8);
    ctx.fillStyle = '#202333'; ctx.beginPath(); ctx.arc(-49, 16, 14, 0, Math.PI * 2); ctx.arc(49, 16, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5e8ce'; ctx.beginPath(); ctx.arc(-49, 16, 5, 0, Math.PI * 2); ctx.arc(49, 16, 5, 0, Math.PI * 2); ctx.fill();
    // Small checker stripe makes the cab read as a London prop, not a generic particle.
    ctx.fillStyle = '#fff2df'; for (let i = 0; i < 8; i++) if (i % 2 === 0) ctx.fillRect(-19 + i * 9, -4, 9, 6);
    ctx.restore();
  }

  drawBusStop(ctx, w, h) {
    const x = w * 0.91, y = h * 0.68, scale = Math.min(1, h / 760);
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = '#24334a'; ctx.fillRect(-3, -68, 6, 96);
    ctx.fillStyle = '#fff5e4'; ctx.strokeStyle = '#29354a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -72, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#d93a42'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -72, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#24334a'; ctx.fillRect(-18, -76, 36, 8);
    ctx.font = 'bold 6px "Space Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('BUS', 0, -84);
    ctx.restore();
  }

  drawLondonBus(ctx, w, h, pulse = 0) {
    const scale = Math.max(0.3, Math.min(0.58, h / 1200));
    const x = w - ((this.time * 30 + this.scrollOffset * .72) % (w + 200));
    const y = h * 0.88;
    ctx.save(); ctx.translate(x, y - pulse * 6); ctx.rotate(Math.sin(this.time * 5) * pulse * 0.008); ctx.scale(scale * (1 + pulse * 0.018), scale * (1 - pulse * 0.01));
    ctx.fillStyle = '#be2939'; ctx.strokeStyle = '#fff2de'; ctx.lineWidth = 3;
    ctx.fillRect(0, -83, 152, 76); ctx.strokeRect(0, -83, 152, 76);
    ctx.fillRect(8, -124, 127, 40); ctx.strokeRect(8, -124, 127, 40);
    ctx.fillStyle = '#6b9bb2';
    for (let i = 0; i < 4; i++) { ctx.fillRect(14 + i * 30, -116, 22, 27); ctx.fillRect(8 + i * 35, -75, 25, 21); }
    ctx.fillStyle = '#28313b'; ctx.beginPath(); ctx.arc(38, -4, 15, 0, Math.PI * 2); ctx.arc(121, -4, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5d8a0'; ctx.beginPath(); ctx.arc(38, -4, 5, 0, Math.PI * 2); ctx.arc(121, -4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawTelephoneBox(ctx, w, h, pulse = 0) {
    const scale = Math.max(0.34, Math.min(0.62, h / 1100));
    const x = w * 0.11 + Math.sin(this.time * 0.38) * 7 - (this.scrollOffset % 70) * .1;
    const y = h * 0.91;
    ctx.save(); ctx.translate(x, y - pulse * 5); ctx.rotate(Math.sin(this.time * 4) * pulse * 0.012); ctx.scale(scale, scale);
    ctx.fillStyle = '#b52d3b'; ctx.strokeStyle = '#fff3df'; ctx.lineWidth = 4;
    ctx.fillRect(-29, -135, 58, 135); ctx.strokeRect(-29, -135, 58, 135);
    ctx.fillStyle = '#f0daba'; ctx.fillRect(-21, -124, 42, 18);
    ctx.fillStyle = '#5d91a6';
    for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) {
      ctx.fillRect(-21 + col * 23, -99 + row * 23, 18, 18);
    }
    ctx.fillStyle = '#f4dfc0'; ctx.font = 'bold 9px "Space Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText('TELEPHONE', 0, -112);
    ctx.restore();
  }

  drawPaperGrain(ctx, w, h) {
    ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = '#282033';
    for (let i = 0; i < 140; i++) {
      const x = (i * 197.7 + this.time * 2 - this.scrollOffset * .05) % w, y = (i * 113.3) % h;
      ctx.fillRect(x, y, 1 + i % 2, 1 + i % 3);
    }
    ctx.globalAlpha = 0.1; ctx.strokeStyle = '#ec4050'; ctx.lineWidth = 2;
    for (let i = 0; i < 13; i++) {
      const x = (i * 227 + this.time * (8 + i % 4) - this.scrollOffset * .13) % w;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 15 - i % 12, h * (0.28 + i % 5 * 0.13)); ctx.stroke();
    }
    ctx.restore();
  }

  drawAudienceSilhouette(ctx, w, h, pulse) {
    ctx.save();
    ctx.globalAlpha = .34;
    ctx.fillStyle = '#171426';
    const baseY = h * .965;
    for (let i = 0; i < 38; i++) {
      const x = (i / 37) * w + Math.sin(i * 11.7) * 9;
      const lift = Math.max(0, Math.sin(this.time * 2.1 + i * .83)) * (4 + pulse * 10);
      const r = 8 + (i % 4) * 2;
      ctx.beginPath(); ctx.arc(x, baseY - r * 1.4 - lift, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - r * .95, baseY - r - lift, r * 1.9, h - baseY + r * 2);
    }
    ctx.restore();
  }

  drawProjectionGrade(ctx, w, h, accent) {
    ctx.save();
    const vignette = ctx.createRadialGradient(w * .5, h * .48, Math.min(w, h) * .1, w * .5, h * .5, Math.max(w, h) * .72);
    vignette.addColorStop(0, 'rgba(18, 13, 32, 0)');
    vignette.addColorStop(.63, 'rgba(18, 13, 32, .04)');
    vignette.addColorStop(1, 'rgba(12, 9, 25, .36)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = .13;
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

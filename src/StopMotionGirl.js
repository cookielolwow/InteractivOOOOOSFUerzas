// Original paper-cutout dancer, animated in small stop-motion poses on beats.
export class StopMotionGirl {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.frame = 0;
    this.lastBeatTime = 0;
    this.lastTime = 0;
    this.bob = 0;
  }

  resize(width, height) { this.width = width; this.height = height; }

  update(time, pulse) {
    this.lastTime = time;
    this.bob *= 0.82;
    if (pulse > 0.34 && time - this.lastBeatTime > 220) {
      this.frame = (this.frame + 1) % 4;
      this.lastBeatTime = time;
      this.bob = -7;
    }
  }

  drawGirl(ctx, x, y, scale, frame = this.frame) {
    const sway = Math.sin(this.lastTime * 0.004) * 0.045 + (frame % 2 ? -0.025 : 0.02);
    const armLift = frame === 2 ? -15 : frame === 1 ? 7 : 0;
    const skin = '#d78e70', hair = '#88452f', red = '#bd3644', violet = '#56459b';
    ctx.save(); ctx.translate(x, y + this.bob); ctx.rotate(sway); ctx.scale(scale, scale);
    // Offset paper layers make the character read like a photographed collage.
    ctx.fillStyle = 'rgba(47,35,48,.28)';
    ctx.beginPath(); ctx.ellipse(0, -5, 63, 111, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff7e8'; ctx.lineWidth = 8; ctx.lineJoin = 'round';
    // Legs and red tights
    ctx.fillStyle = red;
    ctx.beginPath(); ctx.moveTo(-26, 56); ctx.lineTo(5, 58); ctx.lineTo(24, 139); ctx.lineTo(10, 142); ctx.lineTo(-17, 91); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 57); ctx.lineTo(31, 52); ctx.lineTo(43, 133); ctx.lineTo(29, 141); ctx.lineTo(7, 92); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Shoes, separately cut and slightly offset
    ctx.fillStyle = '#f0d8c7'; ctx.beginPath(); ctx.moveTo(8, 137); ctx.lineTo(29, 132); ctx.lineTo(43, 146); ctx.lineTo(24, 150); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28, 136); ctx.lineTo(43, 130); ctx.lineTo(57, 144); ctx.lineTo(40, 151); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Arms behind the sweater; poses change in discrete paper frames.
    ctx.strokeStyle = skin; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-23, -3); ctx.lineTo(-49, armLift - 13); ctx.lineTo(-55, armLift + 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(23, -4); ctx.lineTo(46, -18 - armLift * 0.3); ctx.lineTo(55, -5 - armLift); ctx.stroke();
    ctx.strokeStyle = '#fff7e8'; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(-23, -3); ctx.lineTo(-49, armLift - 13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(23, -4); ctx.lineTo(46, -18 - armLift * 0.3); ctx.stroke();
    // Oversized sweater and collar
    ctx.fillStyle = violet; ctx.beginPath(); ctx.moveTo(-26, -23); ctx.lineTo(-43, -8); ctx.lineTo(-32, 60); ctx.lineTo(30, 57); ctx.lineTo(39, -5); ctx.lineTo(23, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8170bf'; ctx.beginPath(); ctx.moveTo(-11, -27); ctx.quadraticCurveTo(0, -15, 11, -27); ctx.lineTo(19, -20); ctx.lineTo(0, -9); ctx.lineTo(-20, -20); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,238,220,.28)'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-25 + i * 10, 1); ctx.lineTo(-25 + i * 10, 48); ctx.stroke(); }
    // Neck and hair silhouette
    ctx.fillStyle = skin; ctx.fillRect(-9, -42, 18, 25);
    ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(-34, -75); ctx.quadraticCurveTo(-44, -114, 0, -116); ctx.quadraticCurveTo(43, -109, 36, -47); ctx.lineTo(49, 29); ctx.lineTo(26, 49); ctx.lineTo(17, -59); ctx.lineTo(-20, -52); ctx.lineTo(-27, 41); ctx.lineTo(-43, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Face and paper-cut bangs
    ctx.fillStyle = skin; ctx.beginPath(); ctx.moveTo(-27, -86); ctx.quadraticCurveTo(-30, -50, -17, -39); ctx.lineTo(0, -30); ctx.lineTo(20, -39); ctx.quadraticCurveTo(31, -55, 27, -89); ctx.quadraticCurveTo(2, -111, -27, -86); ctx.fill();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(-30, -84); ctx.quadraticCurveTo(-18, -119, 8, -107); ctx.quadraticCurveTo(24, -108, 32, -88); ctx.lineTo(9, -92); ctx.lineTo(1, -77); ctx.lineTo(-8, -94); ctx.lineTo(-17, -78); ctx.closePath(); ctx.fill();
    // Eyes, alternate wink, and cut-paper lashes
    ctx.fillStyle = '#fff7e8'; ctx.beginPath(); ctx.ellipse(-13, -69, 7, 4, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(13, -69, 7, 4, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#282331'; ctx.beginPath(); ctx.arc(-13, -69, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(13, -69, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#342832'; ctx.lineWidth = 2; ctx.beginPath();
    if (frame === 1) { ctx.moveTo(-20, -68); ctx.quadraticCurveTo(-13, -63, -6, -68); }
    else { ctx.moveTo(-20, -73); ctx.lineTo(-14, -76); ctx.lineTo(-7, -73); }
    ctx.moveTo(7, -73); ctx.lineTo(13, -76); ctx.lineTo(20, -73); ctx.stroke();
    ctx.fillStyle = '#b83342'; ctx.beginPath();
    if (frame === 2) ctx.ellipse(0, -48, 4, 6, 0, 0, Math.PI * 2);
    else { ctx.moveTo(-7, -49); ctx.quadraticCurveTo(0, -45, 7, -49); ctx.quadraticCurveTo(0, -41, -7, -49); }
    ctx.fill();
    // Hand-cut star pin
    ctx.fillStyle = '#e6c56f'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4 : 8; ctx.lineTo(29 + Math.cos(a) * r, -91 + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff7e8'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  render(ctx, pulse = 0) {
    const scale = Math.max(0.8, Math.min(1, this.height / 760));
    const x = this.width * 0.79;
    const y = this.height * 0.88;
    const frameWidth = 246 * scale, frameHeight = 270 * scale;
    const dance = Math.sin(this.lastTime * 0.006) * 2.2;
    ctx.save();
    // A tiny red-box stage echoes the miniature performance sets in the reference.
    ctx.fillStyle = 'rgba(40,24,41,.34)';
    ctx.fillRect(x - frameWidth / 2 + 8, y - frameHeight + 12, frameWidth, frameHeight);
    ctx.fillStyle = '#fff5e7'; ctx.fillRect(x - frameWidth / 2, y - frameHeight, frameWidth, frameHeight);
    ctx.fillStyle = '#b93140'; ctx.fillRect(x - frameWidth / 2 + 7, y - frameHeight + 7, frameWidth - 14, frameHeight - 14);
    const slotW = (frameWidth - 26) / 3;
    const slotTop = y - frameHeight + 15;
    const slotH = frameHeight - 30;
    ['#f5d9cb', '#f8ead6', '#d63b4b'].forEach((paper, index) => {
      const slotX = x - frameWidth / 2 + 9 + index * (slotW + 4);
      ctx.fillStyle = paper; ctx.fillRect(slotX, slotTop, slotW, slotH);
      ctx.fillStyle = index === 1 ? '#344268' : '#cf3345';
      ctx.fillRect(slotX, slotTop, slotW, 7 * scale);
    });
    // Little paper stage lights flutter on the beat like a handmade toy set.
    for (let i = 0; i < 3; i++) {
      const lightX = x - frameWidth * 0.32 + i * frameWidth * 0.32;
      ctx.fillStyle = i === this.frame % 3 ? '#ffd36f' : '#f6c7bd';
      ctx.beginPath(); ctx.arc(lightX, y - frameHeight + 14 * scale, 3.4 * scale + pulse * 1.5, 0, Math.PI * 2); ctx.fill();
    }
    this.drawGirl(ctx, x - slotW * 0.92, y - 17 * scale, scale * 0.34, (this.frame + 1) % 4);
    this.drawGirl(ctx, x + slotW * 0.92, y - 17 * scale, scale * 0.34, (this.frame + 3) % 4);
    this.drawGirl(ctx, x + dance, y - 5 * scale, scale * 0.82 * (1 + Math.min(pulse, 1) * 0.025), this.frame);
    ctx.strokeStyle = '#fff6e4'; ctx.lineWidth = 3 * scale;
    ctx.strokeRect(x - frameWidth / 2 + 4, y - frameHeight + 4, frameWidth - 8, frameHeight - 8);
    ctx.restore();
  }
}

import londonTaxiUrl from './imagenes/[CITYPNG.COM]HD London Cab Taxi Real Car PNG - 1500x1500.png';
import phoneBoothUrl from './imagenes/pngtree-london-red-phone-booth-png-image_12688811.png';
import bigBenUrl from './imagenes/vecteezy_iconic-view-of-big-ben-and-the-houses-of-parliament-along_55925702.png';
import pinkPantheressUrl from './imagenes/coveteur-pinkpantheress-dkr-1.png';

// Moving paper-collage London backdrop for the live visual instrument.
export class FancyBackground {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.realTime = 0;
    this.lastRealTime = null;
    this.pulse = 0;
    this.scrollOffset = 0;
    this.scrollKick = 0;
    this.lastSceneTime = null;
    this.lastInputPulse = 0;
    this.poseAccent = 0;
    this.paperHits = [];
    this.portraitFlash = null;
    this.portraitSeed = 0;
    this.images = {
      taxi: this.loadImage(londonTaxiUrl),
      phoneBooth: this.loadImage(phoneBoothUrl),
      bigBen: this.loadImage(bigBenUrl),
      pinkPantheress: this.loadImage(pinkPantheressUrl)
    };
    this.cropCache = new WeakMap();
    this.tartanTile = this.makeTartanTile();
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
    this.paperHits.push({ x, y, age: 0, alpha: 1, color });
    this.triggerRhythmShift(1);
  }
  triggerPortraitFlash() {
    // Portraits are performer cues, not events scheduled from the audio clock.
    const random = Math.random;
    this.portraitFlash = {
      start: this.realTime,
      duration: 1.05 + random() * .8,
      x: .21 + random() * .58,
      y: .32 + random() * .34,
      size: .9 + random() * .35,
      angle: (random() - .5) * .18,
      seed: ++this.portraitSeed + 2
    };
  }
  triggerRhythmShift(intensity = 1) {
    this.scrollKick = Math.min(3.1, this.scrollKick + 0.72 * intensity);
    this.pulse = Math.max(this.pulse, Math.min(1, 0.5 + intensity * 0.35));
  }

  loadImage(url) {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    return image;
  }

  prepareCrop(image, crop) {
    let crops = this.cropCache.get(image);
    if (!crops) { crops = new Map(); this.cropCache.set(image, crops); }
    const key = `${crop.x},${crop.y},${crop.w},${crop.h}`;
    if (crops.has(key)) return crops.get(key);
    // Keep the largest working copy close to projection resolution. Several
    // repeated skyline cut-outs are then cheap to rotate and composite each frame.
    const scale = Math.min(1, 1400 / crop.w);
    const padding = 10;
    const canvas = document.createElement('canvas');
    const contentWidth = Math.max(1, Math.round(crop.w * scale));
    const contentHeight = Math.max(1, Math.round(crop.h * scale));
    canvas.width = contentWidth + padding * 2;
    canvas.height = contentHeight + padding * 2;
    const cropCtx = canvas.getContext('2d');
    cropCtx.filter = 'drop-shadow(0 4px 3px rgba(42, 29, 39, .34)) drop-shadow(0 0 1.5px rgba(249, 239, 220, .95))';
    cropCtx.drawImage(image, crop.x, crop.y, crop.w, crop.h,
      padding, padding, contentWidth, contentHeight);
    cropCtx.filter = 'none';
    canvas.contentWidth = contentWidth;
    canvas.contentHeight = contentHeight;
    canvas.padding = padding;
    crops.set(key, canvas);
    return canvas;
  }

  drawImageCutout(ctx, image, x, y, width, height, rotation = 0, alpha = 1, crop = null, motionSeed = 0, torn = false) {
    if (!image || !image.complete || !image.naturalWidth) return;
    // Hold each pose for a few frames, then snap to the next tilt: the movement
    // should feel like repositioned paper cut-outs, not smooth CSS wobble.
    const pose = [-1, -.45, .4, 1, .15, -.8, -.25, .65][Math.floor(this.realTime * 8 + motionSeed) % 8];
    const accent = this.poseAccent * (((motionSeed % 3) - 1) * .55 + .45);
    const tilt = rotation + pose * .052 + accent * .055;
    const nudgeX = pose * width * .012 + accent * width * .009;
    const nudgeY = ((pose === 1 || pose === -1) ? -1 : 1) * height * .006;
    x = Math.round(x + nudgeX); y = Math.round(y + nudgeY);
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.globalAlpha = alpha;
    const source = crop || { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
    const fit = Math.max(width / source.w, height / source.h);
    const imageWidth = source.w * fit, imageHeight = source.h * fit;
    if (torn) {
      ctx.beginPath(); ctx.moveTo(-width * .5, -height * .44); ctx.lineTo(-width * .13, -height * .5);
      ctx.lineTo(width * .18, -height * .47); ctx.lineTo(width * .5, -height * .43);
      ctx.lineTo(width * .48, height * .15); ctx.lineTo(width * .52, height * .44);
      ctx.lineTo(width * .1, height * .49); ctx.lineTo(-width * .22, height * .46);
      ctx.lineTo(-width * .51, height * .42); ctx.lineTo(-width * .48, -height * .05); ctx.closePath(); ctx.clip();
    }
    // Its paper contour and shadow were baked into the cached cut-out once,
    // avoiding a live drop-shadow filter for every repeated city fragment.
    const prepared = this.prepareCrop(image, source);
    const drawWidth = imageWidth * prepared.width / prepared.contentWidth;
    const drawHeight = imageHeight * prepared.height / prepared.contentHeight;
    ctx.drawImage(prepared, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }

  drawMovingCity(ctx, w, h, pulse) {
    const skyline = this.images.bigBen;
    if (!skyline?.complete || !skyline.naturalWidth) return;
    const crop = { x: 0, y: 900, w: 4096, h: 2050 };
    this.drawCityLayer(ctx, skyline, crop, w, h, Math.max(w * .52, h * .46), h * .77, .32, .31, 1, pulse);
    this.drawCityLayer(ctx, skyline, crop, w, h, Math.max(w * .74, h * .68), h * .95, .72, .85, 8, pulse);
    this.drawCityLayer(ctx, skyline, crop, w, h, Math.max(w * 1.03, h * .9), h * 1.13, 1.12, .58, 16, pulse);
  }

  drawCityLayer(ctx, image, crop, w, h, segmentWidth, baseY, pace, alpha, seed, pulse) {
    const segmentHeight = segmentWidth * crop.h / crop.w;
    const step = segmentWidth * .92, offset = (this.scrollOffset * pace) % step;
    for (let i = -1; i < Math.ceil(w / step) + 2; i++) {
      const x = -offset + i * step + segmentWidth * .5;
      const bob = Math.round(Math.sin(this.realTime * 2.2 + i * .9 + seed) * (1.2 + pulse * 1.5));
      this.drawImageCutout(ctx, image, x, baseY - segmentHeight * .5 + bob,
        segmentWidth, segmentHeight, 0, alpha, crop, seed + i);
    }
  }

  drawPortraitCue(ctx, w, h) {
    const cue = this.portraitFlash;
    if (!cue) return;
    const elapsed = this.realTime - cue.start;
    if (elapsed >= cue.duration) { this.portraitFlash = null; return; }
    const frame = Math.floor(elapsed * 8);
    const fadeIn = Math.min(1, elapsed / .09);
    const fadeOut = Math.min(1, (cue.duration - elapsed) / .2);
    const alpha = Math.min(fadeIn, fadeOut) * .97;
    const offsets = [-.012, .008, .016, -.006, -.015, .011, 0, .014];
    // Use the whole printed photo area and size by its real aspect ratio so
    // the performer and room stay intact instead of being zoom-cropped.
    const photoCrop = { x: 180, y: 1600, w: 3790, h: 1700 };
    const photoWidth = Math.min(w * .38, h * .58) * cue.size;
    const photoHeight = photoWidth * photoCrop.h / photoCrop.w;
    const photoX = Math.max(photoWidth * .58, Math.min(w - photoWidth * .58,
      w * cue.x + offsets[frame % offsets.length] * w));
    const photoY = Math.max(photoHeight * .6, Math.min(h - photoHeight * .6,
      h * cue.y + (frame % 2 ? -1 : 1) * h * .008));
    this.drawImageCutout(ctx, this.images.pinkPantheress,
      photoX, photoY,
      photoWidth, photoHeight,
      cue.angle + (frame % 3 - 1) * .018, alpha,
      photoCrop, cue.seed);
  }

  makeTartanTile() {
    const tile = document.createElement('canvas'); tile.width = tile.height = 480;
    const t = tile.getContext('2d'); t.fillStyle = '#efdcd2'; t.fillRect(0, 0, 480, 480);
    // Oversized dusty-rose, saffron and ink tartan fills the backdrop like a
    // printed textile. The large checks stay calm behind the flock.
    const stripes = [[104, '#46546a'], [19, '#b44d66'], [7, '#d7b05c'], [3, '#fbefdf'], [45, '#9b5368']];
    let x = 0;
    for (const [width, color] of stripes) { t.fillStyle = color; t.fillRect(x, 0, width, 480); x += width; }
    x = 172;
    for (const [width, color] of stripes.slice(1, 4)) { t.fillStyle = color; t.fillRect(x, 0, width, 480); x += width; }
    // The crossing bands make an actual sett; a light transparency pass lets
    // the vertical warp remain visible through the horizontal weft.
    t.globalAlpha = .76; let y = 0;
    for (const [height, color] of stripes) { t.fillStyle = color; t.fillRect(0, y, 480, height); y += height; }
    y = 172;
    for (const [height, color] of stripes.slice(1, 4)) { t.fillStyle = color; t.fillRect(0, y, 480, height); y += height; }
    t.globalAlpha = 1;
    t.globalAlpha = .2; t.fillStyle = '#fff8eb';
    for (let i = 0; i < 480; i += 6) t.fillRect(i, 0, 1, 480);
    t.globalAlpha = .12; t.fillStyle = '#291d2c';
    for (let i = 2; i < 480; i += 7) t.fillRect(0, i, 480, 1);
    return tile;
  }

  update(time, pulse = 0) {
    const realTime = time / 1000;
    const realDelta = this.lastRealTime === null ? 1 / 60 : Math.max(0, Math.min(.08, realTime - this.lastRealTime));
    this.lastRealTime = realTime;
    this.realTime += realDelta;
    this.time = this.realTime;
    if (pulse > this.lastInputPulse + .18) this.poseAccent = 1;
    this.lastInputPulse = pulse;
    this.poseAccent *= Math.exp(-7 * realDelta);
    const sceneDelta = this.lastSceneTime === null ? 1 / 60 : Math.max(0, Math.min(.08, this.time - this.lastSceneTime));
    this.lastSceneTime = this.time;
    this.scrollKick *= Math.exp(-5.2 * sceneDelta);
    this.scrollOffset += (16 + this.scrollKick * 230) * sceneDelta;
    this.pulse = Math.max(this.pulse * Math.exp(-7.8 * sceneDelta), pulse || 0);
    for (const hit of this.paperHits) { hit.age += realDelta; hit.alpha = Math.max(0, 1 - hit.age / .42); }
    this.paperHits = this.paperHits.filter(hit => hit.alpha > .03);
  }

  render(ctx) {
    const w = this.width, h = this.height;
    const [baseSky, basePaper, baseAccent] = this.palette[this.section];
    const pulse = Math.min(this.pulse, 1);
    const skyWash = ctx.createLinearGradient(0, 0, 0, h);
    skyWash.addColorStop(0, baseSky);
    skyWash.addColorStop(0.68, basePaper);
    skyWash.addColorStop(1, '#f5e9d9');
    ctx.fillStyle = skyWash;
    ctx.fillRect(0, 0, w, h);

    this.drawTartan(ctx, w, h, pulse, baseAccent);
    this.drawEditorialPaperCuts(ctx, w, h, baseAccent, pulse);
    this.drawGlimmerParticles(ctx, w, h, pulse);

    this.drawMovingCity(ctx, w, h, pulse);
    this.drawPortraitCue(ctx, w, h);
    const boothX = ((w * .13 - this.scrollOffset * .88 + w * 1.2) % (w * 1.2)) - w * .1;
    const boothCrop = { x: 74, y: 0, w: 212, h: 360 };
    const boothWidth = Math.min(w * .15, h * .31 * boothCrop.w / boothCrop.h);
    const boothHeight = boothWidth * boothCrop.h / boothCrop.w;
    this.drawImageCutout(ctx, this.images.phoneBooth, boothX, h * .72, boothWidth, boothHeight,
      -.045, .98, boothCrop, 3);
    const cabX = ((w * .8 - this.scrollOffset * 1.2 + w * 1.4) % (w * 1.4)) - w * .2;
    const cabCrop = { x: 34, y: 290, w: 1430, h: 970 };
    const cabWidth = Math.min(w * .28, h * .25 * cabCrop.w / cabCrop.h);
    const cabHeight = cabWidth * cabCrop.h / cabCrop.w;
    this.drawImageCutout(ctx, this.images.taxi, cabX, h * .88, cabWidth, cabHeight,
      .025, .97, cabCrop, 4);
    this.drawPaperGrain(ctx, w, h);
    this.drawProjectionGrade(ctx, w, h, baseAccent);

    this.drawPaperHitFeedback(ctx);
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

  drawTartan(ctx, w, h, pulse, accent) {
    const tartan = ctx.createPattern(this.tartanTile, 'repeat');
    ctx.save();
    ctx.translate(-this.scrollOffset * .12, Math.sin(this.realTime * .22) * 3);
    ctx.globalAlpha = .84 + pulse * .035;
    ctx.fillStyle = tartan;
    ctx.fillRect(-480, -10, w + 960, h + 20);
    // Soft print wash keeps the tartan readable while the song changes mood.
    ctx.globalAlpha = .12 + pulse * .08;
    ctx.fillStyle = accent;
    ctx.fillRect(-480, -10, w + 960, h + 20);
    ctx.restore();
  }

  drawPaperHitFeedback(ctx) {
    for (const hit of this.paperHits) {
      const progress = hit.age / .42;
      const x = hit.x - progress * this.width * .16;
      const y = hit.y - progress * this.height * .025;
      const size = Math.min(this.width, this.height) * (.11 + progress * .04);
      ctx.save(); ctx.translate(x, y); ctx.rotate(-.035 + progress * .08);
      ctx.globalAlpha = hit.alpha * .78;
      // A quick pasted-paper snap: offset print, torn strip and ink dash.
      ctx.fillStyle = 'rgba(42, 31, 49, .55)';
      ctx.beginPath(); ctx.moveTo(-size * .75, -size * .17); ctx.lineTo(size * .65, -size * .22);
      ctx.lineTo(size * .82, size * .12); ctx.lineTo(-size * .62, size * .2); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = hit.alpha;
      ctx.fillStyle = hit.color;
      ctx.beginPath(); ctx.moveTo(-size * .82, -size * .22); ctx.lineTo(size * .51, -size * .25);
      ctx.lineTo(size * .72, -.02 * size); ctx.lineTo(size * .59, size * .17);
      ctx.lineTo(-size * .49, size * .21); ctx.lineTo(-size * .76, size * .08); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff0dc'; ctx.lineWidth = Math.max(2, size * .025); ctx.stroke();
      ctx.fillStyle = '#fff0dc'; ctx.globalAlpha = hit.alpha * .86;
      ctx.fillRect(-size * .52, -size * .025, size * .22, size * .045);
      ctx.restore();
    }
  }

  drawEditorialPaperCuts(ctx, w, h, accent, pulse) {
    ctx.save();
    // A few ripped print scraps provide texture and motion, without the stack
    // of empty polygons that used to compete with the photo cut-outs.
    ctx.globalAlpha = .32 + pulse * .12;
    const y = h * .24 + Math.sin(this.realTime * .36) * 5;
    ctx.fillStyle = '#f9efe1';
    ctx.beginPath(); ctx.moveTo(w * .16, y); ctx.lineTo(w * .37, y - 7); ctx.lineTo(w * .4, y + 24);
    ctx.lineTo(w * .23, y + 31); ctx.lineTo(w * .15, y + 19); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = .19 + pulse * .07; ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(w * .19, y + 5); ctx.lineTo(w * .35, y + 1); ctx.lineTo(w * .36, y + 4); ctx.lineTo(w * .2, y + 11); ctx.closePath(); ctx.fill();
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

  drawGlimmerParticles(ctx, w, h, pulse) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    const paperTime = Math.floor(this.realTime * 8) / 8;
    for (let i = 0; i < 25; i++) {
      const x = ((i * 173.1 + paperTime * (10 + i * 0.18)) % (w + 120)) - 60;
      const y = ((i * 97.7 + paperTime * (8 + i * 0.12)) % (h + 80)) - 40;
      const radius = 1.3 + (i % 4) * .45 + pulse * .3;
      ctx.save(); ctx.translate(x, y); ctx.rotate((i % 7) * .41 + paperTime * .18);
      ctx.globalAlpha = .4 + (i % 3) * .12;
      ctx.fillStyle = ['#fff0d5', '#d5ac58', '#b9445d', '#29364c'][i % 4];
      ctx.beginPath(); ctx.moveTo(-radius * 1.4, -radius * .4);
      ctx.lineTo(radius * .55, -radius); ctx.lineTo(radius * 1.5, radius * .1);
      ctx.lineTo(-radius * .35, radius * .82); ctx.closePath(); ctx.fill(); ctx.restore();
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

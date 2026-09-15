export default async function run(page, ui) {
  const shots = [];
  const total = await page.evaluate(() => document.querySelectorAll('.slide').length);

  for (let i = 0; i < total; i++) {
    // Navega hasta el slide i usando los botones
    await page.evaluate((idx) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
      document.querySelector('#counterCurrent').textContent = String(idx + 1).padStart(2, '0');
    }, i);
    await page.waitForTimeout(1400);
    const file = `qa-s${String(i + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: file });
    const info = await page.evaluate(() => {
      const slide = document.querySelector('.slide.is-active');
      const media = slide?.querySelector('.slide-media');
      const cs = media ? getComputedStyle(media) : null;
      return {
        id: slide?.querySelector('.slide-kicker')?.textContent?.trim(),
        hasMedia: !!media,
        opacity: cs?.opacity ?? null,
        blend: cs?.mixBlendMode ?? null
      };
    });
    shots.push({ slide: i + 1, file, ...info });
  }
  return shots;
}

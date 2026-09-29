// Parse a local LRC file into timestamped lines. No lyrics are bundled or fetched.
export function parseLrc(source) {
  const offsetMatch = source.match(/^\[offset:([+-]?\d+)\]/im);
  const offset = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0;
  const cues = [];

  for (const rawLine of source.split(/\r?\n/)) {
    const stamps = [...rawLine.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
    if (!stamps.length) continue;
    const text = rawLine.replace(/\[[^\]]*\]/g, '').trim();
    if (!text) continue;
    for (const stamp of stamps) {
      const fraction = stamp[3] ? Number(`0.${stamp[3]}`) : 0;
      const time = Math.max(0, Number(stamp[1]) * 60 + Number(stamp[2]) + fraction + offset);
      cues.push({ time, text });
    }
  }

  return cues.sort((a, b) => a.time - b.time);
}

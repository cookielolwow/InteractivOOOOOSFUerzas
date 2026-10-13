export const PALETTE = ['#ff5a1f', '#075bff', '#ff1688', '#ffe600', '#a8ed00'];

export function normalizeHex(hex) {
  const value = `${hex}`.trim().replace('#', '');
  if (!value) return '#ffffff';
  if (value.length === 3) {
    return `#${value.split('').map((char) => char + char).join('')}`.toLowerCase();
  }
  return `#${value}`.toLowerCase();
}

export function hexToRgb(hex) {
  const safeHex = normalizeHex(hex);
  const value = safeHex.replace('#', '');
  const num = Number.parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function colorDistance(hexA, hexB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return Math.sqrt(
    (a.r - b.r) ** 2 +
    (a.g - b.g) ** 2 +
    (a.b - b.b) ** 2
  );
}

export function resolveNextGoalColor(palette = PALETTE) {
  const index = Math.floor(Math.random() * palette.length);
  return normalizeHex(palette[index]);
}

export function evaluateGoalState({
  letters,
  objective,
  positions,
  targetScale = 1,
  tolerance = 0.12,
}) {
  if (!letters?.length || !objective) return false;

  const requiredLetters = ['A', 'B', 'D'];

  return requiredLetters.every((letterId) => {
    const match = letters.find((letter) => letter.id === letterId);
    if (!match) return false;

    const pos = positions?.[letterId] ?? { x: 0, y: 0 };
    const dx = match.x - pos.x;
    const dy = match.y - pos.y;
    const positionOkay = Math.hypot(dx, dy) <= tolerance;
    const scaleOkay = Math.abs(match.scale - targetScale) <= 0.18;
    const colorOkay = colorDistance(match.color, objective.color) <= 60;

    return positionOkay && scaleOkay && colorOkay;
  });
}

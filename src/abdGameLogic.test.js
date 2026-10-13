import { describe, it, expect } from 'vitest';
import { evaluateGoalState, resolveNextGoalColor } from './abdGameLogic.js';

describe('ABD goal logic', () => {
  it('flags a solved board only when all letters match the target goal and are in position', () => {
    const letters = [
      { id: 'A', x: 0, y: 0, scale: 1, color: '#ff5da2' },
      { id: 'B', x: 0, y: 0, scale: 1, color: '#ff5da2' },
      { id: 'D', x: 0, y: 0, scale: 1, color: '#ff5da2' }
    ];

    const objective = { color: '#ff5da2', tolerance: 0.12 };

    expect(evaluateGoalState({ letters, objective, positions: { A: { x: 0, y: 0 }, B: { x: 0, y: 0 }, D: { x: 0, y: 0 } }, targetScale: 1 })).toBe(true);
  });

  it('chooses a color from the allowed palette', () => {
    const palette = ['#ff5da2', '#6ef3ff', '#ffd166', '#7af76a', '#8ea7ff'];
    expect(palette.includes(resolveNextGoalColor(palette))).toBe(true);
  });
});

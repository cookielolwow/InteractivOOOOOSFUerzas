import { describe, it, expect } from 'vitest';
import { evaluateGoalState, resolveNextGoalColor } from './abdGameLogic.js';

describe('ABD goal logic', () => {
  it('flags a solved board only when all letters match the target goal and are in position', () => {
    const letters = [
      { id: 'A', x: 0, y: 0, scale: 1.8, color: '#ff5da2', rotation: { x: 0, y: -0.47, z: 0 } },
      { id: 'B', x: 0, y: 0, scale: 2, color: '#ff5da2', rotation: { x: 0, y: -0.47, z: 0 } },
      { id: 'D', x: 0, y: 0, scale: 2.2, color: '#ff5da2', rotation: { x: 0, y: -0.47, z: 0 } }
    ];

    const objective = { color: '#ff5da2', tolerance: 0.12 };
    const rotations = Object.fromEntries(['A', 'B', 'D'].map((id) => [id, { x: 0, y: -0.47, z: 0 }]));

    const targetScales = { A: 1.8, B: 2, D: 2.2 };
    expect(evaluateGoalState({ letters, objective, positions: { A: { x: 0, y: 0 }, B: { x: 0, y: 0 }, D: { x: 0, y: 0 } }, rotations, targetScale: 2, targetScales })).toBe(true);
    letters[1].rotation.z = 0.5;
    expect(evaluateGoalState({ letters, objective, positions: { A: { x: 0, y: 0 }, B: { x: 0, y: 0 }, D: { x: 0, y: 0 } }, rotations, targetScale: 2, targetScales })).toBe(false);
    letters[1].rotation.z = 0;
    letters[0].scale = 1;
    expect(evaluateGoalState({ letters, objective, positions: { A: { x: 0, y: 0 }, B: { x: 0, y: 0 }, D: { x: 0, y: 0 } }, rotations, targetScale: 2, targetScales })).toBe(false);
  });

  it('chooses a color from the allowed palette', () => {
    const palette = ['#ff5da2', '#6ef3ff', '#ffd166', '#7af76a', '#8ea7ff'];
    expect(palette.includes(resolveNextGoalColor(palette))).toBe(true);
  });
});

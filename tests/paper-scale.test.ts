import { describe, expect, it } from 'vitest';
import { fitPaperScale, stepPaperScale } from '../src/client/paper-scale';

describe('fitPaperScale', () => {
  it('fits the full paper width inside a narrow viewport', () => {
    expect(fitPaperScale(360, 816)).toBeCloseTo(360 / 816);
  });

  it('does not enlarge the paper above its reference size', () => {
    expect(fitPaperScale(1200, 816)).toBe(1);
  });

  it('keeps the reference size until measurable dimensions are available', () => {
    expect(fitPaperScale(0, 816)).toBe(1);
    expect(fitPaperScale(360, Number.NaN)).toBe(1);
  });
});

describe('stepPaperScale', () => {
  it('steps up and down from a responsive fit scale', () => {
    expect(stepPaperScale(0.44, 'in')).toBe(0.5);
    expect(stepPaperScale(0.44, 'out')).toBe(0.33);
  });

  it('stops at the supported zoom limits', () => {
    expect(stepPaperScale(2, 'in')).toBe(2);
    expect(stepPaperScale(0.25, 'out')).toBe(0.25);
  });
});

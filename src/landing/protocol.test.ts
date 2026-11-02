import { describe, expect, it } from 'vitest';
import {
  checkReading,
  estimateRewards,
  randomReading,
  ratePerKWh,
  short,
  splitPayment,
} from './protocol';

describe('checkReading', () => {
  it('accepts an honest reading within capacity and pays 1 GRID per kWh', () => {
    const r = checkReading({ wh: 4120, tampered: false, replayed: false });
    expect(r.accepted).toBe(true);
    expect(r.rewardGrid).toBeCloseTo(4.12);
    expect(r.checks.every((c) => c.pass)).toBe(true);
  });

  it('accepts exactly the rated maximum', () => {
    expect(checkReading({ wh: 5000, tampered: false, replayed: false }).accepted).toBe(true);
  });

  it.each([
    ['over capacity', { wh: 5010, tampered: false, replayed: false }, 2],
    ['tampered after signing', { wh: 1000, tampered: true, replayed: false }, 0],
    ['replayed', { wh: 1000, tampered: false, replayed: true }, 1],
  ])('rejects a reading that is %s and pays nothing', (_name, input, failingIndex) => {
    const r = checkReading(input);
    expect(r.accepted).toBe(false);
    expect(r.rewardGrid).toBe(0);
    expect(r.checks[failingIndex]!.pass).toBe(false);
  });
});

describe('emissions', () => {
  it('halves the rate every year', () => {
    expect([1, 2, 3, 4].map(ratePerKWh)).toEqual([1, 0.5, 0.25, 0.125]);
  });

  it('estimates daily and yearly rewards', () => {
    const r = estimateRewards({ kw: 6, sunHours: 5, year: 2 });
    expect(r.kWhPerDay).toBe(30);
    expect(r.gridPerDay).toBe(15);
    expect(r.gridPerYear).toBe(15 * 365);
  });
});

describe('splitPayment', () => {
  it('splits 50/30/20 and conserves the total', () => {
    const s = splitPayment(100_000);
    expect(s).toEqual({ producers: 50_000, burned: 30_000, treasury: 20_000 });
    expect(s.producers + s.burned + s.treasury).toBe(100_000);
  });
});

describe('short', () => {
  it('abbreviates thousands and millions', () => {
    expect(short(950)).toBe('950');
    expect(short(100_000)).toBe('100K');
    expect(short(1_000_000)).toBe('1.0M');
  });
});

describe('randomReading', () => {
  it('only pays GRID for solar and wind', () => {
    for (let seed = 0; seed < 200; seed++) {
      const r = randomReading(seed);
      if (r.kind === 'Battery' || r.kind === 'EV') expect(r.status).not.toMatch(/^\+/);
      if (!r.ok) expect(r.whNum).toBe(0);
    }
  });
});

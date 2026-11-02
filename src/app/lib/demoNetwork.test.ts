import { describe, expect, it } from 'vitest';
import { DemoNetwork, WEI_PER_WH } from './demoNetwork';
import type { LiveEvent } from './types';

/** Deterministic pseudo-random numbers so the simulation is reproducible in tests. */
function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

const NOW = 1_800_000_000_000;
const ADDR = `0x${'a'.repeat(40)}`;

describe('DemoNetwork', () => {
  it('starts with the five seed meters and back-filled history', () => {
    const net = new DemoNetwork(seeded(), NOW);
    const meters = net.listMeters();
    expect(meters.map((m) => m.kind)).toEqual(['solar', 'solar', 'wind', 'battery', 'ev']);
    expect(meters.every((m) => m.readings > 0)).toBe(true);
    expect(net.listActivity(10)).toHaveLength(10);
  });

  it('only rewards solar and wind, at 1 GRID per kWh', () => {
    const net = new DemoNetwork(seeded(), NOW);
    for (const m of net.listMeters()) {
      if (m.kind === 'battery' || m.kind === 'ev') {
        expect(m.rewardable).toBe(false);
        expect(m.totalRewardWei).toBe('0');
      } else {
        expect(m.rewardable).toBe(true);
        expect(BigInt(m.totalRewardWei)).toBe(BigInt(m.totalWh) * WEI_PER_WH);
      }
    }
  });

  it('never reports more power than a meter is rated for', () => {
    const net = new DemoNetwork(seeded(7), NOW);
    for (let i = 0; i < 50; i++) net.simulateNow();
    for (const m of net.listMeters()) expect(m.lastPowerW).toBeLessThanOrEqual(m.capacityW);
  });

  it('keeps stats consistent with the meters', () => {
    const net = new DemoNetwork(seeded(), NOW);
    const stats = net.stats(NOW);
    const generatedKWh = net
      .listMeters()
      .filter((m) => m.rewardable)
      .reduce((sum, m) => sum + Number(m.totalWh) / 1000, 0);
    expect(stats.energy.generatedKWh).toBeCloseTo(generatedKWh);
    expect(stats.impact.estimatedCo2AvoidedKg).toBeCloseTo(generatedKWh * 0.4);
    expect(stats.verification.acceptanceRate).toBeGreaterThan(0.9);
    expect(stats.verification.acceptanceRate).toBeLessThanOrEqual(1);
  });

  it('splits agent payments 50/30/20', () => {
    const { totals, split } = new DemoNetwork(seeded(), NOW).marketSummary();
    expect(split).toEqual({ recycleBps: 5000, burnBps: 3000, treasuryBps: 2000 });
    const spent = Number(totals!.spentGrid);
    expect(Number(totals!.recycledToProducersGrid)).toBeCloseTo(spent * 0.5);
    expect(Number(totals!.burnedGrid)).toBeCloseTo(spent * 0.3);
    expect(Number(totals!.treasuryGrid)).toBeCloseTo(spent * 0.2);
  });

  it('buckets the time series by minute', () => {
    const series = new DemoNetwork(seeded(), NOW).timeseries({ minutes: 30, bucketSec: 60 }, NOW);
    expect(series.buckets).toHaveLength(30);
    expect(series.buckets.some((b) => b.wind > 0)).toBe(true);
  });

  it('registers a meter, emits it, and refuses duplicates', () => {
    const net = new DemoNetwork(seeded(), NOW);
    const events: LiveEvent[] = [];
    net.subscribe((e) => events.push(e));
    const meter = net.registerMeter(
      { address: ADDR, kind: 'battery', capacityW: 5000, payout: ADDR },
      NOW,
    );
    expect(meter.label).toBe('battery-aaaaaa');
    expect(meter.rewardable).toBe(false);
    expect(events).toEqual([{ type: 'meter', data: meter }]);
    expect(() =>
      net.registerMeter({
        address: ADDR.toUpperCase().replace('0X', '0x'),
        kind: 'solar',
        capacityW: 1,
        payout: ADDR,
      }),
    ).toThrow(/already registered/);
  });

  it('emits a reading for every active meter when asked to simulate', () => {
    const net = new DemoNetwork(seeded(), NOW);
    const readings: LiveEvent[] = [];
    net.subscribe((e) => e.type === 'reading' && readings.push(e));
    net.simulateNow();
    expect(readings).toHaveLength(5);
  });
});

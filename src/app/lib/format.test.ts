import { describe, expect, it } from 'vitest';
import { encodeBalanceOf } from '../hooks/useWallet';
import { validateMeterForm } from './validation';
import { buildChart } from './chart';
import { describeActivity } from './activity';
import {
  formatEnergy,
  formatGrid,
  formatPower,
  isOnline,
  shortAddress,
  timeAgo,
  weiToGrid,
} from './format';

describe('formatters', () => {
  it('formats power', () => {
    expect(formatPower(840)).toBe('840 W');
    expect(formatPower(12_400)).toBe('12.4 kW');
    expect(formatPower(2_500_000)).toBe('2.50 MW');
  });

  it('formats energy', () => {
    expect(formatEnergy(3.456)).toBe('3.46 kWh');
    expect(formatEnergy(42.1)).toBe('42.1 kWh');
    expect(formatEnergy(1500)).toBe('1.50 MWh');
  });

  it('formats GRID amounts', () => {
    expect(formatGrid(0)).toBe('0');
    expect(formatGrid('not a number')).toBe('0');
    expect(formatGrid(0.00123)).toBe('0.0012');
    expect(formatGrid(1234.5)).toBe('1,234.50');
  });

  it('converts wei to GRID', () => {
    expect(weiToGrid('1500000000000000000')).toBe(1.5);
    expect(weiToGrid(null)).toBe(0);
  });

  it('shortens addresses and times', () => {
    expect(shortAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234…5678');
    expect(timeAgo(1000, 3000)).toBe('just now');
    expect(timeAgo(0, 30_000)).toBe('30s ago');
    expect(timeAgo(0, 300_000)).toBe('5m ago');
    expect(timeAgo(0, 7_200_000)).toBe('2h ago');
  });

  it('treats a meter as online for one minute after it reports', () => {
    expect(isOnline({ active: true, lastSeenAt: 0 }, 59_999)).toBe(true);
    expect(isOnline({ active: true, lastSeenAt: 0 }, 60_000)).toBe(false);
    expect(isOnline({ active: false, lastSeenAt: 100 }, 100)).toBe(false);
  });
});

describe('validateMeterForm', () => {
  const ok = { address: `0x${'1'.repeat(40)}`, payout: `0x${'2'.repeat(40)}`, capacityW: '5000' };
  it('accepts a valid form', () => expect(validateMeterForm(ok)).toBeNull());
  it('rejects bad addresses and capacities', () => {
    expect(validateMeterForm({ ...ok, address: '0x123' })).toMatch(/Meter address/);
    expect(validateMeterForm({ ...ok, payout: 'wallet' })).toMatch(/Payout wallet/);
    expect(validateMeterForm({ ...ok, capacityW: '2.5' })).toMatch(/whole number/);
    expect(validateMeterForm({ ...ok, capacityW: '0' })).toMatch(/whole number/);
  });
});

describe('encodeBalanceOf', () => {
  it('ABI-encodes the ERC-20 balanceOf call', () => {
    const data = encodeBalanceOf('0xAbCdEf0000000000000000000000000000000001');
    expect(data).toBe(`0x70a08231${'0'.repeat(24)}abcdef0000000000000000000000000000000001`);
    expect(data).toHaveLength(2 + 8 + 64);
  });
});

describe('buildChart', () => {
  it('handles an empty series', () => {
    expect(buildChart(null)).toMatchObject({ paths: ['', '', ''], minutes: 0, max: 1.1 });
  });

  it('stacks solar, wind and battery in kW', () => {
    // 60-second buckets: 100 Wh in a minute = 6 kW average.
    const chart = buildChart({
      bucketSec: 60,
      unit: 'Wh',
      buckets: [
        { t: 0, solar: 100, wind: 50, battery: 0, ev: 999 },
        { t: 60, solar: 100, wind: 50, battery: 0, ev: 999 },
      ],
    });
    expect(chart.max).toBeCloseTo(9 * 1.1);
    expect(chart.paths.every((p) => p.startsWith('M'))).toBe(true);
  });
});

describe('describeActivity', () => {
  it('describes accepted readings with their payout', () => {
    expect(
      describeActivity({
        type: 'reading.accepted',
        at: 0,
        meter: '0x',
        label: 'A',
        kind: 'solar',
        energyWh: '1500',
        rewardWei: '1500000000000000000',
        txHash: null,
        onchain: true,
      }),
    ).toBe('1.50 kWh logged, 1.50 GRID paid');
  });
  it('describes rejections in plain words', () => {
    expect(
      describeActivity({
        type: 'reading.rejected',
        at: 0,
        meter: '0x',
        label: 'A',
        code: 'exceeds_capacity',
      }),
    ).toBe('Rejected: More energy than the meter’s rated capacity');
  });
});

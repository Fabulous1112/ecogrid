import type { MeterKind, RejectionCode } from './types';

export const KINDS: Record<MeterKind, { label: string; color: string; generates: boolean }> = {
  solar: { label: 'Solar', color: '#F2B33D', generates: true },
  wind: { label: 'Wind', color: '#6FD6E8', generates: true },
  battery: { label: 'Battery', color: '#B79CFF', generates: false },
  ev: { label: 'EV charger', color: '#FF8A6B', generates: false },
};

export const REJECTION_TEXT: Record<RejectionCode, string> = {
  bad_signature: 'Signature didn’t match the meter key',
  overlaps_previous: 'Period overlapped an earlier reading',
  exceeds_capacity: 'More energy than the meter’s rated capacity',
  period_in_future: 'Period ended in the future',
  unknown_meter: 'Meter isn’t registered',
  meter_inactive: 'Meter has been revoked',
  bad_period: 'Period end was before its start',
};

/** A meter counts as online if it reported in the last minute. */
export const ONLINE_WINDOW_MS = 60_000;

const fixed = (digits: number) =>
  new Intl.NumberFormat('en', { maximumFractionDigits: digits, minimumFractionDigits: digits });

export function formatPower(watts: number): string {
  if (watts >= 1e6) return `${fixed(2).format(watts / 1e6)} MW`;
  if (watts >= 1e3) return `${fixed(1).format(watts / 1e3)} kW`;
  return `${Math.round(watts)} W`;
}

export function formatEnergy(kWh: number): string {
  if (kWh >= 1e3) return `${fixed(2).format(kWh / 1e3)} MWh`;
  return `${fixed(kWh < 10 ? 2 : 1).format(kWh)} kWh`;
}

export function formatGrid(amount: number | string): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return '0';
  return n < 0.01 ? fixed(4).format(n) : fixed(2).format(n);
}

/** Converts an 18-decimal wei string to a GRID number (display only; loses precision past 2^53). */
export function weiToGrid(wei: string | null | undefined): number {
  return Number(BigInt(wei || '0')) / 1e18;
}

export function shortAddress(address: string | null | undefined): string {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
}

export function timeAgo(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function isOnline(
  meter: { active: boolean; lastSeenAt: number | null },
  now = Date.now(),
): boolean {
  return meter.active && meter.lastSeenAt != null && now - meter.lastSeenAt < ONLINE_WINDOW_MS;
}

export const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

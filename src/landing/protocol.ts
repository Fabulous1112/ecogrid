// The numbers and rules the landing page demonstrates. Kept free of React so they can be
// unit-tested and stay in step with the contracts' published parameters.

export const fmt = (n: number, digits: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const short = (n: number) =>
  n >= 1e6 ? `${fmt(n / 1e6, 1)}M` : n >= 1e3 ? `${fmt(n / 1e3, 0)}K` : fmt(n, 0);

/** Market split of every agent payment, in basis points. */
export const SPLIT = { producers: 0.5, burn: 0.3, treasury: 0.2 } as const;

/** Rated maximum of the demo rooftop: 5 kW for one hour. */
export const DEMO_CAPACITY_WH = 5_000;

export interface ReadingCheck {
  label: string;
  detail: string;
  pass: boolean;
}

/** Mirrors the three checks in `EnergyRewards.submitReading()` for the interactive demo. */
export function checkReading({
  wh,
  tampered,
  replayed,
}: {
  wh: number;
  tampered: boolean;
  replayed: boolean;
}) {
  const capOk = wh <= DEMO_CAPACITY_WH;
  const checks: ReadingCheck[] = [
    {
      label: 'Signed by the registered meter key',
      detail: tampered
        ? 'The number changed after signing, so the signature no longer matches.'
        : 'Signature matches every field.',
      pass: !tampered,
    },
    {
      label: 'Starts after the last accepted reading',
      detail: replayed
        ? 'This exact period was already paid. Replays are rejected.'
        : 'New period, never seen before.',
      pass: !replayed,
    },
    {
      label: 'Within rated capacity',
      detail: capOk
        ? `${fmt(wh, 0)} Wh of a possible ${fmt(DEMO_CAPACITY_WH, 0)} Wh.`
        : `${fmt(wh, 0)} Wh is more than a 5 kW array can make in an hour.`,
      pass: capOk,
    },
  ];
  const accepted = checks.every((c) => c.pass);
  return { checks, accepted, capOk, rewardGrid: accepted ? wh / 1000 : 0 };
}

/** Emission rate in $GRID per kWh: 1 in year one, halving every 365 days. */
export const ratePerKWh = (year: number) => 1 / 2 ** (year - 1);

export function estimateRewards({
  kw,
  sunHours,
  year,
}: {
  kw: number;
  sunHours: number;
  year: number;
}) {
  const kWhPerDay = kw * sunHours;
  const rate = ratePerKWh(year);
  return { kWhPerDay, rate, gridPerDay: kWhPerDay * rate, gridPerYear: kWhPerDay * rate * 365 };
}

export function splitPayment(grid: number) {
  return {
    producers: grid * SPLIT.producers,
    burned: grid * SPLIT.burn,
    treasury: grid * SPLIT.treasury,
  };
}

// ---- Simulated live feed for the hero section ----

export const FEED_METERS = [
  { m: '0x7a3F…c19E', kind: 'Solar', cap: 6_000, color: '#F2B33D' },
  { m: '0x1Bd4…88a0', kind: 'Solar', cap: 25_000, color: '#F2B33D' },
  { m: '0xC09e…4f12', kind: 'Wind', cap: 10_000, color: '#6FD6E8' },
  { m: '0x55aA…e301', kind: 'Battery', cap: 12_000, color: '#B79CFF' },
  { m: '0x9f02…7cD9', kind: 'EV', cap: 22_000, color: '#FF8A6B' },
] as const;

const FEED_AGENTS = [
  ['Helios Trading Bot', 'Pro', 20_000],
  ['ClimateNet Model', 'Builder', 2_000],
  ['CarbonLedger', 'Builder', 2_000],
] as const;

const REJECTIONS = ['Replay', 'Over capacity', 'Bad signature'];

export interface FeedRow {
  id: number;
  meter: string;
  kind: string;
  color: string;
  whNum: number;
  wh: string;
  status: string;
  statusColor: string;
  ok: boolean;
}

export function randomReading(seed: number, rng: () => number = Math.random): FeedRow {
  if (seed > 6 && rng() < 0.12) {
    const [name, plan, price] = FEED_AGENTS[seed % FEED_AGENTS.length]!;
    return {
      id: seed,
      meter: name,
      kind: 'AI agent',
      color: '#E6F7F2',
      whNum: 0,
      wh: `${plan} plan`,
      status: `-${fmt(price, 0)} GRID`,
      statusColor: '#E6F7F2',
      ok: true,
    };
  }
  const meter = FEED_METERS[Math.floor(rng() * FEED_METERS.length)]!;
  const wh = Math.round((meter.cap / 12) * (0.2 + rng() * 0.75));
  const rejected = rng() < 0.1;
  const rewarded = meter.kind === 'Solar' || meter.kind === 'Wind';
  return {
    id: seed,
    meter: meter.m,
    kind: meter.kind,
    color: meter.color,
    whNum: rejected ? 0 : wh,
    wh: `${fmt(wh, 0)} Wh`,
    status: rejected ? REJECTIONS[seed % 3]! : rewarded ? `+${fmt(wh / 1000, 3)} GRID` : 'verified',
    statusColor: rejected ? '#FF7A7A' : rewarded ? '#7BE0A6' : '#8A90A3',
    ok: !rejected,
  };
}

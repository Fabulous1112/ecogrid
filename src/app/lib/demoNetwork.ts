import type {
  Activity,
  Agent,
  LiveEvent,
  Market,
  Meter,
  MeterKind,
  NewMeter,
  Reading,
  RejectionCode,
  Series,
  Stats,
  Status,
} from './types';

// An in-browser stand-in for the gateway: a small fleet of meters and AI agents that
// produce readings, rejections and data-plan purchases on a timer. It follows the same
// rules as the contracts (only solar and wind are rewarded, 1 GRID per kWh, 50/30/20 split)
// so the dashboard behaves the same in demo mode as against a real gateway.

const SEED_METERS: { kind: MeterKind; label: string; capacityW: number; x: number; z: number }[] = [
  { kind: 'solar', label: 'Rooftop Solar A', capacityW: 6_000, x: -6, z: -3 },
  { kind: 'solar', label: 'Community Solar', capacityW: 25_000, x: -3, z: 6 },
  { kind: 'wind', label: 'Ridge Turbine', capacityW: 10_000, x: 6, z: -5 },
  { kind: 'battery', label: 'Hub Battery', capacityW: 12_000, x: 5, z: 4 },
  { kind: 'ev', label: 'EV Depot', capacityW: 22_000, x: 0, z: -8 },
];

const SEED_AGENTS = [
  {
    label: 'Helios Trading Bot',
    plan: 'Pro',
    tier: 2,
    price: 20_000,
    endpoints: ['readings', 'stream', 'aggregates'],
  },
  {
    label: 'ClimateNet Model',
    plan: 'Builder',
    tier: 1,
    price: 2_000,
    endpoints: ['aggregates', 'meters'],
  },
  {
    label: 'CarbonLedger Accountant',
    plan: 'Builder',
    tier: 1,
    price: 2_000,
    endpoints: ['readings', 'aggregates'],
  },
  {
    label: 'GridSense Forecaster',
    plan: 'Builder',
    tier: 1,
    price: 2_000,
    endpoints: ['aggregates', 'stream'],
  },
];

/** 1 GRID (1e18 wei) per kWh = 1e15 wei per Wh, the launch-year emission rate. */
export const WEI_PER_WH = 10n ** 15n;
export const EMISSION_FACTOR_KG_PER_KWH = 0.4;
/** Length of one simulated "day" of sunlight, so the demo shows a full solar curve quickly. */
const SOLAR_CYCLE_MS = 600_000;

type Rng = () => number;

interface SimMeter extends Meter {
  sim: { wind: number; soc: number; ev: number };
}

interface SimAgent extends Agent {
  price: number;
  endpoints: string[];
}

const hex = (rng: Rng, length: number) =>
  Array.from({ length }, () => Math.floor(rng() * 16).toString(16)).join('');

export const isRewardable = (kind: MeterKind) => kind === 'solar' || kind === 'wind';

export class DemoNetwork {
  private listeners = new Set<(e: LiveEvent) => void>();
  private rejections: Partial<Record<RejectionCode, number>> = {
    exceeds_capacity: 1,
    overlaps_previous: 2,
  };
  private log: Activity[] = [];
  private readings: Reading[] = [];
  private meters: SimMeter[];
  private agents: SimAgent[];
  private market = { spent: 0, recycled: 0, burned: 0, treasury: 0 };
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private rng: Rng = Math.random,
    now = Date.now(),
  ) {
    const address = () => `0x${hex(this.rng, 40)}`;
    this.meters = SEED_METERS.map(({ x, z, ...m }) => ({
      ...m,
      location: { x, z },
      address: address(),
      payout: address(),
      rewardable: isRewardable(m.kind),
      active: true,
      registeredAt: Math.floor(now / 1000) - 3600,
      lastPeriodEnd: Math.floor(now / 1000),
      lastSeenAt: now,
      lastPowerW: 0,
      totalWh: '0',
      totalRewardWei: '0',
      readings: 0,
      telemetry: m.kind === 'battery' ? { socPct: 62, unverified: true } : {},
      sim: { wind: 0.55, soc: 0.62, ev: 0.5 },
    }));
    this.agents = SEED_AGENTS.map((a) => ({
      ...a,
      address: address(),
      queries: Math.floor(200 + this.rng() * 900),
      lastQueryAt: now - 5_000,
      lastEndpoint: a.endpoints[0],
      until: now / 1000 + 25 * 86_400,
    }));
    for (const agent of this.agents) this.pay(agent, now - 3_000_000, false);
    // Back-fill the last 30 minutes so charts aren't empty on first load.
    for (let t = now - 30 * 60_000; t < now; t += 20_000) this.step(t, 20, false);
  }

  start(intervalMs = 3_000) {
    this.stop();
    this.timer = setInterval(() => this.step(Date.now(), intervalMs / 1000, true), intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(listener: (e: LiveEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: LiveEvent) {
    for (const l of this.listeners) l(event);
  }

  private record(a: Activity) {
    this.log.push(a);
    if (this.log.length > 300) this.log.shift();
  }

  /** Instantaneous output in watts for one meter at time `t`. */
  private power(m: SimMeter, t: number): number {
    const sun = Math.max(0, Math.sin(((t / SOLAR_CYCLE_MS) % 1) * Math.PI * 2));
    const s = m.sim;
    switch (m.kind) {
      case 'solar':
        return m.capacityW * 0.9 * sun * (0.85 + this.rng() * 0.15);
      case 'wind':
        s.wind = Math.min(1, Math.max(0.05, s.wind + (this.rng() - 0.5) * 0.15));
        return m.capacityW * 0.95 * s.wind ** 2;
      case 'battery': {
        const discharging = sun < 0.2 && s.soc > 0.1;
        s.soc = Math.min(1, Math.max(0.05, s.soc + (discharging ? -0.01 : sun * 0.01)));
        m.telemetry = { socPct: Math.round(s.soc * 100), unverified: true };
        return discharging ? m.capacityW * 0.6 : 0;
      }
      case 'ev':
        if (this.rng() < 0.12) s.ev = s.ev ? 0 : 0.4 + this.rng() * 0.55;
        return m.capacityW * s.ev;
    }
  }

  private step(t: number, seconds: number, live: boolean) {
    for (const m of this.meters) {
      if (!m.active) continue;
      const watts = this.power(m, t);
      const wh = Math.floor((watts * seconds) / 3600);
      const reward = m.rewardable ? BigInt(wh) * WEI_PER_WH : 0n;
      m.lastPowerW = Math.round(watts);
      m.lastSeenAt = t;
      m.totalWh = (BigInt(m.totalWh) + BigInt(wh)).toString();
      m.totalRewardWei = (BigInt(m.totalRewardWei) + reward).toString();
      m.readings++;
      const reading: Reading = {
        meter: m.address,
        label: m.label,
        kind: m.kind,
        periodEnd: Math.floor(t / 1000),
        energyWh: String(wh),
        powerW: m.lastPowerW,
        rewardWei: reward.toString(),
        onchain: m.rewardable,
        txHash: m.rewardable ? `0x${hex(this.rng, 64)}` : null,
        telemetry: m.telemetry,
      };
      this.readings.push(reading);
      if (this.readings.length > 3_000) this.readings.shift();
      this.record({
        type: 'reading.accepted',
        at: t,
        meter: m.address,
        label: m.label,
        kind: m.kind,
        energyWh: reading.energyWh,
        rewardWei: reading.rewardWei,
        txHash: reading.txHash,
        onchain: reading.onchain,
      });
      if (live) this.emit({ type: 'reading', data: reading });
    }
    if (!live) return;
    this.agentStep(t);
    if (this.rng() < 0.08) {
      const m = this.meters[Math.floor(this.rng() * this.meters.length)]!;
      const code: RejectionCode = this.rng() < 0.5 ? 'overlaps_previous' : 'bad_signature';
      this.rejections[code] = (this.rejections[code] ?? 0) + 1;
      this.record({ type: 'reading.rejected', at: t, meter: m.address, label: m.label, code });
      this.emit({ type: 'rejection', data: { meter: m.address, label: m.label, code } });
    }
  }

  private pay(agent: SimAgent, at: number, live: boolean) {
    const price = agent.price;
    this.market.spent += price;
    this.market.recycled += price * 0.5;
    this.market.burned += price * 0.3;
    this.market.treasury += price * 0.2;
    const wei = (grid: number) => (BigInt(Math.round(grid)) * 10n ** 18n).toString();
    const event = {
      type: 'agent.subscribed' as const,
      at,
      agent: agent.address,
      label: agent.label,
      plan: agent.plan ?? 'Builder',
      paidWei: wei(price),
      recycledWei: wei(price * 0.5),
      burnedWei: wei(price * 0.3),
      txHash: `0x${hex(this.rng, 64)}`,
    };
    this.record(event);
    if (live) this.emit({ type: 'agent.subscribed', data: event });
  }

  private agentStep(t: number) {
    for (const a of this.agents) {
      if (this.rng() >= 0.55) continue;
      a.queries++;
      a.lastQueryAt = t;
      a.lastEndpoint = a.endpoints[Math.floor(this.rng() * a.endpoints.length)];
      this.emit({
        type: 'agent.query',
        data: { agent: a.address, label: a.label, endpoint: a.lastEndpoint ?? 'data', at: t },
      });
    }
    if (this.rng() < 0.07) {
      this.pay(this.agents[Math.floor(this.rng() * this.agents.length)]!, t, true);
    }
  }

  status(): Status {
    return {
      ok: true,
      demo: true,
      chain: { mode: 'demo', ok: true, blockNumber: 0 },
      meters: this.stats().meters,
    };
  }

  stats(now = Date.now()): Stats {
    let generated = 0;
    let consumed = 0;
    let discharged = 0;
    let rewardWei = 0n;
    let accepted = 0;
    for (const m of this.meters) {
      const kWh = Number(m.totalWh) / 1000;
      if (isRewardable(m.kind)) generated += kWh;
      else if (m.kind === 'ev') consumed += kWh;
      else discharged += kWh;
      rewardWei += BigInt(m.totalRewardWei);
      accepted += m.readings;
    }
    const rejected = Object.values(this.rejections).reduce((a, b) => a + b, 0);
    return {
      meters: {
        total: this.meters.length,
        active: this.meters.filter((m) => m.active).length,
        online: this.meters.filter((m) => m.lastSeenAt !== null && now - m.lastSeenAt < 60_000)
          .length,
      },
      energy: {
        generatedKWh: generated,
        consumedKWh: consumed,
        batteryDischargedKWh: discharged,
        livePowerW: this.meters.filter((m) => m.rewardable).reduce((a, m) => a + m.lastPowerW, 0),
      },
      rewards: { totalGrid: String(Number(rewardWei) / 1e18) },
      verification: {
        acceptedReadings: accepted,
        rejectedReadings: rejected,
        acceptanceRate: accepted / (accepted + rejected),
        rejectionsByReason: { ...this.rejections },
      },
      impact: {
        estimatedCo2AvoidedKg: generated * EMISSION_FACTOR_KG_PER_KWH,
        emissionFactorKgPerKWh: EMISSION_FACTOR_KG_PER_KWH,
        isEstimate: true,
      },
    };
  }

  timeseries({ minutes = 30, bucketSec = 60 } = {}, now = Date.now()): Series {
    const start = Math.floor(now / 1000) - minutes * 60;
    const count = Math.ceil((minutes * 60) / bucketSec);
    const buckets = Array.from({ length: count }, (_, i) => ({
      t: start + i * bucketSec,
      solar: 0,
      wind: 0,
      battery: 0,
      ev: 0,
    }));
    for (const r of this.readings) {
      const i = Math.floor((r.periodEnd - start) / bucketSec);
      const bucket = buckets[i];
      if (bucket) bucket[r.kind] += Number(r.energyWh);
    }
    return { bucketSec, unit: 'Wh', buckets };
  }

  listMeters(): Meter[] {
    return this.meters.map(({ sim: _sim, ...m }) => ({ ...m }));
  }

  listActivity(limit = 40): Activity[] {
    return this.log.slice(-limit).reverse();
  }

  listAgents(): Agent[] {
    return this.agents.map(({ endpoints: _e, price: _p, ...a }) => ({ ...a }));
  }

  marketSummary(): Market {
    const g = (n: number) => n.toFixed(1);
    return {
      available: true,
      plans: [
        { id: 0, name: 'Builder', priceGrid: '2000.0', periodDays: 30, tier: 1, active: true },
        { id: 1, name: 'Pro', priceGrid: '20000.0', periodDays: 30, tier: 2, active: true },
      ],
      split: { recycleBps: 5000, burnBps: 3000, treasuryBps: 2000 },
      totals: {
        spentGrid: g(this.market.spent),
        recycledToProducersGrid: g(this.market.recycled),
        burnedGrid: g(this.market.burned),
        treasuryGrid: g(this.market.treasury),
      },
      agents: {
        active: this.agents.length,
        seen: this.agents.length,
        queriesTotal: this.agents.reduce((a, x) => a + x.queries, 0),
        activeLast24h: this.agents.length,
      },
    };
  }

  registerMeter(input: NewMeter, now = Date.now()): Meter {
    if (this.meters.some((m) => m.address.toLowerCase() === input.address.toLowerCase())) {
      throw new Error('That meter address is already registered.');
    }
    const meter: SimMeter = {
      ...input,
      label: input.label || `${input.kind}-${input.address.slice(2, 8)}`,
      rewardable: isRewardable(input.kind),
      active: true,
      registeredAt: Math.floor(now / 1000),
      lastPeriodEnd: Math.floor(now / 1000),
      lastSeenAt: now,
      lastPowerW: 0,
      totalWh: '0',
      totalRewardWei: '0',
      readings: 0,
      telemetry: {},
      sim: { wind: 0.4, soc: 0.5, ev: 0 },
    };
    this.meters.push(meter);
    this.record({
      type: 'meter.registered',
      at: now,
      meter: meter.address,
      label: meter.label,
      kind: meter.kind,
    });
    const { sim: _sim, ...publicMeter } = meter;
    this.emit({ type: 'meter', data: publicMeter });
    return publicMeter;
  }

  simulateNow() {
    this.step(Date.now(), 5, true);
  }
}

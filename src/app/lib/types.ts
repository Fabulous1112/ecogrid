// Shapes shared by the demo simulator, the gateway client and the UI.
// Large on-chain amounts (Wh totals, wei) travel as decimal strings so they never lose precision.

export type MeterKind = 'solar' | 'wind' | 'battery' | 'ev';

export interface Meter {
  address: string;
  payout: string;
  kind: MeterKind;
  label: string;
  capacityW: number;
  rewardable: boolean;
  active: boolean;
  registeredAt: number;
  lastPeriodEnd: number;
  lastSeenAt: number | null;
  lastPowerW: number;
  totalWh: string;
  totalRewardWei: string;
  readings: number;
  telemetry: { socPct?: number; unverified?: boolean };
  location?: { x: number; z: number };
}

export interface Agent {
  address: string;
  label: string;
  plan?: string;
  tier?: number;
  queries: number;
  lastQueryAt: number | null;
  lastEndpoint?: string;
  until?: number;
}

export type RejectionCode =
  | 'bad_signature'
  | 'overlaps_previous'
  | 'exceeds_capacity'
  | 'period_in_future'
  | 'unknown_meter'
  | 'meter_inactive'
  | 'bad_period';

export type Activity =
  | {
      type: 'reading.accepted';
      at: number;
      meter: string;
      label: string;
      kind: MeterKind;
      energyWh: string;
      rewardWei: string;
      txHash: string | null;
      onchain: boolean;
    }
  | { type: 'reading.rejected'; at: number; meter: string; label: string; code: RejectionCode }
  | {
      type: 'agent.subscribed';
      at: number;
      agent: string;
      label: string;
      plan: string;
      paidWei: string;
      recycledWei: string;
      burnedWei: string;
      txHash: string;
    }
  | { type: 'meter.registered'; at: number; meter: string; label: string; kind: MeterKind }
  | { type: 'meter.revoked'; at: number; meter: string; label: string };

export interface Reading {
  meter: string;
  label: string;
  kind: MeterKind;
  periodEnd: number;
  energyWh: string;
  powerW: number;
  rewardWei: string;
  onchain: boolean;
  txHash: string | null;
  telemetry: Meter['telemetry'];
}

export interface Status {
  ok: boolean;
  demo?: boolean;
  chain: { mode: 'demo' | 'simulated' | 'evm'; ok: boolean; blockNumber: number };
  meters: Stats['meters'];
}

export interface Stats {
  meters: { total: number; active: number; online: number };
  energy: {
    generatedKWh: number;
    consumedKWh: number;
    batteryDischargedKWh: number;
    livePowerW: number;
  };
  rewards: { totalGrid: string };
  verification: {
    acceptedReadings: number;
    rejectedReadings: number;
    acceptanceRate: number;
    rejectionsByReason: Partial<Record<RejectionCode, number>>;
  };
  impact: { estimatedCo2AvoidedKg: number; emissionFactorKgPerKWh: number; isEstimate: boolean };
}

export interface SeriesBucket {
  t: number;
  solar: number;
  wind: number;
  battery: number;
  ev: number;
}

export interface Series {
  bucketSec: number;
  unit: 'Wh';
  buckets: SeriesBucket[];
}

export interface Plan {
  id: number;
  name: string;
  priceGrid: string;
  periodDays: number;
  tier: number;
  active: boolean;
}

export interface Market {
  available: boolean;
  plans?: Plan[];
  split?: { recycleBps: number; burnBps: number; treasuryBps: number };
  totals?: {
    spentGrid: string;
    recycledToProducersGrid: string;
    burnedGrid: string;
    treasuryGrid: string;
  };
  agents?: { active: number; seen: number; queriesTotal: number; activeLast24h: number };
}

export interface NewMeter {
  address: string;
  kind: MeterKind;
  label?: string;
  capacityW: number;
  payout: string;
}

export type LiveEvent =
  | { type: 'reading'; data: Reading }
  | { type: 'rejection'; data: { meter: string; label: string; code: RejectionCode } }
  | { type: 'agent.query'; data: { agent: string; label: string; endpoint: string; at: number } }
  | { type: 'agent.subscribed'; data: Extract<Activity, { type: 'agent.subscribed' }> }
  | { type: 'meter'; data: Meter };

/** Everything the dashboard needs from a data source, demo or live. */
export interface GridClient {
  mode: 'demo' | 'live';
  /** True when a gateway URL was configured but unreachable, so we fell back to demo data. */
  fellBack: boolean;
  status(): Promise<Status>;
  stats(): Promise<Stats>;
  timeseries(opts: { minutes: number; bucketSec: number }): Promise<Series>;
  meters(): Promise<Meter[]>;
  activity(limit: number): Promise<Activity[]>;
  market(): Promise<Market>;
  agents(): Promise<Agent[]>;
  registerMeter(meter: NewMeter, adminToken?: string): Promise<Meter>;
  simulateNow(): Promise<void>;
  subscribe(
    onEvent: (e: LiveEvent) => void,
    onConnected?: (connected: boolean) => void,
  ): () => void;
}

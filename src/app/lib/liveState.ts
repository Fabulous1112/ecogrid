import type { Activity, Agent, LiveEvent, Market, Meter, Series, Stats, Status } from './types';

export interface LiveState {
  status: Status | null;
  stats: Stats | null;
  series: Series | null;
  meters: Meter[];
  activity: Activity[];
  market: Market | null;
  agents: Agent[];
  connected: boolean;
  /** Last time each meter / agent did something, used to flash it in the 3D view. */
  pulses: Record<string, number>;
  agentPulses: Record<string, number>;
  error: string | null;
}

export const initialLiveState: LiveState = {
  status: null,
  stats: null,
  series: null,
  meters: [],
  activity: [],
  market: null,
  agents: [],
  connected: false,
  pulses: {},
  agentPulses: {},
  error: null,
};

const ACTIVITY_LIMIT = 40;

/** Applies one streamed event to the dashboard state. Pure, so it is unit-tested. */
export function applyEvent(state: LiveState, event: LiveEvent, now = Date.now()): LiveState {
  switch (event.type) {
    case 'reading': {
      const r = event.data;
      const meters = state.meters.map((m) =>
        m.address === r.meter
          ? {
              ...m,
              lastPowerW: r.powerW,
              lastSeenAt: now,
              telemetry: r.telemetry ?? m.telemetry,
              totalWh: (BigInt(m.totalWh) + BigInt(r.energyWh)).toString(),
              totalRewardWei: (BigInt(m.totalRewardWei) + BigInt(r.rewardWei || '0')).toString(),
            }
          : m,
      );
      const entry: Activity = {
        type: 'reading.accepted',
        at: now,
        meter: r.meter,
        label: r.label,
        kind: r.kind,
        energyWh: r.energyWh,
        rewardWei: r.rewardWei,
        txHash: r.txHash,
        onchain: r.onchain,
      };
      return {
        ...state,
        meters,
        activity: [entry, ...state.activity].slice(0, ACTIVITY_LIMIT),
        pulses: { ...state.pulses, [r.meter]: now },
      };
    }
    case 'rejection': {
      const entry: Activity = { type: 'reading.rejected', at: now, ...event.data };
      return { ...state, activity: [entry, ...state.activity].slice(0, ACTIVITY_LIMIT) };
    }
    case 'agent.query': {
      const q = event.data;
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.address === q.agent
            ? { ...a, queries: a.queries + 1, lastQueryAt: now, lastEndpoint: q.endpoint }
            : a,
        ),
        agentPulses: { ...state.agentPulses, [q.agent]: now },
      };
    }
    case 'agent.subscribed': {
      const s = event.data;
      const known = state.agents.some((a) => a.address === s.agent);
      return {
        ...state,
        agents: known
          ? state.agents
          : [...state.agents, { address: s.agent, label: s.label, queries: 0, lastQueryAt: now }],
        activity: [{ ...s, at: now }, ...state.activity].slice(0, ACTIVITY_LIMIT),
      };
    }
    case 'meter': {
      const m = event.data;
      const known = state.meters.some((x) => x.address === m.address);
      return {
        ...state,
        meters: known
          ? state.meters.map((x) => (x.address === m.address ? { ...x, ...m } : x))
          : [...state.meters, m],
      };
    }
  }
}

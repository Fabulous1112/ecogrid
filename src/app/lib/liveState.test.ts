import { describe, expect, it } from 'vitest';
import { applyEvent, initialLiveState, type LiveState } from './liveState';
import type { Meter } from './types';

const meter: Meter = {
  address: '0xmeter',
  payout: '0xpayout',
  kind: 'solar',
  label: 'Roof',
  capacityW: 5000,
  rewardable: true,
  active: true,
  registeredAt: 0,
  lastPeriodEnd: 0,
  lastSeenAt: null,
  lastPowerW: 0,
  totalWh: '1000',
  totalRewardWei: '5',
  readings: 1,
  telemetry: {},
};

const base: LiveState = {
  ...initialLiveState,
  meters: [meter],
  agents: [{ address: '0xagent', label: 'Bot', queries: 3, lastQueryAt: null }],
};

describe('applyEvent', () => {
  it('adds a reading to its meter using exact integer maths', () => {
    const s = applyEvent(
      base,
      {
        type: 'reading',
        data: {
          meter: '0xmeter',
          label: 'Roof',
          kind: 'solar',
          periodEnd: 1,
          energyWh: '250',
          powerW: 3000,
          rewardWei: '9007199254740993',
          onchain: true,
          txHash: '0xtx',
          telemetry: {},
        },
      },
      1234,
    );
    expect(s.meters[0]).toMatchObject({
      lastPowerW: 3000,
      lastSeenAt: 1234,
      totalWh: '1250',
      totalRewardWei: '9007199254740998',
    });
    expect(s.activity[0]).toMatchObject({ type: 'reading.accepted', energyWh: '250' });
    expect(s.pulses['0xmeter']).toBe(1234);
  });

  it('logs rejections without touching meters', () => {
    const s = applyEvent(
      base,
      { type: 'rejection', data: { meter: '0xmeter', label: 'Roof', code: 'bad_signature' } },
      1,
    );
    expect(s.meters).toBe(base.meters);
    expect(s.activity[0]).toMatchObject({ type: 'reading.rejected', code: 'bad_signature' });
  });

  it('counts agent queries and adds newly subscribed agents', () => {
    let s = applyEvent(
      base,
      { type: 'agent.query', data: { agent: '0xagent', label: 'Bot', endpoint: 'stream', at: 1 } },
      5,
    );
    expect(s.agents[0]).toMatchObject({ queries: 4, lastEndpoint: 'stream', lastQueryAt: 5 });
    s = applyEvent(
      s,
      {
        type: 'agent.subscribed',
        data: {
          type: 'agent.subscribed',
          at: 1,
          agent: '0xnew',
          label: 'New',
          plan: 'Pro',
          paidWei: '1',
          recycledWei: '1',
          burnedWei: '0',
          txHash: '0x',
        },
      },
      6,
    );
    expect(s.agents.map((a) => a.address)).toEqual(['0xagent', '0xnew']);
  });

  it('caps the activity log at 40 entries', () => {
    let s = base;
    for (let i = 0; i < 60; i++)
      s = applyEvent(
        s,
        { type: 'rejection', data: { meter: '0xmeter', label: 'Roof', code: 'bad_period' } },
        i,
      );
    expect(s.activity).toHaveLength(40);
    expect(s.activity[0]!.at).toBe(59);
  });

  it('upserts meters', () => {
    const updated = applyEvent(base, { type: 'meter', data: { ...meter, label: 'Renamed' } });
    expect(updated.meters).toHaveLength(1);
    expect(updated.meters[0]!.label).toBe('Renamed');
    const added = applyEvent(base, { type: 'meter', data: { ...meter, address: '0xother' } });
    expect(added.meters).toHaveLength(2);
  });
});

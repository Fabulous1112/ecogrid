import { DemoNetwork } from './demoNetwork';
import type { GridClient, LiveEvent, NewMeter } from './types';

/** Error from the gateway, carrying its machine-readable `code` (e.g. `admin_auth`). */
export class GatewayError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

export const GATEWAY_URL = (import.meta.env.VITE_GATEWAY_URL ?? '').replace(/\/$/, '');

/**
 * Picks the data source: a live gateway when `VITE_GATEWAY_URL` is set and answers,
 * otherwise the in-browser demo network.
 */
export async function createClient(gatewayUrl = GATEWAY_URL): Promise<GridClient> {
  if (!gatewayUrl) return createDemoClient(false);
  const live = createGatewayClient(gatewayUrl);
  try {
    await live.status();
    return live;
  } catch {
    return createDemoClient(true);
  }
}

export function createDemoClient(fellBack: boolean): GridClient {
  const net = new DemoNetwork();
  net.start(3_000);
  const later = <T>(fn: () => T) => Promise.resolve().then(fn);
  return {
    mode: 'demo',
    fellBack,
    status: () => later(() => net.status()),
    stats: () => later(() => net.stats()),
    timeseries: (opts) => later(() => net.timeseries(opts)),
    meters: () => later(() => net.listMeters()),
    activity: (limit) => later(() => net.listActivity(limit)),
    market: () => later(() => net.marketSummary()),
    agents: () => later(() => net.listAgents()),
    registerMeter: (meter) => later(() => net.registerMeter(meter)),
    simulateNow: () => later(() => net.simulateNow()),
    subscribe(onEvent, onConnected) {
      onConnected?.(true);
      return net.subscribe(onEvent);
    },
  };
}

/** Client for the EcoGrid gateway's public REST API and server-sent event stream. */
export function createGatewayClient(baseUrl: string): GridClient {
  const api = `${baseUrl}/api/v1`;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${api}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new GatewayError(
        body?.error?.message ?? `Gateway returned ${res.status}`,
        body?.error?.code,
      );
    }
    return body as T;
  }

  return {
    mode: 'live',
    fellBack: false,
    status: () => request('/status'),
    stats: () => request('/stats'),
    timeseries: ({ minutes, bucketSec }) =>
      request(`/timeseries?minutes=${minutes}&bucketSec=${bucketSec}`),
    meters: () => request('/meters'),
    activity: (limit) => request(`/activity?limit=${limit}`),
    market: () => request('/market'),
    agents: () => request('/agents'),
    registerMeter: (meter: NewMeter, adminToken?: string) =>
      request('/meters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify(meter),
      }),
    simulateNow: () => request('/simulate', { method: 'POST' }),
    subscribe(onEvent, onConnected) {
      const source = new EventSource(`${api}/stream`);
      const types: LiveEvent['type'][] = [
        'reading',
        'rejection',
        'agent.query',
        'agent.subscribed',
        'meter',
      ];
      for (const type of types) {
        source.addEventListener(type, (e) => {
          try {
            onEvent({ type, data: JSON.parse((e as MessageEvent<string>).data) } as LiveEvent);
          } catch {
            // Ignore malformed events rather than breaking the stream.
          }
        });
      }
      source.onopen = () => onConnected?.(true);
      source.onerror = () => onConnected?.(false);
      return () => source.close();
    },
  };
}

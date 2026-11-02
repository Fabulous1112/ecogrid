import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '../lib/client';
import { applyEvent, initialLiveState, type LiveState } from '../lib/liveState';
import type { GridClient } from '../lib/types';

const REFRESH_MS = 10_000;

/** Connects to the gateway (or demo network), loads a snapshot and keeps it live. */
export function useLiveData(): LiveState & {
  client: GridClient | null;
  refresh: () => Promise<void>;
} {
  const [client, setClient] = useState<GridClient | null>(null);
  const [state, setState] = useState<LiveState>(initialLiveState);
  const clientRef = useRef<GridClient | null>(null);

  const refresh = useCallback(async (c: GridClient | null = clientRef.current) => {
    if (!c) return;
    try {
      const [status, stats, series, meters, activity, market, agents] = await Promise.all([
        c.status(),
        c.stats(),
        c.timeseries({ minutes: 30, bucketSec: 60 }),
        c.meters(),
        c.activity(40),
        c.market().catch(() => ({ available: false })),
        c.agents().catch(() => []),
      ]);
      setState((s) => ({
        ...s,
        status,
        stats,
        series,
        meters,
        activity,
        market,
        agents,
        error: null,
      }));
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }));
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    let alive = true;
    void createClient().then((c) => {
      if (!alive) return;
      clientRef.current = c;
      setClient(c);
      void refresh(c);
      unsubscribe = c.subscribe(
        (event) => setState((s) => applyEvent(s, event)),
        (connected) => setState((s) => ({ ...s, connected })),
      );
    });
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => {
      alive = false;
      unsubscribe();
      clearInterval(timer);
    };
  }, [refresh]);

  return { ...state, client, refresh: () => refresh() };
}

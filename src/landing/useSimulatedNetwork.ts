import { useEffect, useState } from 'react';
import { randomReading, type FeedRow } from './protocol';

/** Live-looking numbers for the hero chips and the network panel, all simulated client-side. */
export function useSimulatedNetwork() {
  const [state, setState] = useState(() => ({
    feed: Array.from({ length: 7 }, (_, i) => randomReading(i)) as FeedRow[],
    seq: 7,
    kwh: 18342.6,
    readings: 2841,
    accepted: 2803,
    solarKw: 18.4,
    windKw: 6.2,
  }));
  useEffect(() => {
    const timer = setInterval(() => {
      setState((s) => {
        const r = randomReading(s.seq);
        return {
          feed: [r, ...s.feed].slice(0, 7),
          seq: s.seq + 1,
          kwh: s.kwh + r.whNum / 1000,
          readings: s.readings + 1,
          accepted: s.accepted + (r.ok ? 1 : 0),
          solarKw: Math.max(2, Math.min(31, s.solarKw + (Math.random() - 0.5) * 2)),
          windKw: Math.max(0.5, Math.min(9.5, s.windKw + (Math.random() - 0.5) * 1.2)),
        };
      });
    }, 1600);
    return () => clearInterval(timer);
  }, []);
  return state;
}

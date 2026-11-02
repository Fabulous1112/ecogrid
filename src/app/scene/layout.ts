import type { Meter } from '../lib/types';

/** Places meters at their saved location, or evenly on a ring around the hub. */
export function layoutMeters(meters: Pick<Meter, 'location'>[]): [number, number, number][] {
  return meters.map((m, i) => {
    if (m.location) return [m.location.x, 0, m.location.z];
    const a = (i / Math.max(1, meters.length)) * Math.PI * 2 + 0.4;
    return [Math.cos(a) * 7.5, 0, Math.sin(a) * 7.5];
  });
}

import type { Series } from './types';

export const CHART_W = 340;
export const CHART_H = 140;
export const CHART_PAD = { l: 34, r: 8, t: 8, b: 20 };
export const STACK = ['solar', 'wind', 'battery'] as const;

/** Stacked areas of average kW per bucket for the output chart. */
export function buildChart(series: Series | null) {
  const buckets = series?.buckets ?? [];
  const toKw = (wh: number) => (wh * 3600) / (series?.bucketSec || 60) / 1000;
  const stacks = buckets.map((b) => {
    let top = 0;
    return STACK.map((k) => [top, (top += toKw(b[k]))] as const);
  });
  const max = Math.max(1, ...stacks.map((s) => s[s.length - 1]![1])) * 1.1;
  const x = (i: number) =>
    CHART_PAD.l + (i / Math.max(1, buckets.length - 1)) * (CHART_W - CHART_PAD.l - CHART_PAD.r);
  const y = (v: number) =>
    CHART_H - CHART_PAD.b - (v / max) * (CHART_H - CHART_PAD.t - CHART_PAD.b);
  const paths = STACK.map((_, k) => {
    if (!buckets.length) return '';
    const upper = stacks.map((s, i) => `${x(i)},${y(s[k]![1])}`);
    const lower = stacks.map((s, i) => `${x(i)},${y(s[k]![0])}`).reverse();
    return `M${upper.join('L')}L${lower.join('L')}Z`;
  });
  const step = max > 20 ? 10 : max > 8 ? 4 : max > 4 ? 2 : 1;
  const ticks: { v: number; y: number }[] = [];
  for (let v = 0; v <= max; v += step) ticks.push({ v, y: y(v) });
  return { paths, max, ticks, minutes: buckets.length };
}

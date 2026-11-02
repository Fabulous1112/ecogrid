import { useMemo } from 'react';
import { buildChart, CHART_H as H, CHART_PAD as PAD, CHART_W as W, STACK } from '../lib/chart';
import { KINDS, REJECTION_TEXT } from '../lib/format';
import type { RejectionCode, Series, Stats } from '../lib/types';

function OutputChart({ series }: { series: Series | null }) {
  const { paths, max, ticks, minutes } = useMemo(() => buildChart(series), [series]);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Generation over the last ${minutes} minutes, peak scale ${max.toFixed(1)} kilowatts`}
    >
      {ticks.map((t) => (
        <g key={t.v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#21454D" strokeWidth="1" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize="11" fill="#6E918B">
            {t.v}
          </text>
        </g>
      ))}
      {paths.map((d, i) => (
        <path
          key={STACK[i]}
          d={d}
          fill={KINDS[STACK[i]!].color}
          fillOpacity="0.55"
          stroke={KINDS[STACK[i]!].color}
          strokeWidth="1"
        />
      ))}
      <text x={PAD.l} y={H - 4} fontSize="11" fill="#6E918B">
        {minutes} min ago
      </text>
      <text x={W - PAD.r} y={H - 4} textAnchor="end" fontSize="11" fill="#6E918B">
        now
      </text>
    </svg>
  );
}

export function AnalyticsPanel({ stats, series }: { stats: Stats | null; series: Series | null }) {
  const v = stats?.verification;
  const reasons = Object.entries(v?.rejectionsByReason ?? {}).sort(
    (a, b) => (b[1] ?? 0) - (a[1] ?? 0),
  );
  return (
    <section className="panel p-4 sm:p-5" aria-labelledby="analytics-heading">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="analytics-heading" className="font-display text-lg font-bold">
          Energy output
        </h2>
        <span className="text-xs text-ink-faint">average kW per minute</span>
      </div>
      <OutputChart series={series} />
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        {STACK.map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: KINDS[k].color }}
              aria-hidden="true"
            />
            {k === 'battery' ? 'Battery discharge' : KINDS[k].label}
          </li>
        ))}
      </ul>

      <h3 className="mb-2 mt-5 font-display text-lg font-bold">Verification</h3>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-extrabold text-ok">
            {v ? `${(v.acceptanceRate * 100).toFixed(1)}%` : '…'}
          </p>
          <p className="text-sm text-ink-muted">
            of readings passed signature, ordering and capacity checks
          </p>
        </div>
        <p className="shrink-0 text-right text-sm text-ink-muted">
          {v ? v.acceptedReadings.toLocaleString() : '…'} accepted
          <br />
          {v ? v.rejectedReadings.toLocaleString() : '…'} rejected
        </p>
      </div>
      {reasons.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {reasons.slice(0, 4).map(([code, count]) => (
            <li key={code} className="flex justify-between gap-3 text-ink-muted">
              <span>{REJECTION_TEXT[code as RejectionCode] ?? code}</span>
              <span className="text-ink">{count}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 rounded-tile border border-dashed border-night-line p-3">
        <p className="text-sm text-ink-muted">Estimated CO₂ avoided</p>
        <p className="font-display text-2xl font-bold">
          {stats
            ? `${stats.impact.estimatedCo2AvoidedKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`
            : '…'}
        </p>
        <p className="mt-1 text-xs leading-snug text-ink-faint">
          Generated kWh × {stats?.impact.emissionFactorKgPerKWh ?? 0.4} kg/kWh grid average. An
          estimate for context only, not a verified offset or carbon credit.
        </p>
      </div>
    </section>
  );
}

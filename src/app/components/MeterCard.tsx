import {
  formatEnergy,
  formatGrid,
  formatPower,
  isOnline,
  KINDS,
  timeAgo,
  weiToGrid,
} from '../lib/format';
import type { Meter } from '../lib/types';

/** Details for the selected meter, shown over the 3D view on smaller screens. */
export function MeterCard({ meter, onClose }: { meter: Meter; onClose: () => void }) {
  const kind = KINDS[meter.kind] ?? KINDS.solar;
  const online = isOnline(meter);
  const ratio = online ? Math.min(1, meter.lastPowerW / meter.capacityW) : 0;
  let third: string;
  if (meter.kind === 'battery')
    third = meter.telemetry?.socPct != null ? `${meter.telemetry.socPct}%` : '—';
  else
    third = meter.rewardable
      ? `${formatGrid(weiToGrid(meter.totalRewardWei))} GRID`
      : 'Not rewarded';

  return (
    <div
      className="pointer-events-auto rounded-tile border border-night-line bg-night-deep/95 p-3 shadow-lg"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display font-bold" style={{ color: kind.color }}>
            {meter.label}
          </p>
          <p className="text-xs text-ink-faint">
            {kind.label}
            {online
              ? ''
              : meter.lastSeenAt
                ? `, last seen ${timeAgo(meter.lastSeenAt)}`
                : ', no readings yet'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center text-ink-muted"
          aria-label="Close meter details"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M3 3l10 10M13 3 3 13" />
          </svg>
        </button>
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-ink-faint">Output</dt>
          <dd className="font-bold">{formatPower(online ? meter.lastPowerW : 0)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-faint">{meter.kind === 'ev' ? 'Delivered' : 'Total'}</dt>
          <dd className="font-bold">{formatEnergy(Number(meter.totalWh) / 1000)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-faint">{meter.kind === 'battery' ? 'Charge' : 'Paid'}</dt>
          <dd className="font-bold">{third}</dd>
        </div>
      </dl>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-night-line" aria-hidden="true">
        <div
          className="h-full rounded-full"
          style={{ width: `${ratio * 100}%`, background: kind.color }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-faint">
        of {formatPower(meter.capacityW)} rated capacity
      </p>
    </div>
  );
}

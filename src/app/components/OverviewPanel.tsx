import { formatEnergy, formatGrid, formatPower, isOnline, KINDS, timeAgo } from '../lib/format';
import type { Meter, Stats } from '../lib/types';

export type ActionId = 'register' | 'log' | 'rewards' | 'api';

const ACTIONS: { id: ActionId; title: string; body: string; icon: string }[] = [
  {
    id: 'register',
    title: 'Register meter',
    body: 'Add a device key and its rated capacity',
    icon: 'M12 5v14M5 12h14',
  },
  {
    id: 'log',
    title: 'Log generation',
    body: 'Send a signed reading from a meter',
    icon: 'M13 3 5 14h6l-1 7 8-11h-6z',
  },
  {
    id: 'rewards',
    title: 'Your rewards',
    body: 'Paid to your wallet with each reading',
    icon: 'M12 3v18M7 8c0-2 2-3 5-3s5 1 5 3-2 3-5 3-5 1-5 3 2 3 5 3 5-1 5-3',
  },
];

function Stat({
  label,
  value,
  tone = 'text-ink',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className={`font-display text-lg font-bold sm:text-xl ${tone}`}>{value}</dd>
    </div>
  );
}

function meterNote(m: Meter, online: boolean): string {
  const kind = KINDS[m.kind]?.label ?? m.kind;
  const reward = m.rewardable ? '' : ', not rewarded';
  if (!m.active) return `${kind}${reward}, revoked`;
  if (online) return `${kind}${reward}`;
  return `${kind}${reward}${m.lastSeenAt ? `, last seen ${timeAgo(m.lastSeenAt)}` : ', waiting for first reading'}`;
}

export function OverviewPanel({
  stats,
  meters,
  selected,
  onSelect,
  onAction,
}: {
  stats: Stats | null;
  meters: Meter[];
  selected: string | null;
  onSelect: (address: string | null) => void;
  onAction: (id: ActionId) => void;
}) {
  const energy = stats?.energy;
  return (
    <section className="panel flex flex-col gap-5 p-4 sm:p-5" aria-labelledby="network-heading">
      <div>
        <h2 id="network-heading" className="text-sm text-ink-muted">
          Clean energy generated
        </h2>
        <p className="font-display text-[clamp(2.25rem,11vw,3rem)] font-extrabold leading-none tracking-tight text-solar">
          {energy ? formatEnergy(energy.generatedKWh) : '…'}
        </p>
        <p className="mt-1 text-sm text-ink-faint">From signed solar and wind readings only</p>
      </div>
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat
          label="Live output"
          value={energy ? formatPower(energy.livePowerW) : '…'}
          tone="text-wind"
        />
        <Stat label="$GRID paid" value={stats ? formatGrid(stats.rewards.totalGrid) : '…'} />
        <Stat
          label="Reporting"
          value={stats ? `${stats.meters.online}/${stats.meters.active}` : '…'}
        />
      </dl>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Quick actions">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onAction(a.id)}
            className="flex min-h-[88px] flex-col items-start gap-1.5 rounded-tile border border-night-line bg-night-deep/60 p-2.5 text-left transition-colors hover:border-wind sm:min-h-[96px] sm:p-3"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6FD6E8"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={a.icon} />
            </svg>
            <span className="text-sm font-bold leading-tight">{a.title}</span>
            <span className="hidden text-xs leading-snug text-ink-faint sm:block">{a.body}</span>
          </button>
        ))}
      </div>
      <div>
        <h3 className="mb-2 font-display text-lg font-bold">Meters</h3>
        {meters.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No meters yet. Register one to see it appear on the grid.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {meters.map((m) => {
              const kind = KINDS[m.kind] ?? KINDS.solar;
              const online = isOnline(m);
              const ratio = online ? Math.min(1, m.lastPowerW / m.capacityW) : 0;
              const isSelected = selected === m.address;
              return (
                <li key={m.address}>
                  <button
                    type="button"
                    onClick={() => onSelect(isSelected ? null : m.address)}
                    aria-pressed={isSelected}
                    className={`grid w-full grid-cols-[10px_1fr_auto] items-center gap-x-3 rounded-tile px-2 py-2 text-left transition-colors ${isSelected ? 'bg-night-line/60' : 'hover:bg-night-line/30'}`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: kind.color }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{m.label}</span>
                      <span className="block text-xs text-ink-faint">{meterNote(m, online)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm">
                        {formatPower(online ? m.lastPowerW : 0)}
                      </span>
                      <span
                        className="mt-1 block h-1 w-16 overflow-hidden rounded-full bg-night-line"
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${ratio * 100}%`, background: kind.color }}
                        />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

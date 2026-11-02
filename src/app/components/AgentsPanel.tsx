import { formatGrid, shortAddress, timeAgo } from '../lib/format';
import type { Agent, Market } from '../lib/types';

function Share({
  label,
  value,
  color,
  share,
}: {
  label: string;
  value: string;
  color: string;
  share: number | string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-xs text-ink-faint">
        <span className="h-2 w-2 rounded-sm" style={{ background: color }} aria-hidden="true" />
        {label} · {share}%
      </div>
      <div className="truncate font-display text-lg font-bold">{value}</div>
    </div>
  );
}

export function AgentsPanel({
  market,
  agents,
  onOpenApi,
}: {
  market: Market | null;
  agents: Agent[];
  onOpenApi: () => void;
}) {
  if (market && !market.available) {
    return (
      <section className="panel p-4 sm:p-5" aria-labelledby="agents-heading">
        <h2 id="agents-heading" className="font-display text-lg font-bold">
          AI agents
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          The data market isn’t configured on this gateway yet.
        </p>
      </section>
    );
  }
  const totals = market?.totals;
  const split = market?.split;
  const pct = (bps?: number) => (bps != null ? bps / 100 : '…');
  return (
    <section className="panel p-4 sm:p-5" aria-labelledby="agents-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="agents-heading" className="font-display text-lg font-bold">
          AI agents
        </h2>
        <button
          type="button"
          onClick={onOpenApi}
          className="text-sm font-bold text-wind underline-offset-2 hover:underline"
        >
          Agent API
        </button>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Agents pay $GRID for verified energy data. Every payment is split on-chain.
      </p>
      <div className="mt-4">
        <div className="text-sm text-ink-muted">Spent by agents</div>
        <div className="font-display text-3xl font-extrabold text-ink">
          {totals ? `${formatGrid(totals.spentGrid)} GRID` : '…'}
        </div>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full" aria-hidden="true">
        <span style={{ width: `${pct(split?.recycleBps)}%`, background: '#F2B33D' }} />
        <span style={{ width: `${pct(split?.burnBps)}%`, background: '#FF8A6B' }} />
        <span style={{ width: `${pct(split?.treasuryBps)}%`, background: '#B79CFF' }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Share
          label="Producers"
          share={pct(split?.recycleBps)}
          color="#F2B33D"
          value={totals ? formatGrid(totals.recycledToProducersGrid) : '…'}
        />
        <Share
          label="Burned"
          share={pct(split?.burnBps)}
          color="#FF8A6B"
          value={totals ? formatGrid(totals.burnedGrid) : '…'}
        />
        <Share
          label="Treasury"
          share={pct(split?.treasuryBps)}
          color="#B79CFF"
          value={totals ? formatGrid(totals.treasuryGrid) : '…'}
        />
      </div>
      <h3 className="mb-1 mt-5 text-sm text-ink-muted">
        {market?.agents ? `${market.agents.active} agents with active plans` : 'Agents'}
      </h3>
      {agents.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No agents yet. The first one to buy a plan shows up here.
        </p>
      ) : (
        <ul className="flex flex-col">
          {agents.slice(0, 6).map((a) => (
            <li
              key={a.address}
              className="grid grid-cols-[10px_1fr_auto] items-center gap-x-3 border-t border-night-line/60 py-2 text-sm first:border-t-0"
            >
              <span className="h-2.5 w-2.5 rotate-45 bg-[#E6F7F2]" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate font-bold">
                  {a.label || shortAddress(a.address)}
                </span>
                <span className="block text-xs text-ink-faint">
                  {a.lastQueryAt
                    ? `Queried ${a.lastEndpoint || 'data'} ${timeAgo(a.lastQueryAt)}`
                    : 'No requests yet'}
                </span>
              </span>
              <span className="text-right text-xs text-ink-muted">
                {(a.queries || 0).toLocaleString()} req
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

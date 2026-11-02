import { EXPLORER_URL } from '../hooks/useWallet';
import { describeActivity } from '../lib/activity';
import { KINDS, shortAddress, timeAgo } from '../lib/format';
import type { Activity } from '../lib/types';

function colorFor(a: Activity): string {
  if (a.type === 'reading.rejected') return '#FF7A7A';
  if (a.type === 'agent.subscribed') return '#E6F7F2';
  if ('kind' in a) return KINDS[a.kind]?.color ?? '#9DBDB7';
  return '#9DBDB7';
}

export function ActivityPanel({ activity, onchain }: { activity: Activity[]; onchain: boolean }) {
  return (
    <section className="panel flex min-h-0 flex-col p-4 sm:p-5" aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="mb-3 font-display text-lg font-bold">
        Recent activity
      </h2>
      {activity.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nothing yet. Readings appear here as meters report.
        </p>
      ) : (
        <ol
          className="flex max-h-[420px] min-h-0 flex-col gap-2 overflow-y-auto pr-1 lg:max-h-none"
          aria-live="polite"
          aria-relevant="additions"
        >
          {activity.slice(0, 25).map((a, i) => {
            const who = 'meter' in a ? a.meter : a.agent;
            const txHash = 'txHash' in a ? a.txHash : null;
            return (
              <li
                key={`${a.at}-${who}-${i}`}
                className="grid grid-cols-[3px_1fr_auto] gap-x-3 text-sm"
              >
                <span
                  className="rounded-full"
                  style={{ background: colorFor(a) }}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{a.label || shortAddress(who)}</span>
                  <span
                    className={`block ${a.type === 'reading.rejected' ? 'text-bad' : 'text-ink-muted'}`}
                  >
                    {describeActivity(a)}
                  </span>
                </span>
                <span className="text-right text-xs text-ink-faint">
                  {timeAgo(a.at)}
                  {txHash && onchain && (
                    <a
                      className="block text-wind underline-offset-2 hover:underline"
                      href={`${EXPLORER_URL}/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View tx
                    </a>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

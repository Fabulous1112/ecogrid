import type { Wallet } from '../hooks/useWallet';
import { formatGrid, shortAddress } from '../lib/format';
import type { GridClient, Status } from '../lib/types';
import { Logo } from '../../shared/Logo';

function GatewayStatus({
  status,
  connected,
  client,
}: {
  status: Status | null;
  connected: boolean;
  client: GridClient | null;
}) {
  let dot = 'bg-bad';
  let long = 'Gateway offline';
  let short = 'Offline';
  if (client?.mode === 'demo') {
    dot = 'bg-warn';
    long = client.fellBack ? 'Gateway unreachable, showing demo data' : 'Demo data';
    short = 'Demo';
  } else if (status?.ok && connected) {
    dot = 'bg-ok';
    long =
      status.chain?.mode === 'simulated'
        ? 'Gateway live on simulated chain'
        : `Gateway live, block ${Number(status.chain?.blockNumber || 0).toLocaleString()}`;
    short = 'Live';
  } else if (status?.ok) {
    dot = 'bg-warn';
    long = 'Reconnecting to live feed';
    short = 'Reconnecting';
  } else if (status && !status.ok) {
    dot = 'bg-warn';
    long = 'Gateway up, chain RPC failing';
    short = 'RPC issue';
  }
  return (
    <div
      className="flex items-center gap-2 text-sm text-ink-muted"
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5">
        {dot === 'bg-ok' && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-60`}
          />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dot}`} />
      </span>
      <span className="sm:hidden" title={long}>
        {short}
      </span>
      <span className="hidden sm:inline">{long}</span>
      {status?.meters && (
        <span className="hidden text-ink-faint xl:inline">
          {status.meters.online}/{status.meters.active} meters reporting
        </span>
      )}
    </div>
  );
}

export function Header({
  status,
  connected,
  client,
  wallet,
  onOpenRewards,
}: {
  status: Status | null;
  connected: boolean;
  client: GridClient | null;
  wallet: Wallet;
  onOpenRewards: () => void;
}) {
  return (
    <header className="pointer-events-auto relative z-20 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 lg:px-6 lg:py-3">
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <a href="../" className="flex items-center gap-2.5" aria-label="EcoGrid home">
          <Logo size={30} />
          <span className="hidden font-display text-xl font-extrabold tracking-tight min-[360px]:inline">
            EcoGrid
          </span>
        </a>
        <GatewayStatus status={status} connected={connected} client={client} />
      </div>
      <div className="flex items-center gap-2">
        {wallet.account && wallet.wrongChain && (
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => void wallet.switchChain()}
          >
            <span className="sm:hidden">Switch</span>
            <span className="hidden sm:inline">Switch to {wallet.targetChainName}</span>
          </button>
        )}
        {wallet.account ? (
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={onOpenRewards}
            title="View your $GRID rewards"
          >
            {wallet.gridBalance != null && (
              <span className="hidden text-solar sm:inline">
                {formatGrid(wallet.gridBalance)} GRID
              </span>
            )}
            <span>{shortAddress(wallet.account)}</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => void wallet.connect()}
          >
            <span>
              Connect<span className="hidden sm:inline"> wallet</span>
            </span>
          </button>
        )}
      </div>
      {wallet.error && (
        <p className="w-full text-right text-sm text-bad" role="alert">
          {wallet.error}
        </p>
      )}
    </header>
  );
}

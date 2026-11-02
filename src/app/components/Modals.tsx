import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Wallet } from '../hooks/useWallet';
import { GatewayError } from '../lib/client';
import { formatGrid, shortAddress, weiToGrid } from '../lib/format';
import type { GridClient, Market, Meter, MeterKind } from '../lib/types';
import { validateMeterForm } from '../lib/validation';

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>('input,select,button,textarea,a')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-night-deep/70 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="panel max-h-[88svh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-panel sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="font-display text-2xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost h-11 w-11 px-0"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 3l10 10M13 3 3 13" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function RegisterMeterModal({
  client,
  onClose,
  onDone,
}: {
  client: GridClient | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    address: '',
    kind: 'solar' as MeterKind,
    label: '',
    capacityW: '',
    payout: '',
    token: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isDemo = client?.mode === 'demo';
  const field = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const problem = validateMeterForm(form);
    if (problem) return setError(problem);
    if (!client) return setError('Still connecting to the gateway. Try again in a moment.');
    setBusy(true);
    try {
      await client.registerMeter(
        {
          address: form.address,
          kind: form.kind,
          label: form.label || undefined,
          capacityW: Number(form.capacityW),
          payout: form.payout,
        },
        form.token || undefined,
      );
      onDone();
      onClose();
    } catch (err) {
      setError(
        err instanceof GatewayError && err.code === 'admin_auth'
          ? 'The admin token was rejected.'
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Register meter" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-muted">
        Solar and wind meters must also be registered on the rewards contract by the registry
        multisig. Readings from batteries and EV chargers are verified but not rewarded.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <label className="text-sm">
          Meter signing address
          <input
            className="field mt-1"
            value={form.address}
            onChange={field('address')}
            placeholder="0x…"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          <label className="text-sm">
            Type
            <select className="field mt-1" value={form.kind} onChange={field('kind')}>
              <option value="solar">Solar</option>
              <option value="wind">Wind</option>
              <option value="battery">Battery</option>
              <option value="ev">EV charger</option>
            </select>
          </label>
          <label className="text-sm">
            Rated capacity (W)
            <input
              className="field mt-1"
              inputMode="numeric"
              value={form.capacityW}
              onChange={field('capacityW')}
              placeholder="5000"
            />
          </label>
        </div>
        <label className="text-sm">
          Name <span className="text-ink-faint">(optional)</span>
          <input
            className="field mt-1"
            value={form.label}
            onChange={field('label')}
            placeholder="Rooftop Solar B"
            maxLength={64}
          />
        </label>
        <label className="text-sm">
          Payout wallet
          <input
            className="field mt-1"
            value={form.payout}
            onChange={field('payout')}
            placeholder="0x…"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {!isDemo && (
          <label className="text-sm">
            Admin token
            <input
              className="field mt-1"
              type="password"
              value={form.token}
              onChange={field('token')}
              autoComplete="off"
            />
            <span className="mt-1 block text-xs text-ink-faint">
              Sent only with this request and never stored.
            </span>
          </label>
        )}
        {error && (
          <p className="text-sm text-bad" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary mt-2" disabled={busy}>
          {busy ? 'Registering…' : 'Register meter'}
        </button>
      </form>
    </Modal>
  );
}

const METER_SNIPPET = `// On the meter or its gateway (ethers v6)
const domain = { name: 'EcoGrid EnergyRewards', version: '1',
  chainId, verifyingContract: ENERGY_REWARDS_ADDRESS };
const types = { Reading: [
  { name: 'meter', type: 'address' }, { name: 'periodStart', type: 'uint64' },
  { name: 'periodEnd', type: 'uint64' }, { name: 'energyWh', type: 'uint256' } ] };
const reading = { meter: wallet.address, periodStart, periodEnd, energyWh };
const signature = await wallet.signTypedData(domain, types, reading);
await fetch(GATEWAY + '/api/v1/ingest/readings', { method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reading, signature }) });`;

export function LogGenerationModal({
  client,
  onClose,
}: {
  client: GridClient | null;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  async function sendDemo() {
    setResult(null);
    try {
      await client?.simulateNow();
      setResult({
        ok: true,
        text: 'Readings sent. Watch the nodes pulse as each one is accepted.',
      });
    } catch (err) {
      setResult({
        ok: false,
        text:
          err instanceof GatewayError && err.code === 'simulator_disabled'
            ? 'This gateway has the simulator turned off. Send readings from a real meter using the code below.'
            : (err as Error).message,
      });
    }
  }
  return (
    <Modal title="Log generation" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-muted">
        Readings are signed by the meter’s own key, so the dashboard can’t log energy on a meter’s
        behalf. Devices post signed readings to the gateway webhook.
      </p>
      <pre className="mb-4 overflow-x-auto rounded-tile border border-night-line bg-night-deep p-3 text-xs leading-relaxed text-ink-muted">
        <code>{METER_SNIPPET}</code>
      </pre>
      {client && (
        <>
          <button type="button" className="btn-ghost w-full" onClick={() => void sendDemo()}>
            Send readings from the demo fleet now
          </button>
          {result && (
            <p className={`mt-3 text-sm ${result.ok ? 'text-ok' : 'text-bad'}`} role="status">
              {result.text}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}

export function RewardsModal({
  wallet,
  meters,
  onClose,
}: {
  wallet: Wallet;
  meters: Meter[];
  onClose: () => void;
}) {
  const mine = wallet.account
    ? meters.filter((m) => m.payout?.toLowerCase() === wallet.account!.toLowerCase())
    : [];
  const earned = mine.reduce((sum, m) => sum + weiToGrid(m.totalRewardWei), 0);
  return (
    <Modal title="Your rewards" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-muted">
        There’s nothing to claim. The rewards contract sends $GRID straight to each meter’s payout
        wallet when a reading is accepted.
      </p>
      {wallet.account ? (
        <>
          <dl className="mb-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            <div className="rounded-tile border border-night-line p-3">
              <dt className="text-sm text-ink-muted">Wallet balance</dt>
              <dd className="font-display text-2xl font-bold text-solar">
                {wallet.gridBalance != null
                  ? `${formatGrid(wallet.gridBalance)} GRID`
                  : 'Not available'}
              </dd>
            </div>
            <div className="rounded-tile border border-night-line p-3">
              <dt className="text-sm text-ink-muted">Earned by your meters</dt>
              <dd className="font-display text-2xl font-bold">{formatGrid(earned)} GRID</dd>
            </div>
          </dl>
          {mine.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No meters pay out to {shortAddress(wallet.account)} yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {mine.map((m) => (
                <li key={m.address} className="flex justify-between gap-3">
                  <span>{m.label}</span>
                  <span>{formatGrid(weiToGrid(m.totalRewardWei))} GRID</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <button type="button" className="btn-primary w-full" onClick={() => void wallet.connect()}>
          Connect wallet
        </button>
      )}
    </Modal>
  );
}

const AGENT_SNIPPET = `import { EcoGridAgent } from '@ecogrid/agent-sdk';

const agent = new EcoGridAgent({
  gateway: GATEWAY_URL,
  privateKey: process.env.AGENT_KEY, // the agent's wallet is its identity
});

// Pay for 30 days of data on-chain (approves GRID, then subscribes)
await agent.subscribe({ rpcUrl, marketAddress, gridToken, planId: 0 });

// Every request is signed by the agent's wallet
const { readings } = await agent.readings({ kind: 'solar', limit: 100 });
const { buckets, totals } = await agent.aggregates({ minutes: 60 });`;

const ENDPOINTS = [
  ['GET /api/v1/data/readings', 'verified readings by kind and time'],
  ['GET /api/v1/data/aggregates', 'energy by source over time'],
  ['GET /api/v1/data/meters', 'registry with rated capacity'],
  ['GET /api/v1/data/stream', 'live readings as they land'],
];

export function AgentApiModal({ market, onClose }: { market: Market | null; onClose: () => void }) {
  const plans = market?.plans ?? [];
  const split = market?.split;
  return (
    <Modal title="Agent API" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-muted">
        AI agents buy a plan with $GRID on the DataMarket contract, then sign each request with
        their wallet. No API keys.
      </p>
      {plans.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className="rounded-tile border border-night-line p-3">
              <div className="font-display font-bold">{p.name}</div>
              <div className="text-solar">{Number(p.priceGrid).toLocaleString()} GRID</div>
              <div className="text-xs text-ink-faint">
                per {p.periodDays} days, {p.tier === 2 ? '600' : '60'} requests a minute
              </div>
            </div>
          ))}
        </div>
      )}
      {split && (
        <p className="mb-4 text-sm text-ink-muted">
          Each payment: {split.recycleBps / 100}% refills the producer reward vault,{' '}
          {split.burnBps / 100}% is burned, {split.treasuryBps / 100}% goes to the treasury.
        </p>
      )}
      <div className="mb-2 text-sm font-bold">Endpoints</div>
      <ul className="mb-4 flex flex-col gap-1 text-sm text-ink-muted">
        {ENDPOINTS.map(([path, what]) => (
          <li key={path}>
            <code className="text-ink">{path}</code> {what}
          </li>
        ))}
      </ul>
      <pre className="overflow-x-auto rounded-tile border border-night-line bg-night-deep p-3 text-xs leading-relaxed text-ink-muted">
        <code>{AGENT_SNIPPET}</code>
      </pre>
    </Modal>
  );
}

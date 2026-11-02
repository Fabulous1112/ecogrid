import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  AGENT_KINDS,
  AGENT_STEPS,
  ALLOCATION,
  APP_URL,
  CONTRACTS,
  ENGINES,
  FAQS,
  FUNCTIONS,
  LAYERS,
  METER_KINDS,
  PARAMS,
} from './content';
import {
  checkReading,
  DEMO_CAPACITY_WH,
  estimateRewards,
  fmt,
  ratePerKWh,
  short,
  splitPayment,
  type FeedRow,
} from './protocol';

const PASS = '#7BE0A6';
const FAIL = '#FF7A7A';

function Section({
  id,
  eyebrow,
  title,
  lead,
  narrow,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  narrow?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id}>
      <div className="wrap" style={narrow ? { maxWidth: 900 } : undefined}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="h2" style={{ maxWidth: 820 }}>
          {title}
        </h2>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

const grid = (min: number): CSSProperties => ({ ['--min' as string]: `${min}px` });

// ---------- 01 Protocol ----------

export function Protocol({
  feed,
  kwh,
  readings,
  accepted,
}: {
  feed: FeedRow[];
  kwh: number;
  readings: number;
  accepted: number;
}) {
  return (
    <Section
      id="protocol"
      eyebrow="01 · PROTOCOL"
      title={
        <>
          Three contracts.
          <br />
          One rule: no proof, no payout.
        </>
      }
      lead="A registry knows every meter and what it can physically produce. A vault only pays for readings that pass. A data market lets AI agents buy what the network proves."
    >
      <div className="grid-auto mt-48">
        {ENGINES.map((e) => (
          <article key={e.tag} className={`card glow-${e.glow}`} style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="tag" style={{ color: e.color, borderColor: `${e.color}66` }}>
                {e.tag}
              </span>
              <span className="label" style={{ letterSpacing: '0.12em' }}>
                {e.kicker}
              </span>
            </div>
            <h3
              style={{
                margin: '16px 0 10px',
                fontWeight: 600,
                fontSize: 25.6,
                letterSpacing: '-0.025em',
              }}
            >
              {e.name}
            </h3>
            <p className="muted" style={{ marginBottom: 18 }}>
              {e.d}
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {e.points.map((p) => (
                <li
                  key={p}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '22px 1fr',
                    color: 'var(--ink-2)',
                  }}
                >
                  <span style={{ color: e.color, fontWeight: 600 }}>–</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="card live">
        <div className="live-stats">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="blink dot" style={{ width: 8, height: 8, background: PASS }} />
            <span
              className="mono"
              style={{ fontSize: 11.5, letterSpacing: '0.12em', color: 'var(--ink-2)' }}
            >
              LIVE NETWORK · SIMULATED
            </span>
          </div>
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div className="label">KWH SIGNED</div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 38,
                  letterSpacing: '-0.03em',
                  color: 'var(--amber)',
                }}
              >
                {fmt(kwh, 1)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 28 }}>
              <div>
                <div className="label">READINGS</div>
                <div style={{ fontWeight: 600, fontSize: 26 }}>{fmt(readings, 0)}</div>
              </div>
              <div>
                <div className="label">ACCEPTED</div>
                <div style={{ fontWeight: 600, fontSize: 26, color: PASS }}>
                  {fmt((accepted / readings) * 100, 1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
        <ol className="feed mono" aria-label="Recent simulated readings">
          {feed.map((r) => (
            <li key={r.id}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
              <span className="ellipsis">
                <span>{r.meter}</span>{' '}
                <span style={{ color: 'var(--ink-5)' }}>
                  {r.kind} · {r.wh}
                </span>
              </span>
              <span style={{ color: r.statusColor, textAlign: 'right' }}>{r.status}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

// ---------- 02 Meters ----------

export function Meters() {
  return (
    <Section
      id="meters"
      eyebrow="02 · METERS"
      title="Built for every kind of node."
      lead="Rooftops, turbines and whole microgrids earn for what they generate. Batteries and chargers report too, verified but never double-counted."
    >
      <div className="card grid-auto meters mt-48">
        {METER_KINDS.map((m) => (
          <div key={m.letter} className="meter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                className="mono meter-letter"
                style={{ borderColor: `${m.color}73`, color: m.color }}
              >
                {m.letter}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: '0.12em',
                  color: m.rewarded ? PASS : 'var(--ink-4)',
                }}
              >
                {m.rewarded ? 'REWARDED' : 'VERIFIED'}
              </span>
            </div>
            <h3
              style={{
                margin: '18px 0 14px',
                fontWeight: 600,
                fontSize: 21,
                letterSpacing: '-0.02em',
              }}
            >
              {m.name}
            </h3>
            {m.lines.map((line) => (
              <div key={line} className="meter-line">
                {line}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------- 03 Flow ----------

function FlowDiagram({
  wh,
  sigOk,
  capOk,
  fresh,
  accepted,
}: {
  wh: number;
  sigOk: boolean;
  capOk: boolean;
  fresh: boolean;
  accepted: boolean;
}) {
  const out = accepted ? PASS : FAIL;
  return (
    <svg
      viewBox="0 0 640 300"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="Meter signs a reading, the gateway pre-checks it, the contract verifies it and pays the producer wallet"
    >
      <g fill="none" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 8">
        <path id="p1" d="M128 150 C 175 150, 170 80, 222 80" stroke="#F2B33D" className="dash" />
        <path id="p2" d="M128 150 C 175 150, 170 220, 222 220" stroke="#6FD6E8" className="dash" />
        <path id="p3" d="M338 80 C 390 80, 385 150, 436 150" stroke="#F2B33D" className="dash" />
        <path id="p4" d="M338 220 C 390 220, 385 150, 436 150" stroke="#6FD6E8" className="dash" />
        <path d="M526 150 H 548" stroke={out} className="dash" />
      </g>
      <g className="motion-dot">
        {[
          ['p1', '#FFF3D6', '2.6s', '0s'],
          ['p2', '#E2FAFF', '3.1s', '0s'],
          ['p3', '#FFF3D6', '2.6s', '1.3s'],
          ['p4', '#E2FAFF', '3.1s', '1.5s'],
        ].map(([path, fill, dur, begin]) => (
          <circle key={path} r="4" fill={fill}>
            <animateMotion dur={dur} begin={begin} repeatCount="indefinite">
              <mpath href={`#${path}`} />
            </animateMotion>
          </circle>
        ))}
      </g>
      <g fontFamily="IBM Plex Mono, monospace" textAnchor="middle">
        <rect
          x="18"
          y="118"
          width="110"
          height="64"
          rx="12"
          fill="#151920"
          stroke="rgba(255,255,255,0.10)"
        />
        <text x="73" y="143" fontSize="9.5" letterSpacing="1.4" fill="#8A90A3">
          METER SIGNS
        </text>
        <text
          x="73"
          y="164"
          fontSize="13"
          fill="#ECEEF5"
          fontFamily="Sora, sans-serif"
          fontWeight="600"
        >
          {fmt(wh, 0)} Wh
        </text>
        <rect
          x="222"
          y="56"
          width="116"
          height="48"
          rx="10"
          fill="#151920"
          stroke="rgba(242,179,61,0.55)"
        />
        <text x="280" y="75" fontSize="9" letterSpacing="1.4" fill="#F2B33D">
          SIGNATURE
        </text>
        <text x="280" y="92" fontSize="11" fill="#ECEEF5">
          {sigOk ? '✓ matches' : '✗ tampered'}
        </text>
        <rect
          x="222"
          y="196"
          width="116"
          height="48"
          rx="10"
          fill="#151920"
          stroke="rgba(111,214,232,0.55)"
        />
        <text x="280" y="215" fontSize="9" letterSpacing="1.4" fill="#6FD6E8">
          CAPACITY
        </text>
        <text x="280" y="232" fontSize="11" fill="#ECEEF5">
          {capOk ? '✓ within limit' : '✗ too high'}
        </text>
        <rect
          x="436"
          y="126"
          width="90"
          height="48"
          rx="10"
          fill="#151920"
          stroke="rgba(183,156,255,0.55)"
        />
        <text x="481" y="145" fontSize="9" letterSpacing="1.4" fill="#B79CFF">
          NO REPLAY
        </text>
        <text x="481" y="162" fontSize="11" fill="#ECEEF5">
          {fresh ? '✓ fresh' : '✗ replay'}
        </text>
        <rect x="548" y="118" width="80" height="64" rx="12" fill="#151920" stroke={out} />
        <text x="588" y="143" fontSize="9" letterSpacing="1.4" fill="#8A90A3">
          WALLET
        </text>
        <text
          x="588"
          y="164"
          fontSize="12"
          fill={out}
          fontFamily="Sora, sans-serif"
          fontWeight="600"
        >
          {accepted ? `+${fmt(wh / 1000, 2)}` : 'rejected'}
        </text>
        <text
          x="190"
          y="70"
          fontSize="11"
          fill="#F2B33D"
          fontFamily="Sora, sans-serif"
          fontWeight="600"
        >
          EIP-712
        </text>
        <text
          x="190"
          y="246"
          fontSize="11"
          fill="#6FD6E8"
          fontFamily="Sora, sans-serif"
          fontWeight="600"
        >
          ≤ {fmt(DEMO_CAPACITY_WH, 0)} Wh
        </text>
      </g>
    </svg>
  );
}

export function Flow() {
  const [wh, setWh] = useState(4120);
  const [tampered, setTampered] = useState(false);
  const [replayed, setReplayed] = useState(false);
  const { checks, accepted, capOk, rewardGrid } = checkReading({ wh, tampered, replayed });
  const resultColor = accepted ? PASS : FAIL;

  return (
    <Section
      id="flow"
      eyebrow="03 · FLOW"
      title={
        <>
          One reading. Three checks.
          <br />
          One payout.
        </>
      }
      lead="The meter signs, anyone relays, the contract verifies. If every check passes, $GRID moves from the vault to the producer in the same transaction."
    >
      <div className="flow mt-48">
        <div
          className="card"
          style={{
            flex: '1.5 1 520px',
            minWidth: 0,
            padding: '28px 24px 22px',
            background:
              'radial-gradient(500px 260px at 15% 20%, rgba(242,179,61,0.10), transparent 70%), linear-gradient(#12161B,#0C0F13)',
          }}
        >
          <FlowDiagram
            wh={wh}
            sigOk={!tampered}
            capOk={capOk}
            fresh={!replayed}
            accepted={accepted}
          />
          <p style={{ marginTop: 10, textAlign: 'center', fontSize: 13, color: 'var(--ink-4)' }}>
            Try it below: change the reading or try to cheat, and the diagram follows.
          </p>
        </div>
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          {PARAMS.map((p) => (
            <div key={p.k} className="param">
              <span>
                <code
                  className="code-pill"
                  style={{
                    background: 'rgba(242,179,61,0.12)',
                    color: 'var(--amber)',
                    fontSize: 12.5,
                  }}
                >
                  {p.k}
                </code>
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>{p.t}</div>
                <div className="muted small">{p.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-auto" style={{ ...grid(420), marginTop: 22 }}>
        <div className="card" style={{ padding: 28 }}>
          <label htmlFor="wh" className="field-label">
            <span style={{ fontWeight: 600 }}>Energy in a 1-hour reading, 5 kW rooftop</span>
            <span className="big" style={{ color: capOk ? 'var(--ink)' : FAIL }}>
              {fmt(wh, 0)} Wh
            </span>
          </label>
          <input
            id="wh"
            type="range"
            min={0}
            max={7000}
            step={10}
            value={wh}
            onChange={(e) => setWh(Number(e.target.value))}
            style={{ margin: '14px 0 6px' }}
          />
          <div className="scale mono">
            <span>0 WH</span>
            <span>5,000 WH RATED MAX</span>
            <span>7,000 WH</span>
          </div>
          <div className="row" style={{ marginTop: 24, gap: 10 }}>
            <button
              type="button"
              className="toggle"
              aria-pressed={tampered}
              onClick={() => setTampered((t) => !t)}
            >
              Edit the number after signing
            </button>
            <button
              type="button"
              className="toggle"
              aria-pressed={replayed}
              onClick={() => setReplayed((r) => !r)}
            >
              Send it a second time
            </button>
          </div>
        </div>
        <div
          className="card"
          style={{ padding: 28, borderColor: accepted ? undefined : 'rgba(255,122,122,0.45)' }}
          aria-live="polite"
        >
          <div className="label" style={{ fontSize: 11.5 }}>
            ENERGYREWARDS.SUBMITREADING()
          </div>
          <ul
            className="checks"
            style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {checks.map((c) => (
              <li key={c.label}>
                <span aria-hidden="true" className="mono" style={{ color: c.pass ? PASS : FAIL }}>
                  {c.pass ? '✓' : '✗'}
                </span>
                <span>
                  <span style={{ fontWeight: 600 }}>{c.label}</span>
                  <span className="sr-only">{c.pass ? ' (passed)' : ' (failed)'}</span>
                  <br />
                  <span className="muted" style={{ fontSize: 14 }}>
                    {c.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="result" style={{ color: resultColor }}>
            <span>{accepted ? 'Accepted, paid to wallet' : 'Rejected, nothing paid'}</span>
            <span style={{ fontSize: 32, letterSpacing: '-0.03em' }}>
              {accepted ? `+${fmt(rewardGrid, 2)} GRID` : '0 GRID'}
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ---------- 04 Agents ----------

function SplitDiagram({ spend }: { spend: number }) {
  const s = splitPayment(spend);
  const boxes = [
    {
      y: 20,
      color: '#F2B33D',
      stroke: 'rgba(242,179,61,0.6)',
      label: 'PRODUCER VAULT · 50%',
      value: s.producers,
    },
    {
      y: 100,
      color: '#FF8A6B',
      stroke: 'rgba(255,138,107,0.6)',
      label: 'BURNED · 30%',
      value: s.burned,
    },
    {
      y: 180,
      color: '#B79CFF',
      stroke: 'rgba(183,156,255,0.6)',
      label: 'TREASURY · 20%',
      value: s.treasury,
    },
  ];
  return (
    <svg
      viewBox="0 0 560 250"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="An agent payment splits into 50% to producers, 30% burned and 20% to the treasury"
    >
      <g fill="none" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 8">
        <path id="s1" d="M150 125 C 230 125, 230 45, 330 45" stroke="#F2B33D" className="dash" />
        <path id="s2" d="M150 125 H 330" stroke="#FF8A6B" className="dash" />
        <path id="s3" d="M150 125 C 230 125, 230 205, 330 205" stroke="#B79CFF" className="dash" />
      </g>
      <g className="motion-dot">
        {[
          ['s1', '#FFF3D6', '0s'],
          ['s2', '#FFE2D9', '0.6s'],
          ['s3', '#EEE6FF', '1.2s'],
        ].map(([path, fill, begin]) => (
          <circle key={path} r="4" fill={fill}>
            <animateMotion dur="2.2s" begin={begin} repeatCount="indefinite">
              <mpath href={`#${path}`} />
            </animateMotion>
          </circle>
        ))}
      </g>
      <g fontFamily="IBM Plex Mono, monospace" textAnchor="middle">
        <rect
          x="10"
          y="90"
          width="140"
          height="70"
          rx="12"
          fill="#151920"
          stroke="rgba(255,255,255,0.12)"
        />
        <text x="80" y="117" fontSize="9.5" letterSpacing="1.4" fill="#8A90A3">
          AGENTS PAY
        </text>
        <text
          x="80"
          y="140"
          fontSize="14"
          fill="#ECEEF5"
          fontFamily="Sora, sans-serif"
          fontWeight="600"
        >
          {short(spend)} GRID
        </text>
        {boxes.map((b) => (
          <g key={b.label}>
            <rect
              x="330"
              y={b.y}
              width="220"
              height="50"
              rx="11"
              fill="#151920"
              stroke={b.stroke}
            />
            <text x="440" y={b.y + 20} fontSize="9" letterSpacing="1.4" fill={b.color}>
              {b.label}
            </text>
            <text x="440" y={b.y + 38} fontSize="12.5" fill="#ECEEF5">
              {fmt(b.value, 0)} GRID
            </text>
          </g>
        ))}
        <text
          x="226"
          y="62"
          fontSize="12"
          fill="#F2B33D"
          fontFamily="Sora, sans-serif"
          fontWeight="600"
        >
          50%
        </text>
        <text
          x="240"
          y="117"
          fontSize="12"
          fill="#FF8A6B"
          fontFamily="Sora, sans-serif"
          fontWeight="600"
        >
          30%
        </text>
        <text
          x="226"
          y="196"
          fontSize="12"
          fill="#B79CFF"
          fontFamily="Sora, sans-serif"
          fontWeight="600"
        >
          20%
        </text>
      </g>
    </svg>
  );
}

export function Agents() {
  const [spend, setSpend] = useState(100_000);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % AGENT_STEPS.length), 2600);
    return () => clearInterval(timer);
  }, []);
  const yearly = splitPayment(spend * 12);

  return (
    <Section
      id="agents"
      eyebrow="04 · AGENTS"
      title="Machines need data they can trust. They pay for it in $GRID."
      lead="Trading bots, climate models and carbon accountants buy access on-chain, then sign every request with their wallet. No API keys, and no plan means HTTP 402."
    >
      <div className="card mt-48" style={{ padding: 26 }}>
        <ol className="grid-auto" style={{ ...grid(230), gap: 14 }}>
          {AGENT_STEPS.map(([n, t, d], i) => (
            <li key={n} className={`step${i === step ? ' on' : ''}`}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--amber)' }}>
                {n}
              </div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>{t}</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 14 }}>
                {d}
              </div>
              <div className="step-bar" />
            </li>
          ))}
        </ol>

        <div className="row" style={{ marginTop: 26, gap: 26, alignItems: 'center' }}>
          <div style={{ flex: '1.3 1 460px', minWidth: 0 }}>
            <SplitDiagram spend={spend} />
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <label htmlFor="spend" className="field-label">
              <span style={{ fontWeight: 600 }}>Agent spending per month</span>
              <span style={{ fontWeight: 600, fontSize: 26, letterSpacing: '-0.03em' }}>
                {fmt(spend, 0)} GRID
              </span>
            </label>
            <input
              id="spend"
              type="range"
              min={2000}
              max={1_000_000}
              step={2000}
              value={spend}
              onChange={(e) => setSpend(Number(e.target.value))}
              style={{ margin: '12px 0 14px' }}
            />
            <p className="muted small">
              At this demand, <b style={{ color: 'var(--ink)' }}>{fmt(yearly.burned, 0)} GRID</b>{' '}
              leaves circulation a year and{' '}
              <b style={{ color: 'var(--ink)' }}>{fmt(yearly.producers, 0)} GRID</b> is added to
              producer rewards. The split is enforced by the DataMarket contract; producers always
              get at least 40%.
            </p>
          </div>
        </div>

        <div className="row" style={{ marginTop: 24, gap: 10 }}>
          <a className="btn btn-primary" href={APP_URL}>
            See agents live
          </a>
          <a className="btn btn-ghost" href="#plans">
            Data plans
          </a>
        </div>
      </div>

      <div id="plans" className="grid-auto" style={{ ...grid(260), marginTop: 18 }}>
        {AGENT_KINDS.map((k) => (
          <article key={k.name} className="card" style={{ padding: 24 }}>
            <code
              className="code-pill"
              style={{ background: 'rgba(230,247,242,0.08)', color: 'var(--frost)' }}
            >
              {k.endpoint}
            </code>
            <h3
              style={{
                margin: '14px 0 6px',
                fontWeight: 600,
                fontSize: 21,
                letterSpacing: '-0.02em',
              }}
            >
              {k.name}
            </h3>
            <p className="muted small">{k.d}</p>
          </article>
        ))}
        <article className="card glow-amber" style={{ padding: 24 }}>
          <div className="label" style={{ letterSpacing: '0.12em' }}>
            PLANS
          </div>
          {[
            ['Builder', '2,000 GRID / 30d', '60 requests a minute'],
            ['Pro', '20,000 GRID / 30d', '600 requests a minute, live stream'],
          ].map(([name, price, limit], i) => (
            <div
              key={name}
              style={
                i
                  ? { marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }
                  : { marginTop: 12 }
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontWeight: 600 }}>{name}</span>
                <span style={{ color: 'var(--amber)' }}>{price}</span>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-4)' }}>{limit}</div>
            </div>
          ))}
        </article>
      </div>
    </Section>
  );
}

// ---------- 05 Rewards ----------

export function Rewards() {
  const [kw, setKw] = useState(6);
  const [sun, setSun] = useState(5);
  const [year, setYear] = useState(1);
  const r = estimateRewards({ kw, sunHours: sun, year });
  const stats = [
    ['GENERATED / DAY', `${fmt(r.kWhPerDay, 1)} kWh`, undefined],
    ['RATE', `${r.rate} / kWh`, undefined],
    ['$GRID / DAY', fmt(r.gridPerDay, 1), 'var(--amber)'],
    ['$GRID / YEAR', fmt(r.gridPerYear, 0), 'var(--amber)'],
  ] as const;

  return (
    <Section
      id="rewards"
      eyebrow="05 · REWARDS"
      title="Size up your array."
      lead="How much $GRID a generation meter would be paid at each year’s emission rate. Tokens, not money: this says nothing about price."
    >
      <div className="grid-auto mt-48">
        <div
          className="card"
          style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 26 }}
        >
          <div>
            <label htmlFor="kw" className="field-label">
              <span style={{ fontWeight: 600 }}>System size</span>
              <span style={{ fontWeight: 600, fontSize: 26 }}>{kw} kW</span>
            </label>
            <input
              id="kw"
              type="range"
              min={1}
              max={50}
              step={1}
              value={kw}
              onChange={(e) => setKw(Number(e.target.value))}
              style={{ marginTop: 10 }}
            />
          </div>
          <div>
            <label htmlFor="sun" className="field-label">
              <span style={{ fontWeight: 600 }}>Peak sun hours a day</span>
              <span style={{ fontWeight: 600, fontSize: 26 }}>{sun} h</span>
            </label>
            <input
              id="sun"
              type="range"
              min={2}
              max={8}
              step={0.5}
              value={sun}
              onChange={(e) => setSun(Number(e.target.value))}
              style={{ marginTop: 10 }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Emission year</div>
            <div role="group" aria-label="Emission year" className="segmented">
              {[1, 2, 3, 4].map((y) => (
                <button key={y} type="button" aria-pressed={y === year} onClick={() => setYear(y)}>
                  Year {y}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="card glow-amber" style={{ padding: 28 }} aria-live="polite">
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 22 }}
          >
            {stats.map(([label, value, color]) => (
              <div key={label}>
                <div className="label">{label}</div>
                <div className="big" style={color ? { color } : undefined}>
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div className="label" style={{ marginTop: 26 }}>
            RATE BY YEAR
          </div>
          <div className="bars" aria-hidden="true">
            {[1, 2, 3, 4].map((y) => (
              <div key={y}>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                  {ratePerKWh(y)}
                </span>
                <span
                  className={`bar${y === year ? ' on' : ''}`}
                  style={{ height: `${Math.max(6, ratePerKWh(y) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <p style={{ marginTop: 18, fontSize: 13.5, color: 'var(--ink-4)' }}>
            The 1.5M weekly cap is shared by every meter, plus whatever agents recycle into the
            vault. Not financial advice.
          </p>
        </div>
      </div>
    </Section>
  );
}

// ---------- 06 Blueprint / 07 Functions ----------

export function Blueprint() {
  return (
    <Section
      id="blueprint"
      eyebrow="06 · BLUEPRINT"
      title="The architecture, layer by layer."
      lead="Small contracts with one job each, a gateway that never holds funds, and SDKs on both ends: one for meters, one for agents."
    >
      <div className="card gridbg mt-48" style={{ padding: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {LAYERS.map((l) => (
            <div key={l.id} className="layer">
              <div className="mono layer-name">
                {l.id} · {l.name}
              </div>
              {l.boxes.map(([t, d]) => (
                <div
                  key={t}
                  className="layer-box"
                  style={{ borderColor: l.border, background: l.bg }}
                >
                  <div style={{ fontWeight: 600 }}>{t}</div>
                  <div
                    className="mono"
                    style={{ marginTop: 4, fontSize: 11.5, color: 'var(--ink-4)' }}
                  >
                    {d}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function Functions() {
  return (
    <Section
      eyebrow="07 · BEYOND THE BASELINE"
      title="Every promise is a function you can read."
      lead="No off-chain promises. What the protocol does is what these calls do."
    >
      <div className="grid-auto mt-48" style={{ ...grid(250), gap: 16 }}>
        {FUNCTIONS.map((f) => (
          <article key={f.sig} className="card" style={{ padding: 22 }}>
            <code
              className="code-pill"
              style={{
                background: '#171B22',
                border: '1px solid rgba(255,255,255,0.08)',
                color: f.color,
              }}
            >
              {f.sig}
            </code>
            <h3
              style={{
                margin: '14px 0 8px',
                fontWeight: 600,
                fontSize: 18,
                letterSpacing: '-0.02em',
              }}
            >
              {f.t}
            </h3>
            <p className="muted small">{f.d}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

// ---------- 08 Tokenomics / 09 Contracts ----------

export function Tokenomics() {
  return (
    <Section
      id="tokenomics"
      eyebrow="08 · TOKENOMICS"
      title="1,000,000,000 $GRID. Fixed at launch."
    >
      <div className="card mt-48" style={{ padding: 28 }}>
        <div
          role="img"
          aria-label="Allocation: 60% bonding curve, 20% locked liquidity, 15% meter rewards, 5% treasury"
          style={{ display: 'flex', gap: 4, height: 56 }}
        >
          {ALLOCATION.map((a, i) => (
            <div
              key={a.pct}
              style={{
                flex: a.pct,
                background: a.bar,
                borderRadius:
                  i === 0
                    ? '14px 4px 4px 14px'
                    : i === ALLOCATION.length - 1
                      ? '4px 14px 14px 4px'
                      : 4,
              }}
            />
          ))}
        </div>
        <div className="grid-auto" style={{ ...grid(210), marginTop: 26, gap: 20 }}>
          {ALLOCATION.map((a) => (
            <div key={a.pct}>
              <div className="big" style={{ color: a.text }}>
                {a.pct}%
              </div>
              <div className="muted">{a.label}</div>
            </div>
          ))}
        </div>
        <div
          className="row"
          style={{
            marginTop: 26,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            gap: '10px 26px',
            alignItems: 'baseline',
          }}
        >
          <span className="tag" style={{ color: 'var(--frost)' }}>
            DEMAND SINK
          </span>
          <span style={{ color: 'var(--ink-2)' }}>
            AI agents pay $GRID for data: <span style={{ color: 'var(--amber)' }}>50%</span> refills
            producer rewards, <span style={{ color: 'var(--coral)' }}>30%</span> is burned,{' '}
            <span style={{ color: 'var(--violet)' }}>20%</span> funds the treasury. 0% buy and sell
            tax.
          </span>
        </div>
      </div>
    </Section>
  );
}

export function Contracts() {
  const badges = [
    ['#F2B33D', 'CONTRACTS IN DEVELOPMENT'],
    ['#F2B33D', 'AUDIT BEFORE MAINNET'],
    ['#7BE0A6', 'SOURCE OPEN'],
  ];
  return (
    <Section
      id="contracts"
      eyebrow="09 · CONTRACTS"
      title="Verify before you trust."
      lead="Only use addresses listed here or in the app. Anything else claiming to be EcoGrid is not us."
    >
      <div className="card" style={{ marginTop: 40 }}>
        {CONTRACTS.map((c) => (
          <div
            key={c.name}
            className="row"
            style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px 24px',
              padding: '18px 24px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-4)' }}>{c.role}</div>
            </div>
            <code className="mono" style={{ fontSize: 12.5, color: 'var(--ink-5)' }}>
              Address published at launch
            </code>
          </div>
        ))}
        <div
          className="row mono"
          style={{
            gap: '10px 26px',
            padding: '18px 24px',
            fontSize: 12,
            letterSpacing: '0.06em',
            color: 'var(--ink-3)',
          }}
        >
          {badges.map(([color, text]) => (
            <span key={text}>
              <span style={{ color }} aria-hidden="true">
                ●
              </span>{' '}
              {text}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ---------- 10 FAQ / CTA / Footer ----------

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section eyebrow="10 · QUESTIONS" title="Straight answers." narrow>
      <div className="card" style={{ marginTop: 36, padding: '6px 24px' }}>
        {FAQS.map(([q, a], i) => (
          <div key={q} style={{ borderBottom: '1px solid var(--line)' }}>
            <button
              type="button"
              className="faq-q"
              aria-expanded={open === i}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span>{q}</span>
              <span aria-hidden="true" className="mono faq-sign">
                {open === i ? '−' : '+'}
              </span>
            </button>
            <p
              id={`faq-${i}`}
              hidden={open !== i}
              className="muted"
              style={{ margin: '0 0 20px', maxWidth: 720 }}
            >
              {a}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Closing() {
  return (
    <section style={{ padding: '70px 24px 110px' }}>
      <div
        className="card"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '88px 24px',
          textAlign: 'center',
          background:
            'radial-gradient(700px 300px at 50% 120%, rgba(242,179,61,0.22), transparent 70%), radial-gradient(500px 260px at 85% -10%, rgba(111,214,232,0.14), transparent 70%), linear-gradient(#12161B,#0C0F13)',
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 18 }}>
          GET STARTED
        </p>
        <h2
          style={{
            margin: '0 auto',
            maxWidth: 820,
            fontWeight: 600,
            fontSize: 'clamp(40px, 6vw, 76px)',
            lineHeight: 0.98,
            letterSpacing: '-0.045em',
          }}
        >
          Put your power{' '}
          <span
            className="gradient-text"
            style={{ backgroundImage: 'linear-gradient(90deg, #F2B33D, #6FD6E8)' }}
          >
            on the grid.
          </span>
        </h2>
        <div className="row" style={{ marginTop: 34, justifyContent: 'center' }}>
          <a className="btn btn-primary btn-lg" href={APP_URL}>
            Launch App
          </a>
          <a className="btn btn-ghost btn-lg" href="#protocol">
            How it works
          </a>
        </div>
      </div>
    </section>
  );
}

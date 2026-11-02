import { useEffect, useRef } from 'react';
import { Logo } from '../shared/Logo';
import { APP_URL, TICKER } from './content';
import { startHeroField } from './heroField';
import { fmt } from './protocol';

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <a href="#top" className="brand">
          <Logo size={30} />
          EcoGrid
        </a>
        <div className="nav-right">
          <nav className="nav-links" aria-label="Sections">
            <a href="#protocol">Protocol</a>
            <a href="#meters">Meters</a>
            <a href="#flow">Flow</a>
            <a href="#agents">Agents</a>
            <a href="#blueprint">Blueprint</a>
            <a href="#contracts">Contracts</a>
          </nav>
          <a
            href="https://x.com/"
            aria-label="EcoGrid on X"
            className="icon-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#ECEEF5" aria-hidden="true">
              <path d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z" />
            </svg>
          </a>
          <a
            className="btn btn-primary"
            href={APP_URL}
            style={{ minHeight: 40, padding: '0 18px', fontSize: 13.5 }}
          >
            Launch App
          </a>
        </div>
      </div>
    </header>
  );
}

export function Hero({ solarKw, windKw }: { solarKw: number; windKw: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(
    () => (canvas.current ? startHeroField(canvas.current, prefersReducedMotion()) : undefined),
    [],
  );

  const chips = [
    { color: '#F2B33D', text: `SOLAR · ${fmt(solarKw, 1)} KW`, style: { right: 120, top: 0 } },
    {
      color: '#6FD6E8',
      text: `WIND · ${fmt(windKw, 1)} KW`,
      style: { right: 0, top: 150, animationDelay: '1.2s' },
    },
    {
      color: '#E6F7F2',
      text: 'AGENTS · 4 ONLINE',
      style: { right: 90, top: 290, animationDelay: '2.4s' },
    },
    {
      color: '#B79CFF',
      text: 'VAULT · 150M GRID',
      style: { right: 210, top: 410, animationDelay: '3.4s' },
    },
  ];

  return (
    <>
      <section id="top" className="hero">
        <canvas ref={canvas} aria-hidden="true" />
        <div className="hero-shade" />
        <div className="hero-inner">
          <p className="eyebrow" style={{ marginBottom: 22 }}>
            VERIFIED ENERGY DATA · BUILT FOR BASE
          </p>
          <h1>
            Clean power that
            <br />
            <span className="gradient-text">proves itself.</span>
          </h1>
          <p className="hero-lead">
            Every meter signs its own readings. A public contract checks each one, then pays $GRID
            straight to the producer. AI agents buy that verified data with $GRID, and half of every
            payment flows back to producers.
          </p>
          <div className="row" style={{ marginTop: 34 }}>
            <a className="btn btn-primary btn-lg" href={APP_URL}>
              Launch App
            </a>
            <a className="btn btn-ghost btn-lg" href="#blueprint">
              Read the blueprint
            </a>
          </div>
          <p className="mono" style={{ marginTop: 30, fontSize: 13, color: 'var(--ink-4)' }}>
            <span style={{ fontStyle: 'italic', color: 'var(--ink)' }}>ƒ · grid</span>, n.: the
            network that carries power from where it’s made to where it’s used.
          </p>
          <div className="chips" aria-hidden="true">
            {chips.map((c) => (
              <span key={c.color} className="chip float" style={c.style}>
                <span className="dot" style={{ background: c.color }} />
                {c.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track marquee mono">
          {[0, 1].map((copy) => (
            <div key={copy}>
              {TICKER.map(([text, color]) => (
                <span key={text} style={color ? { color } : undefined}>
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

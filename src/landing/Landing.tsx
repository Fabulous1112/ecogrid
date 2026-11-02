import { Logo } from '../shared/Logo';
import { APP_URL } from './content';
import { Hero, Nav } from './Hero';
import { useSimulatedNetwork } from './useSimulatedNetwork';
import {
  Agents,
  Blueprint,
  Closing,
  Contracts,
  Faq,
  Flow,
  Functions,
  Meters,
  Protocol,
  Rewards,
  Tokenomics,
} from './Sections';

const REPO_URL = 'https://github.com/Fabulous1112/ecogrid';

function Footer() {
  const columns = [
    {
      title: 'APP',
      links: [
        ['Live grid', APP_URL],
        ['Register a meter', APP_URL],
        ['Your rewards', APP_URL],
      ],
    },
    {
      title: 'PROTOCOL',
      links: [
        ['How it works', '#protocol'],
        ['Agent API', '#agents'],
        ['Blueprint', '#blueprint'],
        ['Contracts', '#contracts'],
      ],
    },
    { title: 'COMMUNITY', links: [['GitHub', REPO_URL]] },
  ];
  return (
    <footer className="footer">
      <div className="wrap" style={{ padding: '56px 24px 44px' }}>
        <div className="footer-cols">
          <div style={{ flex: '1 1 280px' }}>
            <div className="brand">
              <Logo size={26} />
              EcoGrid
            </div>
            <p style={{ marginTop: 12, maxWidth: 300, color: 'var(--ink-4)' }}>
              Clean power, proven at the source.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title} className="footer-col">
              <div className="label" style={{ letterSpacing: '0.12em', marginBottom: 14 }}>
                {col.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map(([text, href]) => (
                  <a
                    key={text}
                    href={href}
                    {...(href!.startsWith('http')
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {text}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 44, maxWidth: 900, fontSize: 13.5, color: 'var(--ink-5)' }}>
          $GRID is a utility token that rewards verified energy reporting and pays for data access.
          It is not an investment, an equity interest, a carbon credit or a claim on electricity.
          Token prices can fall to zero. Nothing on this site is financial advice. Check the rules
          where you live before taking part.
        </p>
        <p
          className="mono"
          style={{ marginTop: 14, fontSize: 11.5, letterSpacing: '0.06em', color: 'var(--ink-5)' }}
        >
          © {new Date().getFullYear()} ECOGRID PROTOCOL
        </p>
      </div>
    </footer>
  );
}

export default function Landing() {
  const net = useSimulatedNetwork();
  return (
    <>
      <a className="skip" href="#protocol">
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero solarKw={net.solarKw} windKw={net.windKw} />
        <Protocol feed={net.feed} kwh={net.kwh} readings={net.readings} accepted={net.accepted} />
        <Meters />
        <Flow />
        <Agents />
        <Rewards />
        <Blueprint />
        <Functions />
        <Tokenomics />
        <Contracts />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </>
  );
}

import { lazy, Suspense, useCallback, useState } from 'react';
import { ActivityPanel } from './components/ActivityPanel';
import { AgentsPanel } from './components/AgentsPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { Header } from './components/Header';
import { MeterCard } from './components/MeterCard';
import {
  AgentApiModal,
  LogGenerationModal,
  RegisterMeterModal,
  RewardsModal,
} from './components/Modals';
import { OverviewPanel, type ActionId } from './components/OverviewPanel';
import { useLiveData } from './hooks/useLiveData';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useWallet } from './hooks/useWallet';

// three.js is large, so the 3D view loads in its own chunk after the panels render.
const MicrogridCanvas = lazy(() => import('./scene/MicrogridCanvas'));

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'agents', label: 'Agents' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'activity', label: 'Activity' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const live = useLiveData();
  const wallet = useWallet();
  const [selected, setSelected] = useState<string | null>(null);
  const [modal, setModal] = useState<ActionId | null>(null);
  const [tab, setTab] = useState<TabId>('overview');
  const [rotateMode, setRotateMode] = useState(false);
  const closeModal = useCallback(() => setModal(null), []);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTouch = useMediaQuery('(pointer: coarse)');
  // On touch screens the 3D view only grabs gestures in rotate mode, so the page still scrolls.
  const interactive = !isTouch || rotateMode;
  const selectedMeter = live.meters.find((m) => m.address === selected) ?? null;
  // On phones only the active tab shows; from tablet up every panel is visible.
  const tabClass = (id: TabId) => (tab === id ? '' : 'hidden md:block');

  return (
    <div className="relative min-h-full lg:h-full lg:overflow-hidden">
      <div className="sticky top-0 z-30 border-b border-night-line bg-night/90 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:pointer-events-none lg:absolute lg:inset-x-0 lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
        <Header
          status={live.status}
          connected={live.connected}
          client={live.client}
          wallet={wallet}
          onOpenRewards={() => setModal('rewards')}
        />
      </div>

      <div className="relative h-[52svh] min-h-[300px] md:h-[56svh] lg:absolute lg:inset-0 lg:h-auto">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-ink-muted">
              Loading the microgrid…
            </div>
          }
        >
          <MicrogridCanvas
            meters={live.meters}
            selected={selected}
            onSelect={setSelected}
            pulses={live.pulses}
            agents={live.agents}
            agentPulses={live.agentPulses}
            interactive={interactive}
            showTooltips={isDesktop}
            compact={!isDesktop}
          />
        </Suspense>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 lg:hidden">
          {selectedMeter && <MeterCard meter={selectedMeter} onClose={() => setSelected(null)} />}
          <div className="flex items-center justify-between gap-2">
            <p className="rounded-full bg-night-deep/80 px-3 py-1.5 text-xs text-ink-muted">
              {rotateMode ? 'Drag to rotate, pinch to zoom' : 'Tap a node for live readings'}
            </p>
            {isTouch && (
              <button
                type="button"
                onClick={() => setRotateMode((r) => !r)}
                aria-pressed={rotateMode}
                className={`btn pointer-events-auto min-h-[40px] px-3 text-sm ${rotateMode ? 'bg-wind text-night-deep' : 'border border-night-line bg-night-deep/80 text-ink'}`}
              >
                {rotateMode ? 'Done' : 'Rotate view'}
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="relative flex flex-col gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:grid md:grid-cols-2 md:items-start lg:pointer-events-none lg:absolute lg:inset-0 lg:grid-cols-[380px_1fr_380px] lg:items-stretch lg:gap-5 lg:p-6 lg:pt-20">
        <h1 className="sr-only">EcoGrid microgrid dashboard</h1>
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="grid grid-cols-4 gap-1 rounded-tile border border-night-line bg-night-deep p-1 md:hidden"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`min-h-[44px] rounded-[8px] text-[13px] font-bold transition-colors sm:text-sm ${tab === t.id ? 'bg-night-line text-ink' : 'text-ink-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          id="panel-overview"
          role="tabpanel"
          aria-labelledby="tab-overview"
          className={`${tabClass('overview')} flex-col gap-4 lg:pointer-events-auto lg:flex lg:min-h-0 lg:overflow-y-auto`}
        >
          <OverviewPanel
            stats={live.stats}
            meters={live.meters}
            selected={selected}
            onSelect={setSelected}
            onAction={setModal}
          />
        </div>

        <div className="hidden items-end justify-center pb-2 lg:flex">
          <p className="rounded-full bg-night-deep/70 px-4 py-2 text-sm text-ink-muted">
            {selected
              ? 'Click empty space to deselect'
              : 'Drag to orbit. Hover a node for live readings.'}
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:pointer-events-auto lg:min-h-0 lg:overflow-y-auto">
          <div
            id="panel-agents"
            role="tabpanel"
            aria-labelledby="tab-agents"
            className={tabClass('agents')}
          >
            <AgentsPanel
              market={live.market}
              agents={live.agents}
              onOpenApi={() => setModal('api')}
            />
          </div>
          <div
            id="panel-analytics"
            role="tabpanel"
            aria-labelledby="tab-analytics"
            className={tabClass('analytics')}
          >
            <AnalyticsPanel stats={live.stats} series={live.series} />
          </div>
          <div
            id="panel-activity"
            role="tabpanel"
            aria-labelledby="tab-activity"
            className={tabClass('activity')}
          >
            <ActivityPanel activity={live.activity} onchain={live.status?.chain?.mode === 'evm'} />
          </div>
        </div>
      </main>

      {live.error && (
        <p
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-tile bg-bad px-4 py-2 text-center text-sm font-bold text-night-deep"
          role="alert"
        >
          Couldn’t refresh data: {live.error}
        </p>
      )}
      {modal === 'register' && (
        <RegisterMeterModal
          client={live.client}
          onClose={closeModal}
          onDone={() => void live.refresh()}
        />
      )}
      {modal === 'log' && <LogGenerationModal client={live.client} onClose={closeModal} />}
      {modal === 'api' && <AgentApiModal market={live.market} onClose={closeModal} />}
      {modal === 'rewards' && (
        <RewardsModal wallet={wallet} meters={live.meters} onClose={closeModal} />
      )}
    </div>
  );
}

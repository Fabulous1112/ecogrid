import { Grid, Html, Line, OrbitControls, Stars } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { formatPower, isOnline, KINDS } from '../lib/format';
import type { Agent, Meter } from '../lib/types';
import { layoutMeters } from './layout';

const damp = THREE.MathUtils.damp;
const BODY = '#1B3A41';
const POLE = '#2C5059';
const AGENT_COLOR = '#E6F7F2';
const HUB = new THREE.Vector3(0, 2.2, 0);

type Ratio = RefObject<number>;

/** A material whose glow follows a 0..1 output ratio. */
function useGlow(
  color: string,
  ratio: Ratio,
  {
    base = 0.15,
    gain = 2.4,
    ...rest
  }: Partial<THREE.MeshStandardMaterialParameters> & { base?: number; gain?: number } = {},
) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0F2A30',
        emissive: color,
        emissiveIntensity: base,
        roughness: 0.35,
        metalness: 0.4,
        ...rest,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color],
  );
  useFrame((_, dt) => {
    material.emissiveIntensity = damp(
      material.emissiveIntensity,
      base + (ratio.current ?? 0) * gain,
      3,
      dt,
    );
  });
  return material;
}

/** A number that eases toward `target` every frame. */
function useEased(target: number): Ratio {
  const value = useRef(target);
  const goal = useRef(target);
  goal.current = target;
  useFrame((_, dt) => {
    value.current = damp(value.current, goal.current, 2.5, dt);
  });
  return value;
}

function Pad({ color, selected }: { color: string; selected: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[1.7, 1.8, 0.08, 6]} />
        <meshStandardMaterial color="#0E252B" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
        <ringGeometry args={[1.6, 1.7, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.95 : 0.35}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

interface NodeProps {
  ratio: Ratio;
  color: string;
  reducedMotion: boolean;
}

function SolarArray({ ratio, color }: NodeProps) {
  const glow = useGlow(color, ratio, { base: 0.1, gain: 2.6, color: '#14303A' });
  const panels: [number, number][] = [];
  for (let x = -1; x <= 1; x++) for (let z = 0; z <= 1; z++) panels.push([x * 0.95, z]);
  return (
    <group>
      {panels.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0.55, z - 0.5]} rotation={[-0.55, 0, 0]}>
          <mesh material={glow}>
            <boxGeometry args={[0.86, 0.04, 0.82]} />
          </mesh>
          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.86, 0.82, 4, 4]} />
            <meshBasicMaterial color="#0C1F24" wireframe transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, -0.28, 0.2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.5]} />
            <meshStandardMaterial color={POLE} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WindTurbine({ ratio, color, reducedMotion }: NodeProps) {
  const rotor = useRef<THREE.Group>(null);
  const glow = useGlow(color, ratio, { base: 0.2, gain: 2.2 });
  useFrame((_, dt) => {
    if (rotor.current)
      rotor.current.rotation.z -= (reducedMotion ? 0.2 : 0.3 + (ratio.current ?? 0) * 6) * dt;
  });
  return (
    <group>
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.07, 0.14, 3.3, 12]} />
        <meshStandardMaterial color="#C9D8D5" roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.4, -0.1]}>
        <boxGeometry args={[0.28, 0.26, 0.6]} />
        <meshStandardMaterial color="#C9D8D5" roughness={0.5} />
      </mesh>
      <group ref={rotor} position={[0, 3.4, 0.25]}>
        <mesh material={glow}>
          <sphereGeometry args={[0.13, 16, 16]} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <mesh position={[0, 0.8, 0]}>
              <boxGeometry args={[0.12, 1.5, 0.03]} />
              <meshStandardMaterial color="#DDE8E5" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.5, 0.02]} material={glow}>
              <boxGeometry args={[0.1, 0.12, 0.02]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function BatteryBank({ ratio, color, soc }: NodeProps & { soc: Ratio }) {
  const glow = useGlow(color, ratio, { base: 0.5, gain: 2 });
  const fills = useRef<(THREE.Mesh | null)[]>([]);
  const fillGeometry = useMemo(() => new THREE.BoxGeometry(0.36, 1, 0.02).translate(0, 0.5, 0), []);
  useFrame((_, dt) => {
    for (const fill of fills.current) {
      if (fill) fill.scale.y = damp(fill.scale.y, Math.max(0.04, soc.current ?? 0), 2, dt);
    }
  });
  return (
    <group>
      {[-0.75, 0, 0.75].map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[0.6, 1.25, 0.85]} />
            <meshStandardMaterial color={BODY} roughness={0.7} metalness={0.3} />
          </mesh>
          <group position={[0, 0.16, 0.43]}>
            <mesh
              ref={(m) => (fills.current[i] = m)}
              geometry={fillGeometry}
              material={glow}
              scale={[1, 0.5, 1]}
            />
          </group>
        </group>
      ))}
    </group>
  );
}

function EvCharger({ ratio, color }: NodeProps) {
  const glow = useGlow(color, ratio, { base: 0.1, gain: 2.8 });
  return (
    <group>
      {[-0.55, 0.55].map((x) => (
        <group key={x} position={[x, 0, -0.3]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.42, 1.3, 0.28]} />
            <meshStandardMaterial color={BODY} roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.95, 0.145]} material={glow}>
            <planeGeometry args={[0.28, 0.36]} />
          </mesh>
          <mesh position={[0.24, 0.55, 0.1]} rotation={[0, 0, Math.PI / 2]} material={glow}>
            <torusGeometry args={[0.18, 0.025, 8, 24, Math.PI]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.095, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.6, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Hub({ load, reducedMotion }: { load: Ratio; reducedMotion: boolean }) {
  const ring = useRef<THREE.Group>(null);
  const glow = useGlow('#6FD6E8', load, { base: 0.15, gain: 1.1, color: '#163A42' });
  useFrame((_, dt) => {
    if (!reducedMotion && ring.current)
      ring.current.rotation.y += dt * (0.2 + (load.current ?? 0) * 1.2);
  });
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.5, 1.7, 0.3, 6]} />
        <meshStandardMaterial color="#10292F" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.2, 0]} material={glow}>
        <cylinderGeometry args={[0.32, 0.42, 1.9, 6]} />
      </mesh>
      <group ref={ring} position={[0, 1.4, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.03, 8, 6]} />
          <meshBasicMaterial color="#6FD6E8" toneMapped={false} transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

const PARTICLES = 9;
const scratch = new THREE.Object3D();

/** Energy particles travelling along an arc between a meter and the hub. */
function FlowLine({
  from,
  color,
  ratio,
  inward,
  reducedMotion,
}: {
  from: [number, number, number];
  color: string;
  ratio: Ratio;
  inward: boolean;
  reducedMotion: boolean;
}) {
  const curve = useMemo(() => {
    const start = new THREE.Vector3(from[0], 0.35, from[2]);
    const end = new THREE.Vector3(0, 0.9, 0);
    const mid = start.clone().lerp(end, 0.5);
    mid.y = 2.4 + start.length() * 0.08;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from[0], from[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  const points = useMemo(() => curve.getPoints(40), [curve]);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const phase = useRef(Math.random());
  useFrame((_, dt) => {
    if (!mesh.current) return;
    const r = ratio.current ?? 0;
    phase.current = (phase.current + dt * (reducedMotion ? 0.05 : 0.15 + r * 0.9)) % 1;
    for (let i = 0; i < PARTICLES; i++) {
      let t = (phase.current + i / PARTICLES) % 1;
      if (!inward) t = 1 - t;
      scratch.position.copy(curve.getPointAt(t));
      scratch.scale.setScalar(r < 0.02 ? 0 : 0.6 + r * 0.8);
      scratch.updateMatrix();
      mesh.current.setMatrixAt(i, scratch.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <Line points={points} color={color} lineWidth={1} transparent opacity={0.28} />
      <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLES]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

const BEAM_SECONDS = 1.1;

function AgentDrone({
  agent,
  index,
  count,
  pulseAt,
  reducedMotion,
  showTooltip,
}: {
  agent: Agent;
  index: number;
  count: number;
  pulseAt?: number;
  reducedMotion: boolean;
  showTooltip: boolean;
}) {
  const body = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>(null);
  const beam = useRef<THREE.Line>(null);
  const [hovered, setHovered] = useState(false);
  const angle0 = (index / Math.max(1, count)) * Math.PI * 2;
  const radius = 4.2 + (index % 2) * 0.9;
  const height = 6 + (index % 3) * 0.6;
  const beamGeometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([HUB.clone(), HUB.clone()]),
    [],
  );
  const beamLine = useMemo(
    () =>
      new THREE.Line(
        beamGeometry,
        new THREE.LineBasicMaterial({
          color: AGENT_COLOR,
          transparent: true,
          opacity: 0.8,
          toneMapped: false,
        }),
      ),
    [beamGeometry],
  );

  useFrame((state, dt) => {
    if (!body.current || !core.current) return;
    const a = state.clock.elapsedTime * (reducedMotion ? 0.02 : 0.12) + angle0;
    const pos = new THREE.Vector3(
      Math.cos(a) * radius,
      height + Math.sin(a * 2.3) * 0.25,
      Math.sin(a) * radius,
    );
    body.current.position.copy(pos);
    if (!reducedMotion) core.current.rotation.y += dt * 1.2;
    const age = (Date.now() - (pulseAt ?? 0)) / 1000;
    const active = Boolean(pulseAt) && age < BEAM_SECONDS;
    beamLine.visible = active;
    if (active) {
      const attr = beamGeometry.attributes.position as THREE.BufferAttribute;
      attr.setXYZ(0, HUB.x, HUB.y, HUB.z);
      attr.setXYZ(1, pos.x, pos.y, pos.z);
      attr.needsUpdate = true;
      (beamLine.material as THREE.LineBasicMaterial).opacity = 0.85 * (1 - age / BEAM_SECONDS);
    }
    const target = active ? 2.6 * (1 - age / BEAM_SECONDS) + 0.9 : 0.9;
    core.current.material.emissiveIntensity = damp(
      core.current.material.emissiveIntensity,
      target,
      6,
      dt,
    );
  });

  return (
    <>
      <primitive object={beamLine} ref={beam} />
      <group ref={body}>
        <mesh
          ref={core}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial
            color="#1A2A2E"
            emissive={AGENT_COLOR}
            emissiveIntensity={0.9}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.012, 6, 32]} />
          <meshBasicMaterial color={AGENT_COLOR} transparent opacity={0.35} toneMapped={false} />
        </mesh>
        {showTooltip && hovered && (
          <Html
            position={[0, 0.9, 0]}
            center
            zIndexRange={[20, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div className="w-max rounded-tile border border-night-line bg-night-deep/95 px-3 py-2 text-sm shadow-lg">
              <div className="font-display font-bold text-ink">{agent.label || 'AI agent'}</div>
              <div className="text-ink-muted">
                {(agent.queries ?? 0).toLocaleString()} data requests
              </div>
              {agent.lastEndpoint && (
                <div className="text-ink-faint">Last: {agent.lastEndpoint}</div>
              )}
            </div>
          </Html>
        )}
      </group>
    </>
  );
}

function Ripple({ at, color }: { at?: number; color: string }) {
  const ring = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>(null);
  useFrame(() => {
    if (!ring.current) return;
    const age = (Date.now() - (at ?? 0)) / 1000;
    const active = Boolean(at) && age < 1.4;
    ring.current.visible = active;
    if (active) {
      ring.current.scale.setScalar(1 + age * 1.6);
      ring.current.material.opacity = 0.7 * (1 - age / 1.4);
    }
  });
  return (
    <mesh ref={ring} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[1, 1.08, 48]} />
      <meshBasicMaterial color={color} transparent toneMapped={false} />
    </mesh>
  );
}

function MeterNode({
  meter,
  position,
  selected,
  onSelect,
  pulseAt,
  reducedMotion,
  showTooltip,
}: {
  meter: Meter;
  position: [number, number, number];
  selected: boolean;
  onSelect: (a: string) => void;
  pulseAt?: number;
  reducedMotion: boolean;
  showTooltip: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const kind = KINDS[meter.kind] ?? KINDS.solar;
  const online = isOnline(meter);
  const ratio = useEased(online ? Math.min(1, meter.lastPowerW / meter.capacityW) : 0);
  const soc = useEased((meter.telemetry?.socPct ?? 50) / 100);
  const props = { ratio, color: kind.color, reducedMotion };
  return (
    <group position={position}>
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(meter.address);
        }}
      >
        <Pad color={kind.color} selected={selected} />
        {meter.kind === 'solar' && <SolarArray {...props} />}
        {meter.kind === 'wind' && <WindTurbine {...props} />}
        {meter.kind === 'battery' && <BatteryBank {...props} soc={soc} />}
        {meter.kind === 'ev' && <EvCharger {...props} />}
      </group>
      <Ripple at={pulseAt} color={kind.color} />
      {showTooltip && (hovered || selected) && (
        <Html
          position={[0, meter.kind === 'wind' ? 5 : 2.4, 0]}
          center
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="w-max min-w-[170px] rounded-tile border border-night-line bg-night-deep/95 px-3 py-2 text-left text-sm shadow-lg">
            <div className="font-display font-bold" style={{ color: kind.color }}>
              {meter.label}
            </div>
            <div className="text-ink">
              {formatPower(online ? meter.lastPowerW : 0)} of {formatPower(meter.capacityW)}
            </div>
            {meter.kind === 'battery' && meter.telemetry?.socPct != null && (
              <div className="text-ink-muted">
                {meter.telemetry.socPct}% charged (device-reported)
              </div>
            )}
            <div className="text-ink-muted">
              {online
                ? meter.rewardable
                  ? 'Signed readings, earning $GRID'
                  : 'Signed readings, not rewarded'
                : 'Offline'}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function FlowFor({
  meter,
  position,
  reducedMotion,
}: {
  meter: Meter;
  position: [number, number, number];
  reducedMotion: boolean;
}) {
  const ratio = useEased(isOnline(meter) ? Math.min(1, meter.lastPowerW / meter.capacityW) : 0);
  return (
    <FlowLine
      from={position}
      color={KINDS[meter.kind]?.color ?? '#fff'}
      ratio={ratio}
      inward={meter.kind !== 'ev'}
      reducedMotion={reducedMotion}
    />
  );
}

/** Keeps the whole grid in frame on tall phone screens. */
function ResponsiveFov() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const halfH = (14.5 * Math.PI) / 180;
    cam.fov =
      aspect >= 1.3
        ? 38
        : Math.min(60, Math.max(34, (2 * Math.atan(Math.tan(halfH) / aspect) * 180) / Math.PI));
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

interface SceneProps {
  meters: Meter[];
  selected: string | null;
  onSelect: (a: string | null) => void;
  pulses: Record<string, number>;
  agents: Agent[];
  agentPulses: Record<string, number>;
  reducedMotion: boolean;
  interactive: boolean;
  showTooltips: boolean;
}

function Scene({
  meters,
  selected,
  onSelect,
  pulses,
  agents,
  agentPulses,
  reducedMotion,
  interactive,
  showTooltips,
}: SceneProps) {
  const key = meters.map((m) => m.address).join();
  const positions = useMemo(() => layoutMeters(meters), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const rewardable = meters.filter((m) => m.rewardable);
  const capacity = rewardable.reduce((a, m) => a + m.capacityW, 0) || 1;
  const output = rewardable.reduce((a, m) => a + (m.lastPowerW || 0), 0);
  const load = useEased(Math.min(1, output / capacity));
  const shownAgents = agents.slice(0, 8);

  return (
    <>
      <color attach="background" args={['#0C1F24']} />
      <fog attach="fog" args={['#0C1F24', 22, 48]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#BFE9F2', '#0C1F24', 0.6]} />
      <directionalLight position={[8, 14, 6]} intensity={1.1} color="#FFE7B8" />
      <Stars
        radius={70}
        depth={30}
        count={1400}
        factor={2.5}
        fade
        speed={reducedMotion ? 0 : 0.4}
      />
      <Grid
        position={[0, 0, 0]}
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#17383F"
        sectionSize={4}
        sectionThickness={1}
        sectionColor="#24515A"
        fadeDistance={42}
        fadeStrength={1.5}
        infiniteGrid
      />
      <Hub load={load} reducedMotion={reducedMotion} />
      {shownAgents.map((a, i) => (
        <AgentDrone
          key={a.address}
          agent={a}
          index={i}
          count={shownAgents.length}
          pulseAt={agentPulses[a.address]}
          reducedMotion={reducedMotion}
          showTooltip={showTooltips}
        />
      ))}
      {meters.map((m, i) => (
        <group key={m.address}>
          <FlowFor meter={m} position={positions[i]!} reducedMotion={reducedMotion} />
          <MeterNode
            meter={m}
            position={positions[i]!}
            selected={selected === m.address}
            onSelect={onSelect}
            pulseAt={pulses[m.address]}
            reducedMotion={reducedMotion}
            showTooltip={showTooltips}
          />
        </group>
      ))}
      <ResponsiveFov />
      <OrbitControls
        makeDefault
        enabled={interactive}
        enablePan={false}
        minDistance={10}
        maxDistance={40}
        maxPolarAngle={1.32}
        autoRotate={!reducedMotion && !selected}
        autoRotateSpeed={0.35}
        enableDamping
      />
      <EffectComposer enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.2} intensity={0.9} />
      </EffectComposer>
    </>
  );
}

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full items-center justify-center p-8 text-center text-ink-muted">
          The 3D view needs WebGL, which this browser has turned off. All the data is still in the
          panels.
        </div>
      );
    }
    return this.props.children;
  }
}

export interface MicrogridCanvasProps extends Omit<SceneProps, 'reducedMotion'> {
  compact?: boolean;
}

export default function MicrogridCanvas({
  compact = false,
  interactive,
  ...props
}: MicrogridCanvasProps) {
  const reducedMotion = useReducedMotion();
  return (
    <WebGLBoundary>
      <Canvas
        dpr={compact ? [1, 1.5] : [1, 2]}
        style={{ touchAction: interactive ? 'none' : 'pan-y' }}
        camera={{ position: [23, 17, 23], fov: 38 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => props.onSelect(null)}
        aria-label="3D view of the microgrid. Each node is a registered meter."
        role="img"
      >
        <Suspense fallback={null}>
          <Scene {...props} interactive={interactive} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </WebGLBoundary>
  );
}

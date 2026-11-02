// Hero background: streaks of energy flowing into a glowing point, like the grid's hub.
// Returns a cleanup function. Draws a still frame when the visitor prefers reduced motion.
export function startHeroField(canvas: HTMLCanvasElement, reducedMotion: boolean): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const COLORS = ['242,179,61', '111,214,232', '183,156,255', '255,138,107'];
  let w = 0;
  let h = 0;
  let raf = 0;

  interface Particle {
    x: number;
    y: number;
    v: number;
    c: string;
    swirl: number;
    life: number;
  }
  const parts: Particle[] = [];

  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.max(1, w * dpr);
    canvas.height = Math.max(1, h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const target = () => ({ x: w * 0.8, y: h * 0.42 });
  const spawn = (p: Partial<Particle> = {}): Particle => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.max(w, h) * (0.45 + Math.random() * 0.55);
    const t = target();
    return Object.assign(p, {
      x: t.x + Math.cos(a) * r,
      y: t.y + Math.sin(a) * r * 0.75,
      v: 0.6 + Math.random() * 1.6,
      c: COLORS[(Math.random() * (Math.random() < 0.6 ? 2 : 4)) | 0]!,
      swirl: (Math.random() - 0.5) * 0.9,
      life: 0,
    });
  };
  const step = (p: Particle, draw: boolean) => {
    const t = target();
    const dx = t.x - p.x;
    const dy = t.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = p.v * (1 + 240 / (d + 60));
    const nx = p.x + (dx / d) * speed + (-dy / d) * p.swirl * speed;
    const ny = p.y + (dy / d) * speed + (dx / d) * p.swirl * speed;
    if (draw) {
      ctx.strokeStyle = `rgba(${p.c},${Math.min(0.75, 0.12 + 60 / (d + 40))})`;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
    }
    p.x = nx;
    p.y = ny;
    p.life++;
    if (d < 14 || p.life > 2000) spawn(p);
  };
  const clear = () => {
    ctx.fillStyle = '#07080C';
    ctx.fillRect(0, 0, w, h);
  };
  const frame = () => {
    ctx.fillStyle = 'rgba(7,8,12,0.16)';
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1.1;
    for (const p of parts) step(p, true);
    const t = target();
    const glow = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, 90);
    glow.addColorStop(0, 'rgba(230,247,242,0.22)');
    glow.addColorStop(1, 'rgba(230,247,242,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 90, 0, Math.PI * 2);
    ctx.fill();
    if (!reducedMotion) raf = requestAnimationFrame(frame);
  };

  resize();
  for (let i = 0; i < 260; i++) {
    const p = spawn();
    for (let k = Math.random() * 200; k > 0; k--) step(p, false);
    parts.push(p);
  }
  clear();
  if (reducedMotion) for (let i = 0; i < 40; i++) frame();
  else frame();

  const onResize = () => {
    resize();
    clear();
  };
  window.addEventListener('resize', onResize);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}

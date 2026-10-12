import * as THREE from 'three';
import {F} from './fonts';
import {rand} from './ease';

const cache = new Map<string, THREE.Texture>();
const memo = <T extends THREE.Texture>(key: string, make: () => T): T => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
};

export type TextOpts = {
  text: string;
  font?: keyof typeof F;
  weight?: number | string;
  size?: number; // px in canvas
  color?: string;
  tracking?: number; // em
  align?: 'left' | 'center' | 'right';
  pad?: number;
  italic?: boolean;
  glow?: number;
  bg?: string | null;
  lines?: string[]; // multiline override
  lineHeight?: number;
};

/** Renders text to a canvas texture. Returns texture + aspect so planes can be sized exactly. */
export const textTexture = (o: TextOpts) => {
  const key = 'txt:' + JSON.stringify(o);
  const tex = memo(key, () => {
    const size = o.size ?? 96;
    const pad = o.pad ?? Math.round(size * 0.35);
    const lines = o.lines ?? [o.text];
    const font = `${o.italic ? 'italic ' : ''}${o.weight ?? 500} ${size}px ${F[o.font ?? 'mono']}`;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    ctx.font = font;
    const track = (o.tracking ?? 0) * size;
    const measure = (s: string) => ctx.measureText(s).width + track * Math.max(0, s.length - 1);
    const w = Math.ceil(Math.max(...lines.map(measure)) + pad * 2);
    const lh = size * (o.lineHeight ?? 1.25);
    const h = Math.ceil(lh * lines.length + pad * 2);
    c.width = w;
    c.height = h;
    const g = c.getContext('2d')!;
    if (o.bg) {
      g.fillStyle = o.bg;
      g.fillRect(0, 0, w, h);
    }
    g.font = font;
    g.fillStyle = o.color ?? '#ffffff';
    g.textBaseline = 'middle';
    if (o.glow) {
      g.shadowColor = o.color ?? '#fff';
      g.shadowBlur = o.glow;
    }
    lines.forEach((s, li) => {
      const lw = measure(s);
      let x = o.align === 'left' ? pad : o.align === 'right' ? w - pad - lw : (w - lw) / 2;
      const y = pad + lh * li + lh / 2;
      if (!track) g.fillText(s, x, y);
      else
        for (const ch of s) {
          g.fillText(ch, x, y);
          x += g.measureText(ch).width + track;
        }
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    (t as any).userData = {aspect: w / h};
    return t;
  });
  return {tex, aspect: (tex as any).userData.aspect as number};
};

const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true, repeat?: [number, number]) =>
  memo(key, () => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d')!);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(...repeat);
    }
    return t;
  });

/** Circuit board: solder mask, copper traces, pads, silkscreen. */
export const pcbTexture = (tint = '#0d3b2a') =>
  canvasTex('pcb' + tint, 1024, 1024, (g) => {
    g.fillStyle = tint;
    g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 260; i++) {
      const x = rand(i) * 1024, y = rand(i + 0.5) * 1024;
      g.strokeStyle = `rgba(214,170,90,${0.25 + rand(i + 3) * 0.4})`;
      g.lineWidth = 2 + rand(i + 9) * 4;
      g.beginPath();
      g.moveTo(x, y);
      const len = 40 + rand(i + 1) * 260;
      const horiz = rand(i + 2) > 0.5;
      const x2 = horiz ? x + len : x, y2 = horiz ? y : y + len;
      g.lineTo(x2, y2);
      g.lineTo(x2 + 30, y2 + 30);
      g.stroke();
      g.fillStyle = 'rgba(230,190,110,0.9)';
      g.beginPath();
      g.arc(x2 + 30, y2 + 30, 5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.font = `500 22px ${F.mono}`;
    ['U1', 'U3', 'C12', 'R7', 'WIFI', 'J2', 'CAM', 'PWR'].forEach((s, i) => g.fillText(s, 80 + (i % 4) * 230, 200 + Math.floor(i / 4) * 520));
  });

/** Brushed metal roughness map (streaks). */
export const brushedTexture = () =>
  canvasTex(
    'brushed',
    512,
    512,
    (g) => {
      g.fillStyle = '#808080';
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 2600; i++) {
        const y = rand(i) * 512;
        const v = 110 + rand(i + 7) * 60;
        g.strokeStyle = `rgba(${v},${v},${v},0.35)`;
        g.lineWidth = 0.5 + rand(i + 3);
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(512, y + (rand(i + 1) - 0.5) * 2);
        g.stroke();
      }
    },
    false,
    [2, 2],
  );

/** Speaker grille dots. */
export const grilleTexture = () =>
  canvasTex('grille', 256, 256, (g) => {
    g.fillStyle = '#1a1c1f';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#050506';
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      g.beginPath();
      g.arc(8 + x * 16 + (y % 2) * 8, 8 + y * 16, 4, 0, Math.PI * 2);
      g.fill();
    }
  });

/** Soft radial sprite for particles/glows. */
export const glowTexture = () =>
  canvasTex('glow', 128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
  });

/** Floor grid with fine lines. */
export const gridTexture = (line = 'rgba(120,170,220,0.22)', bg = '#05070a') =>
  canvasTex(
    'grid' + line + bg,
    512,
    512,
    (g) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, 512, 512);
      g.strokeStyle = line;
      g.lineWidth = 2;
      g.strokeRect(0, 0, 512, 512);
      g.lineWidth = 1;
      g.globalAlpha = 0.35;
      for (let i = 1; i < 8; i++) {
        g.beginPath();
        g.moveTo(i * 64, 0);
        g.lineTo(i * 64, 512);
        g.moveTo(0, i * 64);
        g.lineTo(512, i * 64);
        g.stroke();
      }
    },
    true,
    [40, 40],
  );

export const pegboardTexture = () =>
  canvasTex(
    'peg',
    512,
    512,
    (g) => {
      g.fillStyle = '#6b5640';
      g.fillRect(0, 0, 512, 512);
      g.fillStyle = '#2a2018';
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        g.beginPath();
        g.arc(16 + x * 32, 16 + y * 32, 4, 0, Math.PI * 2);
        g.fill();
      }
    },
    true,
    [3, 2],
  );

/** Generic canvas drawing to texture (cached by key). */
export const drawTexture = canvasTex;

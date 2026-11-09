/**
 * Rink furniture, pre-rendered once per layout: a halftone light pool, the
 * track, cobalt lane lines, the pink/sun chequered start line, painted lane
 * numbers, two-wheel tread marks and the barrier wall.
 */
import { hash } from "@/components/life/multiverse/ease";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import type { Layout } from "./layout";

export type Furniture = { canvas: HTMLCanvasElement; hx: number; hy: number };

export function renderFurniture(L: Layout, dpr: number, monoFamily: string): Furniture {
  const rot = L.psi !== 0;
  const hx = 1.56 * (rot ? L.b : L.a) + 10;
  const hy = 1.56 * (rot ? L.a : L.b) + 10;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(hx * 2 * dpr);
  canvas.height = Math.ceil(hy * 2 * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return { canvas, hx, hy };
  ctx.scale(dpr, dpr);
  ctx.translate(hx, hy);

  const { a, b } = L;

  // 1. halftone light pool — printed, not glowing
  {
    const sp = L.mobile ? 7 : 8;
    const ang = (15 * Math.PI) / 180;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const reach = Math.hypot(hx, hy);
    const ra = 1.5 * a;
    const rb = 1.5 * b;
    ctx.fillStyle = alpha(RISO.cobalt, 0.42);
    ctx.beginPath();
    for (let gy = -reach; gy <= reach; gy += sp) {
      for (let gx = -reach; gx <= reach; gx += sp) {
        const x = gx * ca - gy * sa;
        const y = gx * sa + gy * ca;
        if (Math.abs(x) > hx || Math.abs(y) > hy) continue;
        // into the ellipse frame
        const ex = rot ? y : x;
        const ey = rot ? -x : y;
        const q = Math.sqrt((ex / ra) ** 2 + (ey / rb) ** 2);
        if (q >= 1) continue;
        const r = 2.1 * Math.pow(1 - q, 0.85) * (0.78 + 0.22 * Math.cos(q * 9));
        if (r < 0.25) continue;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  ctx.rotate(L.psi);

  const ellipse = (k: number) => {
    ctx.beginPath();
    ctx.ellipse(0, 0, a * k, b * k, 0, 0, Math.PI * 2);
  };

  // 2. track surface
  ctx.beginPath();
  ctx.ellipse(0, 0, a * 1.2, b * 1.2, 0, 0, Math.PI * 2);
  ctx.ellipse(0, 0, a * 0.8, b * 0.8, 0, 0, Math.PI * 2, true);
  ctx.fillStyle = alpha(RISO.cobalt, 0.09);
  ctx.fill();

  // 3. lane lines (cobalt @ ~35%)
  ctx.strokeStyle = alpha(RISO.cobalt, 0.5);
  ctx.lineWidth = 1.6;
  ellipse(0.8);
  ctx.stroke();
  ellipse(1.2);
  ctx.stroke();
  ctx.strokeStyle = alpha(RISO.cobalt, 0.36);
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 9]);
  ellipse(0.9333);
  ctx.stroke();
  ellipse(1.0667);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. tread marks — two wheels, two lines
  ctx.strokeStyle = alpha(RISO.paper, 0.06);
  ctx.lineWidth = 1;
  for (let i = 0; i < 11; i++) {
    const k = 0.84 + hash(i * 4.7) * 0.32;
    const t0 = hash(i * 2.3) * Math.PI * 2;
    const len = 0.35 + hash(i * 8.1) * 0.7;
    for (const off of [0, 0.011]) {
      ctx.beginPath();
      ctx.ellipse(0, 0, a * (k + off), b * (k + off), 0, t0, t0 + len);
      ctx.stroke();
    }
  }

  // 5. chequered start line across the track at θ0
  {
    const onTurn = Math.abs(Math.sin(L.theta0)) < 0.5;
    const R = onTurn ? a : b;
    ctx.save();
    if (onTurn) ctx.rotate(-Math.PI / 2);
    const rows = 6;
    const y0 = 0.8 * R;
    const q = (0.4 * R) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 2; c++) {
        ctx.fillStyle = (r + c) % 2 ? RISO.sun : RISO.pink;
        ctx.globalAlpha = 0.92;
        ctx.fillRect(-q + c * q, y0 + r * q, q, q);
      }
    }
    ctx.globalAlpha = 1;
    // painted lane numbers, just behind the line
    ctx.fillStyle = alpha(RISO.paper, 0.3);
    ctx.font = `600 ${Math.max(9, 0.075 * b)}px ${monoFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lanes = [0.8667, 1.0, 1.1333];
    lanes.forEach((k, i) => {
      ctx.save();
      ctx.translate(-q * 3.2, k * R);
      ctx.rotate(-L.psi + (onTurn ? Math.PI / 2 : 0));
      ctx.fillText(String(i + 1), 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  // 6. barrier wall + ticks
  ctx.strokeStyle = alpha(RISO.paper, 0.15);
  ctx.lineWidth = 1.5;
  ellipse(1.44);
  ctx.stroke();
  ctx.strokeStyle = alpha(RISO.paper, 0.07);
  ctx.lineWidth = 1;
  ellipse(1.5);
  ctx.stroke();
  ctx.strokeStyle = alpha(RISO.paper, 0.12);
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    ctx.beginPath();
    ctx.moveTo(a * 1.44 * c, b * 1.44 * s);
    ctx.lineTo(a * (i % 6 === 0 ? 1.5 : 1.47) * c, b * (i % 6 === 0 ? 1.5 : 1.47) * s);
    ctx.stroke();
  }

  // 7. infield centre mark
  ctx.strokeStyle = alpha(RISO.cobalt, 0.45);
  ctx.lineWidth = 1;
  const cm = 0.06 * b;
  ctx.beginPath();
  ctx.moveTo(-cm, 0);
  ctx.lineTo(cm, 0);
  ctx.moveTo(0, -cm);
  ctx.lineTo(0, cm);
  ctx.stroke();

  return { canvas, hx, hy };
}

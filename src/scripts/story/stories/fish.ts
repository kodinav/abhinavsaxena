import { place, figure, bridge, fish as fishShape, type Pose } from '../shapes';
import { seg, figureAt, type Scene, type SceneFn, type StoryVisuals } from '../kit';

/** "The happy fish" — for Correspondence: Chuang Tzŭ and Hui Tzŭ on the bridge over the Hao (Zhuangzi 17). */
type C = CanvasRenderingContext2D;
const ASPECT = 1.4;
const CHUANG: Pose = { robe: true, head: 'beard', front: [40, 50], back: [10, 10], bend: 8 };
const HUI: Pose = { robe: true, facing: -1, front: [70, 20], back: [15, 15] };
const DRAWS = [
  (c: C, W: number, H: number) => bridge(c, W * 0.1, H * 0.42, W * 0.8, H * 0.28),
  (c: C, W: number, H: number) => figure(c, W * 0.42, H * 0.4, H * 0.3, CHUANG),
  (c: C, W: number, H: number) => figure(c, W * 0.58, H * 0.4, H * 0.3, HUI),
  ...[0, 1, 2].map((i) => (c: C, W: number, H: number) => place(c, fishShape, W * (0.3 + i * 0.2), H * (0.86 + (i % 2) * 0.05), H * 0.07)),
];

function scene(s: Scene, speaker: 'none' | 'chuang' | 'hui', line: string | null) {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.4); look.formTint = 0.03; look.veil = 0.3; look.stageDim = 0.35;
  s.form('bridge', 0.32, DRAWS);
  // the minnows dart about
  [0, 1, 2].forEach((i) => {
    const g = 3 + i;
    s.groups[g * 4] = 0.07 * Math.sin(s.clock * (0.9 + i * 0.35) + i * 2) - 0.03 * Math.sin(s.clock * 2.7 + i);
    s.groups[g * 4 + 1] = 0.015 * Math.sin(s.clock * 3.1 + i * 1.7);
    s.groups[g * 4 + 3] = 0.35;
  });
  // the water under the bridge
  for (let r = 0; r < 3; r++) {
    const pts: number[] = [];
    for (let i = 0; i <= 24; i++) { const u = 0.04 + (i / 24) * 0.92; const v = 0.8 + r * 0.06 + 0.008 * Math.sin(u * 22 + s.clock * (1.2 + r * 0.3)); pts.push(...s.px(u, v)); }
    s.line(pts);
  }
  // whoever is speaking, glows; a line goes to the other
  const k = seg(t, 0.6, 1.4) * (1 - seg(t, s.d - 0.6, s.d));
  const c = figureAt(s, 0.42, 0.4, 0.3, CHUANG).head, hh = figureAt(s, 0.58, 0.4, 0.3, HUI).head;
  s.groups[1 * 4 + 3] = speaker === 'chuang' ? 0.8 * k : 0;
  s.groups[2 * 4 + 3] = speaker === 'hui' ? 0.8 * k : 0;
  if (speaker !== 'none') {
    const [a, b] = speaker === 'chuang' ? [c, hh] : [hh, c];
    s.glow(a[0], a[1] - h * 0.07, 14, k);
    s.line([a[0], a[1] - h * 0.07, a[0] + (b[0] - a[0]) * 0.8 * k, a[1] - h * 0.07 - h * 0.04 * Math.sin(Math.PI * 0.8 * k)]);
  }
  s.label(0, x + w * 0.38, y + h * 0.47, 'Chuang Tzŭ', 0.85 * seg(t, 0.4, 1.2));
  s.label(1, x + w * 0.62, y + h * 0.47, 'Hui Tzŭ', 0.85 * seg(t, 0.4, 1.2));
  if (line) s.label(2, x + w * 0.5, y + h * 0.97, line, k);
  look.light = [x + w * 0.5, y + h * 0.35, w * 0.45, 0.2]; look.lightColor = pal.day;
}

export const fish: StoryVisuals = {
  id: 'fish',
  aspect: ASPECT,
  loop: false,
  scenes: [
    (s) => scene(s, 'chuang', 'the pleasure of fishes'),
    (s) => scene(s, 'hui', null),
    (s) => scene(s, 'chuang', null),
    (s) => scene(s, 'hui', null),
    (s) => scene(s, 'chuang', 'from my own feelings on this bridge'),
  ],
  stills: [6, 5, 5, 5, 7],
};

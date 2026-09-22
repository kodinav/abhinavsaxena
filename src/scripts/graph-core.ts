import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';

export interface GNode extends SimulationNodeDatum {
  id: string;
  label: string;
  r: number;
  hx?: number; // hinted x (0..1)
  hy?: number; // hinted y (0..1)
  [k: string]: unknown;
}
export interface GLink extends SimulationLinkDatum<GNode> {
  source: string | GNode;
  target: string | GNode;
  [k: string]: unknown;
}

const NS = 'http://www.w3.org/2000/svg';
export function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/**
 * Runs a force layout to completion synchronously (small graphs only) and
 * returns the nodes with x/y filled in, constrained to the box with padding.
 */
export function layout(
  nodes: GNode[],
  links: GLink[],
  W: number,
  H: number,
  opts: { linkDistance?: number; charge?: number; collide?: number; hintStrength?: number; ticks?: number; pad?: number } = {},
) {
  const { linkDistance = 160, charge = -420, collide = 46, hintStrength = 0.12, ticks = 300, pad = 60 } = opts;
  for (const n of nodes) {
    if (n.x == null) n.x = (n.hx ?? Math.random()) * W;
    if (n.y == null) n.y = (n.hy ?? Math.random()) * H;
  }
  const sim = forceSimulation<GNode>(nodes)
    .force('link', forceLink<GNode, GLink>(links).id((d) => d.id).distance(linkDistance).strength(0.5))
    .force('charge', forceManyBody().strength(charge))
    .force('collide', forceCollide<GNode>().radius((d) => d.r + collide))
    .force('x', forceX<GNode>((d) => (d.hx ?? 0.5) * W).strength(hintStrength))
    .force('y', forceY<GNode>((d) => (d.hy ?? 0.5) * H).strength(hintStrength))
    .stop();
  for (let i = 0; i < ticks; i++) {
    sim.tick();
    for (const n of nodes) {
      n.x = Math.max(pad, Math.min(W - pad, n.x!));
      n.y = Math.max(pad, Math.min(H - pad, n.y!));
    }
  }
  return nodes;
}

export function debounce<T extends (...a: any[]) => void>(fn: T, ms: number) {
  let t = 0;
  return (...a: Parameters<T>) => {
    clearTimeout(t);
    t = window.setTimeout(() => fn(...a), ms);
  };
}

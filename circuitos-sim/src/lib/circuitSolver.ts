import { Circuit, Comp, Result, Wire } from "./types";

export function pinsOf(c: Comp): [number, number][] {
  if (c.kind === "GND" || c.kind === "PROBE") {
    return [[c.x, c.y]];
  }
  const rot = ((c.rot % 4) + 4) % 4;
  const dx = [2, 0, -2, 0][rot];
  const dy = [0, 2, 0, -2][rot];
  return [
    [c.x, c.y],
    [c.x + dx, c.y + dy],
  ];
}

export function wirePoints(w: Wire): [number, number][] {
  return [
    [w.x1, w.y1],
    [w.x2, w.y2],
  ];
}

export function eng(value: number, unit = "", decimals = 2): string {
  if (!Number.isFinite(value) || Math.abs(value) < 1e-15) {
    return `0 ${unit}`.trim();
  }
  const prefixes = [
    { exp: -12, sym: "p" },
    { exp: -9, sym: "n" },
    { exp: -6, sym: "µ" },
    { exp: -3, sym: "m" },
    { exp: 0, sym: "" },
    { exp: 3, sym: "k" },
    { exp: 6, sym: "M" },
    { exp: 9, sym: "G" },
  ];

  const absVal = Math.abs(value);
  let chosen = prefixes[4];
  for (let i = prefixes.length - 1; i >= 0; i--) {
    if (absVal >= Math.pow(10, prefixes[i].exp)) {
      chosen = prefixes[i];
      break;
    }
  }
  if (absVal < 1e-12) chosen = prefixes[0];

  const scaled = value / Math.pow(10, chosen.exp);
  return `${scaled.toFixed(decimals)} ${chosen.sym}${unit}`.trim();
}

export class Simulator {
  private circuit: Circuit;
  public t = 0;
  public capV: Record<string, number> = {};
  public indI: Record<string, number> = {};

  constructor(circuit: Circuit, prev?: Simulator) {
    this.circuit = circuit;
    if (prev) {
      this.t = prev.t;
      this.capV = { ...prev.capV };
      this.indI = { ...prev.indI };
    }
  }

  step(dt: number): Result {
    this.t += dt;

    const parent: Record<string, string> = {};
    const find = (k: string): string => {
      if (!parent[k]) parent[k] = k;
      if (parent[k] !== k) parent[k] = find(parent[k]);
      return parent[k];
    };
    const union = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[ra] = rb;
    };

    const key = (x: number, y: number) => `${x},${y}`;

    for (const c of this.circuit.comps) {
      for (const [px, py] of pinsOf(c)) {
        find(key(px, py));
      }
    }

    for (const w of this.circuit.wires) {
      const kStart = key(w.x1, w.y1);
      const kEnd = key(w.x2, w.y2);
      union(kStart, kEnd);

      const minX = Math.min(w.x1, w.x2);
      const maxX = Math.max(w.x1, w.x2);
      const minY = Math.min(w.y1, w.y2);
      const maxY = Math.max(w.y1, w.y2);

      if (w.x1 === w.x2 || w.y1 === w.y2) {
        for (const k of Object.keys(parent)) {
          const [px, py] = k.split(",").map(Number);
          if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
            union(kStart, k);
          }
        }
      }
    }

    const gndRoots = new Set<string>();
    for (const c of this.circuit.comps) {
      if (c.kind === "GND") {
        const [gx, gy] = pinsOf(c)[0];
        gndRoots.add(find(key(gx, gy)));
      }
    }

    if (gndRoots.size === 0 && this.circuit.comps.length > 0) {
      const src =
        this.circuit.comps.find((c) => c.kind === "V" || c.kind === "AC") ??
        this.circuit.comps[0];
      const [gx, gy] = pinsOf(src)[0];
      gndRoots.add(find(key(gx, gy)));
    }

    const nodeIdx: Record<string, number> = {};
    let numNodes = 0;
    for (const k of Object.keys(parent)) {
      const r = find(k);
      if (!gndRoots.has(r) && nodeIdx[r] === undefined) {
        nodeIdx[r] = numNodes++;
      }
    }

    const idxOf = (x: number, y: number): number => {
      const r = find(key(x, y));
      return gndRoots.has(r) ? -1 : (nodeIdx[r] ?? -1);
    };

    const vBranches = this.circuit.comps.filter(
      (c) =>
        c.kind === "V" ||
        c.kind === "AC" ||
        c.kind === "L" ||
        c.kind === "AM" ||
        (c.kind === "SW" && c.closed),
    );

    const size = numNodes + vBranches.length;
    const nodeV: Record<string, number> = {};
    const branchI: Record<string, number> = {};
    const vDrop: Record<string, number> = {};

    if (size === 0) {
      return { t: this.t, nodeV, branchI, vDrop };
    }

    const A: number[][] = Array.from({ length: size }, () =>
      Array(size).fill(0),
    );
    const b: number[] = Array(size).fill(0);

    for (let i = 0; i < numNodes; i++) A[i][i] += 1e-12;

    const stampG = (n0: number, n1: number, g: number) => {
      if (n0 >= 0) A[n0][n0] += g;
      if (n1 >= 0) A[n1][n1] += g;
      if (n0 >= 0 && n1 >= 0) {
        A[n0][n1] -= g;
        A[n1][n0] -= g;
      }
    };

    const stampI = (n0: number, n1: number, curr: number) => {
      if (n0 >= 0) b[n0] -= curr;
      if (n1 >= 0) b[n1] += curr;
    };

    for (const c of this.circuit.comps) {
      if (c.kind === "GND" || c.kind === "PROBE") continue;
      const [p0, p1] = pinsOf(c);
      const n0 = idxOf(p0[0], p0[1]);
      const n1 = idxOf(p1[0], p1[1]);

      if (c.kind === "R") {
        stampG(n0, n1, 1 / Math.max(c.value, 1e-6));
      } else if (c.kind === "VM") {
        stampG(n0, n1, 1e-12);
      } else if (c.kind === "SW" && !c.closed) {
        stampG(n0, n1, 1e-12);
      } else if (c.kind === "I") {
        stampI(n0, n1, c.value);
      } else if (c.kind === "C") {
        const cap = Math.max(c.value, 1e-12);
        const geq = cap / dt;
        const vPrev = this.capV[c.id] ?? 0;
        stampG(n0, n1, geq);
        stampI(n1, n0, geq * vPrev);
      }
    }

    vBranches.forEach((c, i) => {
      const row = numNodes + i;
      const [p0, p1] = pinsOf(c);
      const n0 = idxOf(p0[0], p0[1]);
      const n1 = idxOf(p1[0], p1[1]);

      if (n0 >= 0) {
        A[n0][row] += 1;
        A[row][n0] += 1;
      }
      if (n1 >= 0) {
        A[n1][row] -= 1;
        A[row][n1] -= 1;
      }

      if (c.kind === "V") {
        b[row] = c.value;
      } else if (c.kind === "AC") {
        const freq = c.value2 ?? 60;
        b[row] = c.value * Math.sin(2 * Math.PI * freq * this.t);
      } else if (c.kind === "AM" || c.kind === "SW") {
        b[row] = 0;
      } else if (c.kind === "L") {
        const req = Math.max(c.value, 1e-9) / dt;
        const iPrev = this.indI[c.id] ?? 0;
        A[row][row] -= req;
        b[row] = -req * iPrev;
      }
    });

    const sol = solveLinearSystem(A, b);

    for (const k of Object.keys(parent)) {
      const r = find(k);
      nodeV[k] = gndRoots.has(r) ? 0 : (sol[nodeIdx[r]] ?? 0);
    }

    vBranches.forEach((c, i) => {
      const curr = sol[numNodes + i] ?? 0;
      branchI[c.id] = curr;
      if (c.kind === "L") this.indI[c.id] = curr;
    });

    for (const c of this.circuit.comps) {
      if (c.kind === "GND" || c.kind === "PROBE") continue;
      const [p0, p1] = pinsOf(c);
      const v0 = nodeV[key(p0[0], p0[1])] ?? 0;
      const v1 = nodeV[key(p1[0], p1[1])] ?? 0;
      const vd = v0 - v1;
      vDrop[c.id] = vd;

      if (c.kind === "R") {
        branchI[c.id] = vd / Math.max(c.value, 1e-6);
      } else if (c.kind === "I") {
        branchI[c.id] = c.value;
      } else if (c.kind === "C") {
        const vPrev = this.capV[c.id] ?? 0;
        branchI[c.id] = (c.value * (vd - vPrev)) / dt;
        this.capV[c.id] = vd;
      }
    }

    return { t: this.t, nodeV, branchI, vDrop };
  }
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let col = 0; col < n; col++) {
    let maxR = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[maxR][col])) maxR = r;
    }
    [M[col], M[maxR]] = [M[maxR], M[col]];
    if (Math.abs(M[col][col]) < 1e-15) continue;
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(M[i][i]) < 1e-15) continue;
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

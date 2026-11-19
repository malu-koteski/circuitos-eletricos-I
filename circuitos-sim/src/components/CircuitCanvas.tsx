"use client";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Circuit, Comp, DEFAULTS, Result, Tool, UNIT, Wire } from "@/lib/types";
import { eng, pinsOf, wirePoints } from "@/lib/circuitSolver";

const G = 30; // tamanho da célula da grade (px)

interface Props {
  circuit: Circuit;
  setCircuit: (c: Circuit) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  sel: string | null;
  setSel: (s: string | null) => void;
  res: MutableRefObject<Result | null>;
  hidden: boolean;
}

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function drawComp(
  x: CanvasRenderingContext2D,
  c: Comp,
  c0: string,
  c1: string,
  selected: boolean,
  i: number,
  phase: number,
  hidden: boolean,
  vd: number,
) {
  x.save();
  x.translate(c.x * G, c.y * G);
  x.rotate((c.rot * Math.PI) / 2);
  const L = 2 * G;
  const body = selected ? "#fde047" : "#e2e8f0";
  const line = (a: number, b: number, col: string) => {
    x.strokeStyle = col;
    x.beginPath();
    x.moveTo(a, 0);
    x.lineTo(b, 0);
    x.stroke();
  };
  const circle = () => {
    x.strokeStyle = body;
    x.beginPath();
    x.arc(G, 0, 14, 0, 7);
    x.stroke();
  };

  x.lineWidth = 2.5;
  x.lineCap = "round";
  x.fillStyle = body;
  x.font = "12px ui-monospace,monospace";
  x.textAlign = "center";

  if (c.kind === "GND") {
    x.strokeStyle = selected ? "#fde047" : "#94a3b8";
    [
      [12, 0],
      [8, 6],
      [4, 12],
    ].forEach(([h, d]) => {
      x.beginPath();
      x.moveTo(-h, d + 4);
      x.lineTo(h, d + 4);
      x.stroke();
    });
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(0, 4);
    x.stroke();
  } else if (c.kind === "PROBE") {
    x.fillStyle = selected ? "#fde047" : "#38bdf8";
    x.beginPath();
    x.arc(0, 0, 5, 0, 7);
    x.fill();
    if (!hidden) {
      x.fillStyle = "#38bdf8";
      x.fillText(eng(vd, "V"), 0, -12);
    }
  } else {
    let a = G * 0.5,
      b = L - G * 0.5;
    if (c.kind === "C") {
      a = G - 4;
      b = G + 4;
    }
    if (["V", "I", "AC", "AM", "VM"].includes(c.kind)) {
      a = G - 14;
      b = G + 14;
    }
    line(0, a, c0);
    line(b, L, c1);
    x.strokeStyle = body;

    if (c.kind === "R") {
      x.beginPath();
      x.moveTo(a, 0);
      for (let k = 0; k < 6; k++)
        x.lineTo(a + (k + 0.5) * ((b - a) / 6), k % 2 ? 7 : -7);
      x.lineTo(b, 0);
      x.stroke();
    } else if (c.kind === "C") {
      x.beginPath();
      x.moveTo(a, -14);
      x.lineTo(a, 14);
      x.moveTo(b, -14);
      x.lineTo(b, 14);
      x.stroke();
    } else if (c.kind === "L") {
      x.beginPath();
      for (let k = 0; k < 4; k++)
        x.arc(a + 7.5 + (k * 15) / 2, 0, 3.75, Math.PI, 0);
      x.stroke();
    } else if (c.kind === "SW") {
      x.beginPath();
      x.moveTo(a, 0);
      x.lineTo(b, c.closed ? 0 : -14);
      x.stroke();
      x.beginPath();
      x.arc(a, 0, 2.5, 0, 7);
      x.arc(b, 0, 2.5, 0, 7);
      x.fill();
    } else {
      circle();
      if (c.kind === "V") {
        x.fillText("+", G - 6, 4);
        x.fillText("−", G + 6, 4);
      }
      if (c.kind === "I") {
        x.beginPath();
        x.moveTo(G - 7, 0);
        x.lineTo(G + 7, 0);
        x.lineTo(G + 2, -4);
        x.moveTo(G + 7, 0);
        x.lineTo(G + 2, 4);
        x.stroke();
      }
      if (c.kind === "AC") {
        x.beginPath();
        x.moveTo(G - 8, 0);
        x.bezierCurveTo(G - 4, -10, G - 1, -10, G, 0);
        x.bezierCurveTo(G + 1, 10, G + 4, 10, G + 8, 0);
        x.stroke();
      }
      if (c.kind === "AM" || c.kind === "VM")
        x.fillText(c.kind === "AM" ? "A" : "V", G, 4);
    }

    // Bolinhas animadas de corrente
    if (Math.abs(i) > 1e-9) {
      x.fillStyle = "#fde047";
      for (let k = 0; k < 6; k++) {
        const p = ((((k / 6 + phase) % 1) + 1) % 1) * L;
        x.beginPath();
        x.arc(p, 0, 2.6, 0, 7);
        x.fill();
      }
    }

    // Rótulo legível
    x.restore();
    x.save();
    const p = pinsOf(c);
    x.translate(((p[0][0] + p[1][0]) / 2) * G, ((p[0][1] + p[1][1]) / 2) * G);
    x.fillStyle = selected ? "#fde047" : "#94a3b8";
    x.textAlign = "center";
    x.font = "11px ui-monospace,monospace";
    const txt =
      c.kind === "AM"
        ? hidden
          ? "?"
          : eng(i, "A")
        : c.kind === "VM"
          ? hidden
            ? "?"
            : eng(vd, "V")
          : c.kind === "SW"
            ? c.closed
              ? "fechada"
              : "aberta"
            : c.kind === "AC"
              ? `${eng(c.value, "V")} ${c.value2 ?? 60}Hz`
              : eng(c.value, UNIT[c.kind]);
    x.fillText(txt, 0, c.rot % 2 ? -22 : -22);
  }

  // Pinos terminais visíveis para facilitar conexão de fios
  x.restore();
  for (const [px, py] of pinsOf(c)) {
    x.fillStyle = selected ? "#fde047" : "#38bdf8";
    x.beginPath();
    x.arc(px * G, py * G, 3, 0, Math.PI * 2);
    x.fill();
  }
}

export default function CircuitCanvas({
  circuit,
  setCircuit,
  tool,
  setTool,
  sel,
  setSel,
  res,
  hidden,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ph = useRef<Record<string, number>>({});
  const st = useRef({ circuit, sel, hidden, tool });
  st.current = { circuit, sel, hidden, tool };

  // Refs para interação de arraste e desenho de fios
  const ws = useRef<[number, number] | null>(null);
  const hoverGrid = useRef<[number, number] | null>(null);
  const draggingComp = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const [selectedWireIdx, setSelectedWireIdx] = useState<number | null>(null);

  // Atalho Delete / Backspace para remover fio selecionado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedWireIdx !== null &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        setCircuit({
          ...st.current.circuit,
          wires: st.current.circuit.wires.filter(
            (_, i) => i !== selectedWireIdx,
          ),
        });
        setSelectedWireIdx(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedWireIdx, setCircuit]);

  useEffect(() => {
    const cv = ref.current!;
    const x = cv.getContext("2d")!;
    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const { circuit: C, sel: S, hidden: H, tool: T } = st.current;
      const r = res.current;

      x.fillStyle = "#020617";
      x.fillRect(0, 0, cv.width, cv.height);

      // Grid de pontos
      x.fillStyle = "#1e293b";
      for (let i = 0; i < cv.width / G; i++) {
        for (let j = 0; j < cv.height / G; j++) {
          x.fillRect(i * G - 1, j * G - 1, 2, 2);
        }
      }

      const vmax = Math.max(
        1e-6,
        ...Object.values(r?.nodeV ?? {}).map((v) => Math.abs(v)),
      );
      const imax = Math.max(
        1e-12,
        ...Object.values(r?.branchI ?? {}).map((v) => Math.abs(v)),
      );

      const vc = (k: string) => {
        const v = r?.nodeV[k] ?? 0;
        const a = Math.abs(v) / vmax;
        return a < 0.02
          ? "#64748b"
          : v > 0
            ? `hsl(142 70% ${40 + a * 20}%)`
            : `hsl(217 90% ${50 + a * 15}%)`;
      };

      // Desenha Fios
      x.lineWidth = 2.5;
      x.lineCap = "round";
      C.wires.forEach((w, idx) => {
        const p = wirePoints(w);
        const isWireSel = idx === selectedWireIdx;
        for (let i = 1; i < p.length; i++) {
          x.strokeStyle = isWireSel
            ? "#f43f5e"
            : vc(`${p[i - 1][0]},${p[i - 1][1]}`);
          x.lineWidth = isWireSel ? 4 : 2.5;
          x.beginPath();
          x.moveTo(p[i - 1][0] * G, p[i - 1][1] * G);
          x.lineTo(p[i][0] * G, p[i][1] * G);
          x.stroke();
        }
      });

      // Desenha Componentes
      for (const c of C.comps) {
        const p = pinsOf(c);
        const i = r?.branchI[c.id] ?? 0;
        ph.current[c.id] =
          ((ph.current[c.id] ?? 0) + (i / imax) * dt * 0.8) % 1;
        const k0 = `${p[0][0]},${p[0][1]}`;
        const k1 = p[1] ? `${p[1][0]},${p[1][1]}` : k0;
        drawComp(
          x,
          c,
          vc(k0),
          vc(k1),
          c.id === S,
          i,
          ph.current[c.id],
          H,
          c.kind === "PROBE" ? (r?.nodeV[k0] ?? 0) : (r?.vDrop[c.id] ?? 0),
        );
      }

      // Preview do fio sendo criado (linha pontilhada em L)
      if (ws.current && hoverGrid.current) {
        const [sx, sy] = ws.current;
        const [gx, gy] = hoverGrid.current;
        x.save();
        x.strokeStyle = "#34d399";
        x.lineWidth = 2;
        x.setLineDash([6, 4]);
        x.beginPath();
        x.moveTo(sx * G, sy * G);
        x.lineTo(gx * G, sy * G);
        x.lineTo(gx * G, gy * G);
        x.stroke();
        x.restore();
      }

      // Cursor magnético no grid quando estiver adicionando fio
      if (T === "wire" && hoverGrid.current) {
        x.fillStyle = "rgba(52, 211, 153, 0.35)";
        x.beginPath();
        x.arc(hoverGrid.current[0] * G, hoverGrid.current[1] * G, 6, 0, 7);
        x.fill();
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [res, selectedWireIdx]);

  const getGridCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = ref.current!;
    const b = cv.getBoundingClientRect();
    const fx = ((e.clientX - b.left) * cv.width) / b.width / G;
    const fy = ((e.clientY - b.top) * cv.height) / b.height / G;
    return { fx, fy, gx: Math.round(fx), gy: Math.round(fy) };
  };

  const findHitComp = (fx: number, fy: number) =>
    circuit.comps.find((c) => {
      const p = pinsOf(c);
      const q = p[p.length - 1];
      return (
        Math.hypot((p[0][0] + q[0]) / 2 - fx, (p[0][1] + q[1]) / 2 - fy) < 0.9
      );
    });

  const findHitWireIdx = (fx: number, fy: number) =>
    circuit.wires.findIndex(
      (w) => distToSegment(fx, fy, w.x1, w.y1, w.x2, w.y2) < 0.35,
    );

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { fx, fy, gx, gy } = getGridCoords(e);

    if (tool === "delete") {
      const hitComp = findHitComp(fx, fy);
      if (hitComp) {
        setCircuit({
          ...circuit,
          comps: circuit.comps.filter((c) => c.id !== hitComp.id),
        });
        if (sel === hitComp.id) setSel(null);
        return;
      }
      const wIdx = findHitWireIdx(fx, fy);
      if (wIdx >= 0) {
        setCircuit({
          ...circuit,
          wires: circuit.wires.filter((_, i) => i !== wIdx),
        });
      }
      return;
    }

    if (tool === "select") {
      const hitComp = findHitComp(fx, fy);
      if (hitComp) {
        setSel(hitComp.id);
        setSelectedWireIdx(null);
        draggingComp.current = {
          id: hitComp.id,
          offsetX: gx - hitComp.x,
          offsetY: gy - hitComp.y,
          moved: false,
        };
        return;
      }

      const wIdx = findHitWireIdx(fx, fy);
      if (wIdx >= 0) {
        setSel(null);
        setSelectedWireIdx(wIdx);
        return;
      }

      setSel(null);
      setSelectedWireIdx(null);
    } else if (tool === "wire") {
      if (!ws.current) {
        ws.current = [gx, gy];
      } else {
        commitWire(ws.current[0], ws.current[1], gx, gy);
        ws.current = null;
      }
    } else {
      // Inserir novo componente/fonte
      const id = `${tool}${Date.now()}`;
      setCircuit({
        ...circuit,
        comps: [
          ...circuit.comps,
          {
            id,
            kind: tool,
            x: gx,
            y: gy,
            rot: 0,
            value: 0,
            ...DEFAULTS[tool],
          } as Comp,
        ],
      });
      setSel(id);
      setTool("select");
    }
  };

  const commitWire = (sx: number, sy: number, gx: number, gy: number) => {
    if (sx === gx && sy === gy) return;
    const newWires: Wire[] = [];
    if (sx !== gx) newWires.push({ x1: sx, y1: sy, x2: gx, y2: sy });
    if (sy !== gy) newWires.push({ x1: gx, y1: sy, x2: gx, y2: gy });
    setCircuit({
      ...circuit,
      wires: [...circuit.wires, ...newWires],
    });
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { gx, gy } = getGridCoords(e);
    hoverGrid.current = [gx, gy];

    // Movimentação de ferramentas/fontes com snap-to-grid
    if (draggingComp.current) {
      const { id, offsetX, offsetY } = draggingComp.current;
      const nx = Math.max(1, Math.min(30, gx - offsetX));
      const ny = Math.max(1, Math.min(16, gy - offsetY));
      const target = circuit.comps.find((c) => c.id === id);
      if (target && (target.x !== nx || target.y !== ny)) {
        draggingComp.current.moved = true;
        setCircuit({
          ...circuit,
          comps: circuit.comps.map((c) =>
            c.id === id ? { ...c, x: nx, y: ny } : c,
          ),
        });
      }
    }
  };

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { gx, gy } = getGridCoords(e);

    // Se clicou sem arrastar em uma chave (SW), alterna estado aberta/fechada
    if (draggingComp.current) {
      const { id, moved } = draggingComp.current;
      draggingComp.current = null;
      if (!moved) {
        const hit = circuit.comps.find((c) => c.id === id);
        if (hit?.kind === "SW") {
          setCircuit({
            ...circuit,
            comps: circuit.comps.map((c) =>
              c.id === hit.id ? { ...c, closed: !c.closed } : c,
            ),
          });
        }
      }
    }

    // Permite criar fio também clicando e arrastando até o destino
    if (tool === "wire" && ws.current) {
      const [sx, sy] = ws.current;
      if (sx !== gx || sy !== gy) {
        commitWire(sx, sy, gx, gy);
        ws.current = null;
      }
    }
  };

  return (
    <canvas
      ref={ref}
      width={960}
      height={540}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      className={`h-full max-h-full w-full rounded-lg border border-slate-800 object-contain ${
        tool === "select"
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-crosshair"
      }`}
    />
  );
}

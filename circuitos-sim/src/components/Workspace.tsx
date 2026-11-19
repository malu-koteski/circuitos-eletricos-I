"use client";
import { useEffect, useRef, useState } from "react";
import CircuitCanvas from "./CircuitCanvas";
import Oscilloscope from "./Oscilloscope";
import StudyDrawer from "./StudyDrawer";
import { Simulator, eng, pinsOf } from "@/lib/circuitSolver";
import { PRESETS, Preset } from "@/lib/presets";
import { Circuit, Kind, LABEL, Result, Sample, Tool, UNIT } from "@/lib/types";

const PALETTE: Kind[] = [
  "V",
  "I",
  "AC",
  "GND",
  "R",
  "C",
  "L",
  "SW",
  "VM",
  "AM",
  "PROBE",
];
const RANGE: Partial<Record<Kind, [number, number, boolean]>> = {
  R: [10, 1e4, true],
  C: [1e-6, 1e-3, true],
  L: [1e-3, 1, true],
  V: [0, 20, false],
  AC: [0, 20, false],
  I: [0, 0.01, false],
};

export default function Workspace() {
  const [circuit, setCircuit] = useState<Circuit>(PRESETS[0].circuit);
  const [tool, setTool] = useState<Tool>("select");
  const [sel, setSel] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [timeDiv, setTimeDiv] = useState(PRESETS[0].timeDiv);
  const [voltDiv, setVoltDiv] = useState(2);
  const [ampDiv, setAmpDiv] = useState(0.002);
  const [hidden, setHidden] = useState(false);
  const [drawer, setDrawer] = useState(true);
  const [active, setActive] = useState<Preset | null>(PRESETS[0]);
  const sim = useRef(new Simulator(PRESETS[0].circuit));
  const res = useRef<Result | null>(null);
  const hist = useRef<Sample[]>([]);
  const live = useRef({ running, timeDiv, sel, circuit });
  live.current = { running, timeDiv, sel, circuit };

  useEffect(() => {
    sim.current = new Simulator(circuit, sim.current);
  }, [circuit]); // mantém o estado (vC, iL) ao editar
  useEffect(() => {
    hist.current = [];
  }, [sel]);
  useEffect(() => {
    let raf = 0,
      last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const L = live.current;
      const frame = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!L.running) return;
      const dt = (((10 * L.timeDiv) / 5) * frame) / 8; // a janela do osciloscópio corre em ~5 s reais
      for (let k = 0; k < 8; k++) {
        const r = sim.current.step(dt);
        res.current = r;
        if (k % 2 === 0 && L.sel) {
          const c = L.circuit.comps.find((q) => q.id === L.sel);
          if (c) {
            const [px, py] = pinsOf(c)[0];
            hist.current.push({
              t: r.t,
              v:
                c.kind === "PROBE"
                  ? (r.nodeV[`${px},${py}`] ?? 0)
                  : (r.vDrop[c.id] ?? 0),
              i: r.branchI[c.id] ?? 0,
            });
          }
        }
      }
      if (hist.current.length > 20000) hist.current.splice(0, 5000);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement;
      if (tg.tagName === "INPUT" || tg.tagName === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        setRunning((r) => !r);
      } else if (e.key.toLowerCase() === "r" && sel)
        setCircuit({
          ...circuit,
          comps: circuit.comps.map((c) =>
            c.id === sel ? { ...c, rot: (c.rot + 1) % 4 } : c,
          ),
        });
      else if ((e.key === "Delete" || e.key === "Backspace") && sel) {
        setCircuit({
          ...circuit,
          comps: circuit.comps.filter((c) => c.id !== sel),
        });
        setSel(null);
      } else if (e.key.toLowerCase() === "w") setTool("wire");
      else if (e.key === "Escape") setTool("select");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sel, circuit]);

  const load = (p: Preset, challenge: boolean) => {
    sim.current = new Simulator(p.circuit);
    hist.current = [];
    res.current = null;
    setCircuit(p.circuit);
    setTimeDiv(p.timeDiv);
    setActive(p);
    setHidden(challenge);
    setSel(null);
    setRunning(true);
  };
  const c = circuit.comps.find((q) => q.id === sel);
  const rg = c ? RANGE[c.kind] : undefined;
  const pos =
    c && rg
      ? rg[2]
        ? Math.log(c.value / rg[0]) / Math.log(rg[1] / rg[0])
        : (c.value - rg[0]) / (rg[1] - rg[0])
      : 0;
  const setVal = (p: number) => {
    if (!c || !rg) return;
    const v = rg[2]
      ? rg[0] * Math.pow(rg[1] / rg[0], p)
      : rg[0] + p * (rg[1] - rg[0]);
    setCircuit({
      ...circuit,
      comps: circuit.comps.map((q) =>
        q.id === c.id ? { ...q, value: +v.toPrecision(3) } : q,
      ),
    });
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-200">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-3 py-2">
        <h1 className="mr-auto text-base font-semibold text-cyan-300">
          Circuitos Elétricos 1 · Simulador
        </h1>
        <span className="hidden text-xs text-slate-500 md:inline">
          R girar · Delete remover · W fio · Espaço pausar
        </span>
        <button
          onClick={() => setRunning(!running)}
          className="rounded bg-cyan-600 px-3 py-1 text-sm font-medium text-slate-950"
        >
          {running ? "Pausar" : "Rodar"}
        </button>
        <button
          onClick={() => setDrawer(!drawer)}
          className="rounded border border-slate-600 px-3 py-1 text-sm"
        >
          Estudo
        </button>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-28 shrink-0 space-y-1 overflow-y-auto border-r border-slate-800 p-2 sm:w-40">
          <button
            onClick={() => setTool("select")}
            className={`w-full rounded px-2 py-1 text-left text-xs ${tool === "select" ? "bg-slate-700" : "bg-slate-900"}`}
          >
            Selecionar
          </button>
          <button
            onClick={() => setTool("wire")}
            className={`w-full rounded px-2 py-1 text-left text-xs ${tool === "wire" ? "bg-cyan-700" : "bg-slate-900"}`}
          >
            Fio (W)
          </button>
          {PALETTE.map((k) => (
            <button
              key={k}
              onClick={() => setTool(k)}
              className={`w-full rounded px-2 py-1 text-left text-xs ${tool === k ? "bg-cyan-700" : "bg-slate-900"}`}
            >
              {LABEL[k]}
            </button>
          ))}
          <p className="pt-2 text-[11px] text-slate-500">
            Clique em uma chave para ligar ou desligar.
          </p>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 p-2">
            <CircuitCanvas
              circuit={circuit}
              setCircuit={setCircuit}
              tool={tool}
              setTool={setTool}
              sel={sel}
              setSel={setSel}
              res={res}
              hidden={hidden}
            />
          </div>
          <div className="flex h-12 items-center gap-3 border-t border-slate-800 px-3 text-sm">
            {c && rg ? (
              <>
                <span className="w-32 shrink-0">
                  {LABEL[c.kind]}:{" "}
                  <b className="text-cyan-300">{eng(c.value, UNIT[c.kind])}</b>
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.001}
                  value={Math.min(1, Math.max(0, pos))}
                  onChange={(e) => setVal(+e.target.value)}
                  className="w-full accent-cyan-400"
                />
              </>
            ) : (
              <span className="text-slate-500">
                {c
                  ? `${LABEL[c.kind]} selecionado`
                  : "Selecione um componente para ajustar o valor em tempo real."}
              </span>
            )}
          </div>
          <Oscilloscope
            hist={hist}
            timeDiv={timeDiv}
            setTimeDiv={setTimeDiv}
            voltDiv={voltDiv}
            setVoltDiv={setVoltDiv}
            ampDiv={ampDiv}
            setAmpDiv={setAmpDiv}
            hidden={hidden}
            label={c ? `${c.id}: v (verde) e i (amarelo)` : ""}
          />
        </main>
        {drawer && (
          <StudyDrawer
            onLoad={load}
            active={active}
            challenge={hidden || !!active?.challenge}
            onReveal={() => setHidden(false)}
          />
        )}
      </div>
    </div>
  );
}

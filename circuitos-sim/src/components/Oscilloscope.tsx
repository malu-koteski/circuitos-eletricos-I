"use client";

import { MutableRefObject, useEffect, useRef } from "react";
import { Sample } from "@/lib/types";
import { eng } from "@/lib/circuitSolver";

interface Props {
  hist: MutableRefObject<Sample[]>;
  timeDiv: number;
  setTimeDiv: (v: number) => void;
  voltDiv: number;
  setVoltDiv: (v: number) => void;
  ampDiv: number;
  setAmpDiv: (v: number) => void;
  hidden: boolean;
  label: string;
}

const TIME_SCALES = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1];
const VOLT_SCALES = [0.5, 1, 2, 5, 10];
const AMP_SCALES = [0.0005, 0.001, 0.002, 0.005, 0.01, 0.05];

export default function Oscilloscope({
  hist,
  timeDiv,
  setTimeDiv,
  voltDiv,
  setVoltDiv,
  ampDiv,
  setAmpDiv,
  hidden,
  label,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ timeDiv, voltDiv, ampDiv, hidden });
  stateRef.current = { timeDiv, voltDiv, ampDiv, hidden };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const render = () => {
      raf = requestAnimationFrame(render);
      const {
        timeDiv: tDiv,
        voltDiv: vDiv,
        ampDiv: aDiv,
        hidden: isHidden,
      } = stateRef.current;

      const w = cv.width;
      const h = cv.height;
      const midY = h / 2;

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      // Grade do osciloscópio (10 divisões horizontais x 6 verticais)
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      const cols = 10;
      const rows = 6;
      for (let i = 1; i < cols; i++) {
        const x = (w / cols) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let j = 1; j < rows; j++) {
        const y = (h / rows) * j;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Eixo central (0V / 0A)
      ctx.strokeStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      const samples = hist.current;
      if (isHidden || samples.length < 2) {
        if (isHidden) {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "12px ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.fillText("Modo Desafio: medidores ocultos", w / 2, midY - 8);
        }
        return;
      }

      const spanT = cols * tDiv;
      const tEnd = samples[samples.length - 1].t;
      const tStart = tEnd - spanT;
      const pxPerDivY = h / rows;

      // Curva de Tensão (Verde)
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let startedV = false;
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        if (s.t < tStart) continue;
        const x = ((s.t - tStart) / spanT) * w;
        const y = midY - (s.v / vDiv) * pxPerDivY;
        if (!startedV) {
          ctx.moveTo(x, y);
          startedV = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Curva de Corrente (Amarelo)
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let startedI = false;
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        if (s.t < tStart) continue;
        const x = ((s.t - tStart) / spanT) * w;
        const y = midY - (s.i / aDiv) * pxPerDivY;
        if (!startedI) {
          ctx.moveTo(x, y);
          startedI = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [hist]);

  return (
    <div className="flex h-44 shrink-0 flex-col border-t border-slate-800 bg-slate-900/80 px-3 py-2">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono text-slate-300">
          {label || "Osciloscópio (selecione um componente para plotar)"}
        </span>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 text-slate-400">
            Tempo/div:
            <select
              value={timeDiv}
              onChange={(e) => setTimeDiv(Number(e.target.value))}
              className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-slate-200"
            >
              {TIME_SCALES.map((s) => (
                <option key={s} value={s}>
                  {eng(s, "s")}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1 text-emerald-400">
            V/div:
            <select
              value={voltDiv}
              onChange={(e) => setVoltDiv(Number(e.target.value))}
              className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-slate-200"
            >
              {VOLT_SCALES.map((s) => (
                <option key={s} value={s}>
                  {eng(s, "V")}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1 text-amber-400">
            I/div:
            <select
              value={ampDiv}
              onChange={(e) => setAmpDiv(Number(e.target.value))}
              className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-slate-200"
            >
              {AMP_SCALES.map((s) => (
                <option key={s} value={s}>
                  {eng(s, "A")}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={960}
        height={130}
        className="min-h-0 w-full flex-1 rounded border border-slate-800"
      />
    </div>
  );
}

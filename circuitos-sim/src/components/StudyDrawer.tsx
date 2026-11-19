"use client";
import { useState } from "react";
import { CARDS, Preset, PRESETS, TOPICS } from "@/lib/presets";

interface Props {
  onLoad: (p: Preset, challenge: boolean) => void;
  active: Preset | null;
  challenge: boolean;
  onReveal: () => void;
}

export default function StudyDrawer({
  onLoad,
  active,
  challenge,
  onReveal,
}: Props) {
  const [tab, setTab] = useState<"trilha" | "desafio" | "cards">("trilha");
  const [ans, setAns] = useState("");
  const [fb, setFb] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(0);
  const [box, setBox] = useState<number[]>(CARDS.map(() => 0));
  const [ci, setCi] = useState(0);
  const [flip, setFlip] = useState(false);
  const ch = active?.challenge;
  const check = () => {
    if (!ch) return;
    const v = parseFloat(ans.replace(",", "."));
    const ok = Math.abs(v - ch.answer) <= Math.abs(ch.answer) * 0.02;
    setFb(
      ok
        ? `Correto! Resposta: ${ch.answer} ${ch.unit}.`
        : `Ainda não. Confira o passo a passo (tolerância de 2 %).`,
    );
    setDone(true);
    onReveal();
  };
  const next = (know: boolean) => {
    const b = box.map((x, i) =>
      i === ci ? Math.max(0, x + (know ? 1 : -1)) : x,
    );
    setBox(b);
    setFlip(false);
    let best = 0,
      bv = 1e9;
    b.forEach((x, i) => {
      if (i !== ci && x + Math.random() < bv) {
        bv = x + Math.random();
        best = i;
      }
    });
    setCi(best);
  };
  const tabBtn = (t: typeof tab, l: string) => (
    <button
      key={t}
      onClick={() => setTab(t)}
      className={`flex-1 py-2 text-sm ${tab === t ? "border-b-2 border-cyan-400 text-cyan-300" : "text-slate-400"}`}
    >
      {l}
    </button>
  );
  return (
    <aside className="flex w-full max-w-sm shrink-0 flex-col border-l border-slate-800 bg-slate-950 text-sm sm:w-80">
      <div className="flex border-b border-slate-800">
        {tabBtn("trilha", "Trilha")}
        {tabBtn("desafio", "Desafio")}
        {tabBtn("cards", "Flashcards")}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "trilha" &&
          TOPICS.map((t, i) => (
            <div key={t.t} className="mb-2 rounded-lg border border-slate-800">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full px-3 py-2 text-left font-medium"
              >
                {t.t}
              </button>
              {open === i && (
                <div className="space-y-2 px-3 pb-3 text-slate-300">
                  <p>{t.s}</p>
                  {PRESETS.filter((p) => p.topic === String(i)).map((p) => (
                    <div key={p.id} className="flex gap-2">
                      <button
                        onClick={() => onLoad(p, false)}
                        className="rounded bg-cyan-600 px-2 py-1 text-xs font-medium text-slate-950"
                      >
                        Carregar no simulador
                      </button>
                      <button
                        onClick={() => {
                          onLoad(p, true);
                          setTab("desafio");
                          setAns("");
                          setFb(null);
                          setDone(false);
                        }}
                        className="rounded border border-slate-600 px-2 py-1 text-xs"
                      >
                        Desafio: {p.name}
                      </button>
                    </div>
                  ))}
                  {!PRESETS.some((p) => p.topic === String(i)) && (
                    <p className="text-xs text-slate-500">
                      Monte o circuito na bancada; o solver já suporta RC, RL e
                      RLC.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        {tab === "desafio" &&
          (ch && challenge ? (
            <div className="space-y-3">
              <p className="font-medium">{active!.name}</p>
              <p>{ch.question}</p>
              <div className="flex gap-2">
                <input
                  value={ans}
                  onChange={(e) => setAns(e.target.value)}
                  placeholder={`Resposta em ${ch.unit}`}
                  className="w-full rounded bg-slate-800 px-2 py-1"
                />
                <button
                  onClick={check}
                  className="rounded bg-cyan-600 px-3 py-1 font-medium text-slate-950"
                >
                  Enviar
                </button>
              </div>
              {fb && (
                <p
                  className={
                    fb.startsWith("Correto")
                      ? "text-green-400"
                      : "text-amber-300"
                  }
                >
                  {fb}
                </p>
              )}
              {done && (
                <ol className="list-decimal space-y-1 pl-5 text-slate-300">
                  {ch.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              )}
              {done && (
                <p className="text-xs text-slate-500">
                  Medidores liberados. Veja o resultado no osciloscópio.
                </p>
              )}
            </div>
          ) : (
            <p className="text-slate-400">
              Escolha “Desafio” em um tópico da Trilha. Os medidores ficam
              ocultos até você enviar sua resposta.
            </p>
          ))}
        {tab === "cards" && (
          <div className="space-y-3">
            <button
              onClick={() => setFlip(!flip)}
              className="flex h-40 w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900 p-4 text-center"
            >
              {flip ? CARDS[ci].a : CARDS[ci].q}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => next(false)}
                className="flex-1 rounded border border-slate-600 py-1"
              >
                Revisar de novo
              </button>
              <button
                onClick={() => next(true)}
                className="flex-1 rounded bg-cyan-600 py-1 font-medium text-slate-950"
              >
                Já sei
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Revisão espaçada simples: cards que você erra voltam com mais
              frequência. Dominados: {box.filter((b) => b >= 2).length}/
              {CARDS.length}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

"use client";

import React, { useState } from "react";
import { Play, Eye, EyeOff, BookOpen, CheckCircle2 } from "lucide-react";
import { StudyTopic } from "@/lib/types";

interface TopicCardProps {
  topic: StudyTopic;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  onLoadPreset: (presetId: string) => void;
}

export function TopicCard({
  topic,
  isCompleted,
  onToggleComplete,
  onLoadPreset,
}: TopicCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 p-4 flex flex-col gap-3 ${
        isCompleted
          ? "bg-slate-900/40 border-emerald-500/30"
          : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-1.5">
            {topic.module}
          </span>
          <h3 className="text-sm font-semibold text-slate-100 leading-snug">
            {topic.title}
          </h3>
        </div>

        <button
          onClick={() => onToggleComplete(topic.id)}
          title="Marcar tópico como revisado"
          className={`p-1.5 rounded-lg transition-colors ${
            isCompleted
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">{topic.summary}</p>

      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          <BookOpen className="w-3 h-3" /> Equações-Chave
        </div>
        {topic.formulas.map((formula, i) => (
          <div
            key={i}
            className="font-mono text-xs text-amber-300/90 bg-slate-900/60 px-2 py-1 rounded"
          >
            {formula}
          </div>
        ))}
      </div>

      <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-2.5 space-y-2">
        <p className="text-xs font-medium text-slate-300">
          🎯 <span className="text-slate-400">Desafio:</span>{" "}
          {topic.challengeQuestion}
        </p>

        {showAnswer && (
          <div className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-500/20 rounded p-2 font-mono">
            {topic.challengeAnswer}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 gap-2">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showAnswer ? (
              <>
                <EyeOff className="w-3.5 h-3.5" /> Ocultar gabarito
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" /> Ver resolução
              </>
            )}
          </button>

          <button
            onClick={() => onLoadPreset(topic.presetId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all active:scale-95"
          >
            <Play className="w-3 h-3 fill-current" />
            Abrir no Simulador
          </button>
        </div>
      </div>
    </div>
  );
}

export type Kind =
  | "V"
  | "I"
  | "AC"
  | "R"
  | "C"
  | "L"
  | "SW"
  | "GND"
  | "AM"
  | "VM"
  | "PROBE";

export type CompKind = Kind;

export type Tool = "select" | "wire" | "delete" | Kind;

export interface Comp {
  id: string;
  kind: Kind;
  x: number;
  y: number;
  rot: number; // 0, 1, 2, 3
  value: number;
  value2?: number;
  closed?: boolean;
  label?: string;
}

export interface Wire {
  id?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Circuit {
  comps: Comp[];
  wires: Wire[];
}

export interface Result {
  t: number;
  nodeV: Record<string, number>;
  branchI: Record<string, number>;
  vDrop: Record<string, number>;
}

export interface Sample {
  t: number;
  v: number;
  i: number;
}

export const LABEL: Record<Kind, string> = {
  V: "Fonte DC",
  I: "Fonte Corrente",
  AC: "Fonte AC",
  R: "Resistor",
  C: "Capacitor",
  L: "Indutor",
  SW: "Chave",
  GND: "Terra (GND)",
  AM: "Amperímetro",
  VM: "Voltímetro",
  PROBE: "Ponta de Prova",
};

export const UNIT: Record<Kind, string> = {
  V: "V",
  I: "A",
  AC: "V",
  R: "Ω",
  C: "F",
  L: "H",
  SW: "",
  GND: "",
  AM: "A",
  VM: "V",
  PROBE: "V",
};

export const DEFAULTS: Record<Kind, Partial<Comp>> = {
  V: { value: 12 },
  I: { value: 0.01 },
  AC: { value: 10, value2: 60 },
  R: { value: 1000 },
  C: { value: 0.0001 },
  L: { value: 0.01 },
  SW: { value: 0, closed: true },
  GND: { value: 0 },
  AM: { value: 0 },
  VM: { value: 0 },
  PROBE: { value: 0 },
};

export interface StudyTopic {
  id: string;
  t: string; // título curto
  s: string; // resumo curto
  b?: string[]; // tópicos/bullets opcionais
  f?: string[]; // fórmulas curtas opcionais
  module: string;
  title: string;
  summary: string;
  formulas: string[];
  challengeQuestion: string;
  challengeAnswer: string;
  presetId: string;
}

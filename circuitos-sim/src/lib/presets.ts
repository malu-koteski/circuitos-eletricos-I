import { Circuit, StudyTopic } from "./types";

export interface Preset {
  id: string;
  name: string;
  topic: string;
  timeDiv: number;
  desc?: string;
  circuit: Circuit;
  challenge?: {
    question: string;
    answer: number;
    unit: string;
    tolerance?: number;
    steps: string[];
  };
}

export interface Flashcard {
  id: string;
  q: string;
  a: string;
  tag?: string;
}

export const PRESETS: Preset[] = [
  {
    id: "divisor",
    name: "Divisor de Tensão DC",
    topic: "Leis Fundamentais",
    timeDiv: 0.01,
    desc: "Dois resistores em série alimentados por uma fonte contínua de 12 V.",
    circuit: {
      comps: [
        { id: "v1", kind: "V", x: 6, y: 8, rot: 3, value: 12 },
        { id: "r1", kind: "R", x: 9, y: 5, rot: 0, value: 1000 },
        { id: "r2", kind: "R", x: 13, y: 6, rot: 1, value: 2000 },
        { id: "vm1", kind: "VM", x: 16, y: 6, rot: 1, value: 0 },
        { id: "gnd", kind: "GND", x: 6, y: 10, rot: 0, value: 0 },
      ],
      wires: [
        { x1: 6, y1: 6, x2: 6, y2: 5 },
        { x1: 6, y1: 5, x2: 9, y2: 5 },
        { x1: 11, y1: 5, x2: 13, y2: 5 },
        { x1: 13, y1: 5, x2: 13, y2: 6 },
        { x1: 13, y1: 5, x2: 16, y2: 5 },
        { x1: 16, y1: 5, x2: 16, y2: 6 },
        { x1: 13, y1: 8, x2: 13, y2: 9 },
        { x1: 16, y1: 8, x2: 16, y2: 9 },
        { x1: 16, y1: 9, x2: 6, y2: 9 },
        { x1: 6, y1: 8, x2: 6, y2: 10 },
      ],
    },
    challenge: {
      question: "Qual a tensão medida pelo voltímetro sobre R2 (2 kΩ)?",
      answer: 8,
      unit: "V",
      tolerance: 0.1,
      steps: [
        "Resistência equivalente: Req = R1 + R2 = 1 kΩ + 2 kΩ = 3 kΩ.",
        "Corrente total da malha: I = 12 V / 3 kΩ = 4 mA.",
        "Tensão sobre R2: V_R2 = R2 · I = 2 kΩ · 4 mA = 8,0 V.",
      ],
    },
  },
  {
    id: "wheatstone",
    name: "Ponte de Wheatstone",
    topic: "Análise Nodal & Teoremas",
    timeDiv: 0.01,
    desc: "Ponte resistiva clássica para medição de precisão e análise nodal.",
    circuit: {
      comps: [
        { id: "v1", kind: "V", x: 5, y: 9, rot: 3, value: 10 },
        { id: "r1", kind: "R", x: 9, y: 6, rot: 1, value: 1000 },
        { id: "r2", kind: "R", x: 14, y: 6, rot: 1, value: 1000 },
        { id: "r3", kind: "R", x: 9, y: 10, rot: 1, value: 1000 },
        { id: "r4", kind: "R", x: 14, y: 10, rot: 1, value: 2000 },
        { id: "vm1", kind: "VM", x: 11, y: 9, rot: 0, value: 0 },
        { id: "gnd", kind: "GND", x: 5, y: 12, rot: 0, value: 0 },
      ],
      wires: [
        { x1: 5, y1: 7, x2: 5, y2: 5 },
        { x1: 5, y1: 5, x2: 14, y2: 5 },
        { x1: 9, y1: 5, x2: 9, y2: 6 },
        { x1: 14, y1: 5, x2: 14, y2: 6 },
        { x1: 9, y1: 8, x2: 9, y2: 10 },
        { x1: 14, y1: 8, x2: 14, y2: 10 },
        { x1: 9, y1: 9, x2: 11, y2: 9 },
        { x1: 13, y1: 9, x2: 14, y2: 9 },
        { x1: 9, y1: 12, x2: 14, y2: 12 },
        { x1: 14, y1: 12, x2: 5, y2: 12 },
        { x1: 5, y1: 9, x2: 5, y2: 12 },
      ],
    },
    challenge: {
      question:
        "Qual a diferença de potencial (V_A - V_B) no voltímetro central?",
      answer: -1.67,
      unit: "V",
      tolerance: 0.1,
      steps: [
        "Ramo esquerdo (R1=1k, R3=1k): V_A = 10 · (1k / 2k) = 5,0 V.",
        "Ramo direito (R2=1k, R4=2k): V_B = 10 · (2k / 3k) = 6,67 V.",
        "Diferença: V_AB = 5,0 - 6,67 = -1,67 V.",
      ],
    },
  },
  {
    id: "rc",
    name: "Circuito RC (1ª Ordem)",
    topic: "Circuitos de 1ª Ordem",
    timeDiv: 0.5,
    desc: "Carga e descarga exponencial de capacitor controlado por chave.",
    circuit: {
      comps: [
        { id: "v1", kind: "V", x: 5, y: 8, rot: 3, value: 10 },
        { id: "sw1", kind: "SW", x: 7, y: 5, rot: 0, value: 0, closed: true },
        { id: "r1", kind: "R", x: 10, y: 5, rot: 0, value: 1000 },
        { id: "c1", kind: "C", x: 14, y: 6, rot: 1, value: 0.001 },
        { id: "probe1", kind: "PROBE", x: 14, y: 5, rot: 0, value: 0 },
        { id: "gnd", kind: "GND", x: 5, y: 10, rot: 0, value: 0 },
      ],
      wires: [
        { x1: 5, y1: 6, x2: 5, y2: 5 },
        { x1: 5, y1: 5, x2: 7, y2: 5 },
        { x1: 9, y1: 5, x2: 10, y2: 5 },
        { x1: 12, y1: 5, x2: 14, y2: 5 },
        { x1: 14, y1: 5, x2: 14, y2: 6 },
        { x1: 14, y1: 8, x2: 14, y2: 9 },
        { x1: 14, y1: 9, x2: 5, y2: 9 },
        { x1: 5, y1: 8, x2: 5, y2: 10 },
      ],
    },
    challenge: {
      question:
        "Qual a constante de tempo τ (em segundos) para R = 1 kΩ e C = 1 mF?",
      answer: 1,
      unit: "s",
      tolerance: 0.05,
      steps: [
        "Constante de tempo RC: τ = R · C.",
        "τ = 1000 Ω · 0,001 F = 1,0 s.",
        "Após 5τ (5 segundos), o capacitor atinge >99% da tensão da fonte (10 V).",
      ],
    },
  },
];

export const TOPICS: StudyTopic[] = [
  {
    id: "ohm-divisor",
    t: "Lei de Ohm, LKT, LKC e Divisores",
    s: "A soma das correntes em um nó é zero (LKC) e a soma das tensões em qualquer malha fechada é zero (LKT).",
    b: [
      "Em série, a corrente é a mesma e a tensão se divide proporcionalmente às resistências.",
      "Em paralelo, a tensão é a mesma e a corrente se divide proporcionalmente às condutâncias.",
    ],
    f: [
      "V = R · I",
      "V_k = V_total · (R_k / R_eq)",
      "I_k = I_total · (G_k / G_eq)",
    ],
    module: "Módulo 1 · Leis Fundamentais",
    title: "Lei de Ohm, LKT, LKC e Divisores",
    summary:
      "A soma algébrica das correntes em um nó é zero (LKC) e a soma das tensões em qualquer malha fechada é zero (LKT). Em série, tensões se dividem proporcionalmente às resistências.",
    formulas: [
      "V = R · I",
      "V_k = V_total · (R_k / R_eq)",
      "I_k = I_total · (G_k / G_eq)",
    ],
    challengeQuestion:
      "Com V1 = 12 V, R1 = 1 kΩ e R2 = 2 kΩ, qual é a tensão sobre R2?",
    challengeAnswer: "V_R2 = 12 · (2000 / 3000) = 8,0 V (corrente I = 4 mA).",
    presetId: "divisor",
  },
  {
    id: "analise-nodal-ponte",
    t: "Análise Nodal e Ponte de Wheatstone",
    s: "Análise Nodal aplica LKC nos nós não-referência; na Ponte de Wheatstone, o equilíbrio ocorre quando R1·R4 = R2·R3.",
    b: [
      "Escolha um nó de referência (GND = 0 V) e escreva LKC para os demais nós.",
      "Equivalente de Thévenin reduz qualquer rede linear a uma fonte V_Th em série com R_Th.",
    ],
    f: ["∑ I_entrando = ∑ I_saindo", "R1 / R3 = R2 / R4", "V_Th = V_ab"],
    module: "Módulo 2 & 3 · Análise Nodal e Teoremas",
    title: "Análise Nodal e Ponte de Wheatstone",
    summary:
      "A Análise Nodal aplica a LKC nos nós não-referência para determinar suas tensões. Na Ponte de Wheatstone, o equilíbrio ocorre quando R1·R4 = R2·R3.",
    formulas: [
      "∑ I_entrando = ∑ I_saindo",
      "Equilíbrio da Ponte: R1 / R3 = R2 / R4",
      "V_Th = V_ab (circuito aberto)",
    ],
    challengeQuestion:
      "Na Ponte de Wheatstone com R1=R2=R3=1 kΩ e R4=2 kΩ (Vs=10 V), a ponte está equilibrada?",
    challengeAnswer:
      "Não: V_A = 5,0 V e V_B = 6,67 V, gerando desequilíbrio de -1,67 V.",
    presetId: "wheatstone",
  },
  {
    id: "rc-1a-ordem",
    t: "Capacitores e Resposta Transitória RC",
    s: "A tensão no capacitor não varia instantaneamente (v_C(0⁺) = v_C(0⁻)) e o regime permanente DC equivale a circuito aberto.",
    b: [
      "A constante de tempo τ = R·C define a velocidade de carga e descarga.",
      "Em t = 1τ, o capacitor atinge 63,2% da variação total; em t = 5τ, >99%.",
    ],
    f: [
      "i_C(t) = C · (dv_C / dt)",
      "τ = R_Th · C",
      "v_C(t) = v_C(∞) + [v_C(0⁺) - v_C(∞)] · e^(-t/τ)",
    ],
    module: "Módulo 4 & 5 · Armazenadores e 1ª Ordem",
    title: "Capacitores e Resposta Transitória RC",
    summary:
      "A tensão sobre um capacitor não pode variar instantaneamente (v_C(0⁺) = v_C(0⁻)). Em regime permanente DC, o capacitor comporta-se como circuito aberto.",
    formulas: [
      "i_C(t) = C · (dv_C / dt)",
      "τ = R_Th · C",
      "v_C(t) = v_C(∞) + [v_C(0⁺) - v_C(∞)] · e^(-t/τ)",
    ],
    challengeQuestion:
      "Com R = 1 kΩ e C = 1 mF, em quanto tempo o capacitor atinge ~63,2% da tensão final?",
    challengeAnswer: "Em t = 1τ = R·C = 1000 · 0,001 = 1,0 segundo.",
    presetId: "rc",
  },
];

export const CARDS: Flashcard[] = [
  {
    id: "fc-1",
    tag: "Capacitores",
    q: "Como um capacitor ideal se comporta em regime permanente DC (t → ∞)?",
    a: "Como um CIRCUITO ABERTO (i_C = 0), pois dv_C/dt = 0 em corrente contínua estacionária.",
  },
  {
    id: "fc-2",
    tag: "Indutores",
    q: "Como um indutor ideal se comporta em regime permanente DC (t → ∞)?",
    a: "Como um CURTO-CIRCUITO (v_L = 0), pois di_L/dt = 0 em corrente contínua estacionária.",
  },
  {
    id: "fc-3",
    tag: "Continuidade",
    q: "Quais grandezas NÃO podem variar instantaneamente em circuitos sem impulsos?",
    a: "A TENSÃO no capacitor (v_C(0⁺) = v_C(0⁻)) e a CORRENTE no indutor (i_L(0⁺) = i_L(0⁻)).",
  },
  {
    id: "fc-4",
    tag: "Thévenin",
    q: "Como calcular R_Th quando o circuito possui apenas fontes independentes?",
    a: "Anulam-se todas as fontes independentes (fontes de tensão → curto-circuito; fontes de corrente → circuito aberto) e calcula-se a resistência equivalente nos terminais.",
  },
  {
    id: "fc-5",
    tag: "1ª Ordem",
    q: "Qual a constante de tempo τ de um circuito RL e de um circuito RC?",
    a: "Para circuito RC: τ = R_Th · C. Para circuito RL: τ = L / R_Th.",
  },
  {
    id: "fc-6",
    tag: "Máx. Potência",
    q: "Qual a condição para máxima transferência de potência em circuitos puramente resistivos?",
    a: "A resistência de carga deve ser igual à resistência de Thévenin (R_L = R_Th), resultando em P_máx = V_Th² / (4 · R_Th).",
  },
];

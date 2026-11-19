#  Circuitos Elétricos 1 — Simulador Interativo & Hub de Revisão

Aplicação web interativa desenvolvida para auxiliar nos estudos da disciplina de **Circuitos Elétricos 1**, combinando um simulador visual em tempo real (inspirado no *EveryCircuit*) com um sistema de revisão ativa, desafios práticos e flashcards.

---

##  Funcionalidades

###  Simulador Interativo em Tempo Real
* **Motor Matemático MNA (Modified Nodal Analysis):** Cálculo de tensões nodais e correntes de ramo em regime permanente DC, regime senoidal AC e regime transitório de 1ª e 2ª ordem (circuitos RC, RL e RLC) via integração numérica.
* **Feedback Visual Dinâmico:**
  * **Fluxo de Corrente:** Partículas animadas que percorrem os componentes indicando o sentido convencional da corrente, com velocidade proporcional à magnitude.
  * **Mapa de Tensão nos Nós:** Coloração dinâmica dos fios conforme o potencial elétrico (positivo, negativo e referência `0V`/GND).
* **Edição Fluida no Grid:**
  * Arraste e posicione fontes, passivos e medidores com encaixe automático (*snap-to-grid*).
  * Crie fios ortogonais em L com pré-visualização em tempo real e remova conexões ou componentes individualmente.
  * Ajuste valores (resistência, capacitância, indutância, tensão e corrente) em tempo real por meio de controles deslizantes sem precisar pausar a simulação.
* **Osciloscópio Virtual:** Plotagem simultânea das formas de onda de tensão ($V$) e corrente ($I$) do componente selecionado, com ajuste de escala (`Tempo/div`, `V/div` e `I/div`).

### Módulo de Revisão de Conteúdos
* **Trilha Teórica Estruturada:** Resumos e equações-chave organizados pelos tópicos fundamentais da disciplina (Leis de Kirchhoff, Divisores, Análise Nodal, Ponte de Wheatstone, Armazenadores de Energia e Resposta Transitória).
* **Circuitos Pré-montados:** Carregue circuitos clássicos diretamente no simulador com um clique para testar hipóteses.
* **Modo Desafio:** Oculta as leituras dos medidores e do osciloscópio para que você calcule os valores analiticamente antes de conferir a resolução passo a passo.
* **Flashcards Interativos:** Cartões rápidos para fixação de conceitos de continuidade ($v_C$ e $i_L$), comportamento em regime permanente DC, equivalentes de Thévenin/Norton e constantes de tempo ($\tau$).

---

##  Atalhos de Teclado

| Tecla | Ação |
| :--- | :--- |
| **`W`** | Ativa a ferramenta de **Fio** |
| **`X`** | Ativa a ferramenta **Deletar (Borracha)** |
| **`R`** | Rotaciona o componente selecionado em `90°` |
| **`Delete` / `Backspace`** | Remove o componente ou fio selecionado |
| **`Espaço`** | Pausa ou retoma a simulação |
| **`Esc`** | Volta para o modo **Selecionar / Mover** |
| **Clique em uma Chave (`SW`)** | Abre ou fecha o interruptor durante a simulação |

---

##  Stack Tecnológica

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
* **Gráficos & Simulação:** HTML5 Canvas 2D + Solver MNA próprio
* **Ícones:** [Lucide React](https://lucide.dev/)

---

##  Estrutura do Projeto

```text
src/
├── app/
│   ├── globals.css              # Estilos globais e configuração do Tailwind
│   ├── layout.tsx               # Layout raiz e metadados da aplicação
│   └── page.tsx                 # Ponto de entrada da interface
├── components/
│   ├── CircuitCanvas.tsx        # Renderização do grid, componentes, fios e animação de corrente
│   ├── Oscilloscope.tsx         # Osciloscópio virtual em Canvas para curvas V(t) e I(t)
│   ├── StudyDrawer.tsx          # Painel lateral de tópicos, desafios, flashcards e presets
│   └── Workspace.tsx            # Orquestração da simulação, atalhos e controles em tempo real
└── lib/
    ├── circuitSolver.ts         # Motor MNA (DC, AC e transitório) e formatação SI
    ├── presets.ts               # Circuitos pré-configurados, trilha teórica e flashcards
    └── types.ts                 # Definições de tipos, unidades e valores padrão

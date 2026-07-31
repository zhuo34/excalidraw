const GREEK: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  varepsilon: "ϵ",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  vartheta: "ϑ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  omicron: "ο",
  pi: "π",
  varpi: "ϖ",
  rho: "ρ",
  varrho: "ϱ",
  sigma: "σ",
  varsigma: "ς",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  varphi: "ϕ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Xi: "Ξ",
  Pi: "Π",
  Sigma: "Σ",
  Upsilon: "Υ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω",
};

const SYMBOLS: Record<string, string> = {
  pm: "±",
  mp: "∓",
  times: "×",
  div: "÷",
  cdot: "·",
  ast: "∗",
  star: "⋆",
  circ: "∘",
  bullet: "•",
  le: "≤",
  leq: "≤",
  ge: "≥",
  geq: "≥",
  ne: "≠",
  neq: "≠",
  approx: "≈",
  sim: "∼",
  simeq: "≃",
  equiv: "≡",
  propto: "∝",
  in: "∈",
  notin: "∉",
  ni: "∋",
  subset: "⊂",
  subseteq: "⊆",
  supset: "⊃",
  supseteq: "⊇",
  cup: "∪",
  cap: "∩",
  emptyset: "∅",
  forall: "∀",
  exists: "∃",
  neg: "¬",
  land: "∧",
  wedge: "∧",
  lor: "∨",
  vee: "∨",
  oplus: "⊕",
  otimes: "⊗",
  perp: "⊥",
  parallel: "∥",
  angle: "∠",
  triangle: "△",
  infinity: "∞",
  infty: "∞",
  partial: "∂",
  nabla: "∇",
  ell: "ℓ",
  hbar: "ℏ",
  Re: "ℜ",
  Im: "ℑ",
  prime: "′",
  degree: "°",
  ldots: "…",
  cdots: "⋯",
  vdots: "⋮",
  ddots: "⋱",
  to: "→",
  gets: "←",
  rightarrow: "→",
  leftarrow: "←",
  leftrightarrow: "↔",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  Leftrightarrow: "⇔",
  mapsto: "↦",
};

const OPERATORS: Record<string, { value: string; limits: boolean }> = {
  sum: { value: "∑", limits: true },
  prod: { value: "∏", limits: true },
  coprod: { value: "∐", limits: true },
  bigcup: { value: "⋃", limits: true },
  bigcap: { value: "⋂", limits: true },
  int: { value: "∫", limits: false },
  iint: { value: "∬", limits: false },
  iiint: { value: "∭", limits: false },
  oint: { value: "∮", limits: false },
  lim: { value: "lim", limits: true },
  min: { value: "min", limits: true },
  max: { value: "max", limits: true },
};

const NAMED_FUNCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "arcsin",
  "arccos",
  "arctan",
  "sinh",
  "cosh",
  "tanh",
  "log",
  "ln",
  "exp",
  "det",
  "gcd",
]);

const SPACING: Record<string, number> = {
  " ": 0.3,
  ",": 0.18,
  ":": 0.24,
  ";": 0.3,
  "!": -0.12,
  quad: 1,
  qquad: 2,
  enspace: 0.5,
  thinspace: 0.18,
};

const DELIMITERS: Record<string, string> = {
  "{": "{",
  "}": "}",
  lbrace: "{",
  rbrace: "}",
  langle: "⟨",
  rangle: "⟩",
  lvert: "|",
  rvert: "|",
  vert: "|",
  Vert: "‖",
  lVert: "‖",
  rVert: "‖",
  backslash: "\\",
};

const FONT_WRAPPERS = new Set([
  "mathrm",
  "mathbf",
  "mathit",
  "mathsf",
  "mathtt",
  "mathcal",
  "mathbb",
  "textstyle",
  "displaystyle",
  "scriptstyle",
  "scriptscriptstyle",
]);

const MATRIX_DELIMITERS = {
  matrix: ["", ""],
  pmatrix: ["(", ")"],
  bmatrix: ["[", "]"],
  Bmatrix: ["{", "}"],
  vmatrix: ["|", "|"],
  Vmatrix: ["‖", "‖"],
  cases: ["{", ""],
} as const;

const RELATION_SYMBOLS = new Set([
  "=",
  "<",
  ">",
  "≤",
  "≥",
  "≠",
  "≈",
  "∼",
  "≃",
  "≡",
]);

export type LatexAstNode =
  | { type: "row"; children: LatexAstNode[] }
  | { type: "text"; value: string }
  | { type: "function"; value: string }
  | { type: "operator"; value: string; limits: boolean }
  | { type: "relation"; value: string }
  | { type: "space"; em: number }
  | {
      type: "fraction";
      numerator: LatexAstNode;
      denominator: LatexAstNode;
    }
  | {
      type: "script";
      base: LatexAstNode;
      superscript: LatexAstNode | null;
      subscript: LatexAstNode | null;
      limits: boolean;
    }
  | { type: "sqrt"; index: LatexAstNode | null; body: LatexAstNode }
  | {
      type: "underbrace";
      body: LatexAstNode;
      annotation: LatexAstNode | null;
    }
  | { type: "overline" | "underline"; body: LatexAstNode }
  | {
      type: "accent";
      accent: "hat" | "widehat" | "bar" | "vec" | "dot" | "ddot";
      body: LatexAstNode;
    }
  | {
      type: "fenced";
      left: string;
      right: string;
      body: LatexAstNode;
    }
  | {
      type: "matrix";
      rows: LatexAstNode[][];
      left: string;
      right: string;
    };

type RowOptions = {
  stopCommands?: ReadonlySet<string>;
  stopCharacters?: ReadonlySet<string>;
  stopOnAmpersand?: boolean;
};

const row = (children: LatexAstNode[]): LatexAstNode => ({
  type: "row",
  children,
});

const text = (value: string): LatexAstNode => ({ type: "text", value });

export class LatexSyntaxError extends SyntaxError {
  public readonly position: number;

  constructor(message: string, input: string, position: number) {
    const pointer = `${input}\n${" ".repeat(position)}^`;
    super(`${message} at offset ${position}\n${pointer}`);
    this.name = "LatexSyntaxError";
    this.position = position;
  }
}

class Parser {
  private position = 0;
  private readonly warnings: string[] = [];

  constructor(private readonly input: string) {}

  public parse(): { ast: LatexAstNode; warnings: string[] } {
    const ast = this.parseRow();
    if (!this.done()) {
      throw this.error(`Unexpected token "${this.peek()}"`);
    }
    return { ast, warnings: this.warnings };
  }

  private parseRow({
    stopCommands = new Set<string>(),
    stopCharacters = new Set<string>(),
    stopOnAmpersand = false,
  }: RowOptions = {}): LatexAstNode {
    const children: LatexAstNode[] = [];

    while (!this.done()) {
      this.skipMathWhitespace();

      if (
        this.done() ||
        this.peek() === "}" ||
        stopCharacters.has(this.peek()) ||
        (stopOnAmpersand && this.peek() === "&") ||
        this.startsWith("\\\\") ||
        [...stopCommands].some((command) => this.startsCommand(command))
      ) {
        break;
      }

      let atom = this.parseAtom();
      let forceLimits = false;
      this.skipMathWhitespace();
      if (this.startsCommand("limits")) {
        this.readCommand();
        forceLimits = true;
      }

      let superscript: LatexAstNode | null = null;
      let subscript: LatexAstNode | null = null;
      while (true) {
        this.skipMathWhitespace();
        const marker = this.peek();
        if (marker !== "^" && marker !== "_") {
          break;
        }
        this.position += 1;
        const script = this.parseScriptArgument();
        if (marker === "^") {
          superscript = script;
        } else {
          subscript = script;
        }
      }

      if (superscript || subscript) {
        atom = {
          type: "script",
          base: atom,
          superscript,
          subscript,
          limits:
            forceLimits || (atom.type === "operator" && Boolean(atom.limits)),
        };
      }

      children.push(atom);
    }

    return row(this.mergeAdjacentText(children));
  }

  private parseAtom(): LatexAstNode {
    const character = this.peek();

    if (character === "{") {
      this.position += 1;
      const body = this.parseRow();
      this.expect("}");
      return body;
    }

    if (character === "\\") {
      return this.parseCommand();
    }

    if (character === "~") {
      this.position += 1;
      return { type: "space", em: 0.5 };
    }

    if (RELATION_SYMBOLS.has(character)) {
      this.position += 1;
      return { type: "relation", value: character };
    }

    if (character === "^" || character === "_") {
      this.warnings.push(
        `Ignored script marker without a base at offset ${this.position}`,
      );
      this.position += 1;
      return text(character);
    }

    return text(this.readPlainRun());
  }

  private parseCommand(): LatexAstNode {
    const commandStart = this.position;
    const command = this.readCommand();

    if (Object.hasOwn(GREEK, command)) {
      return text(GREEK[command]);
    }
    if (Object.hasOwn(SYMBOLS, command)) {
      const value = SYMBOLS[command];
      return RELATION_SYMBOLS.has(value)
        ? { type: "relation", value }
        : text(value);
    }
    if (Object.hasOwn(OPERATORS, command)) {
      return { type: "operator", ...OPERATORS[command] };
    }
    if (NAMED_FUNCTIONS.has(command)) {
      return { type: "function", value: command };
    }
    if (Object.hasOwn(SPACING, command)) {
      return { type: "space", em: SPACING[command] };
    }
    if (Object.hasOwn(DELIMITERS, command)) {
      return text(DELIMITERS[command]);
    }

    if (command === "frac" || command === "dfrac" || command === "tfrac") {
      return {
        type: "fraction",
        numerator: this.parseRequiredArgument(command),
        denominator: this.parseRequiredArgument(command),
      };
    }

    if (command === "sqrt") {
      return {
        type: "sqrt",
        index: this.peekOptionalArgument(),
        body: this.parseRequiredArgument(command),
      };
    }

    if (command === "underbrace") {
      const body = this.parseRequiredArgument(command);
      this.skipMathWhitespace();
      let annotation: LatexAstNode | null = null;
      if (this.peek() === "_") {
        this.position += 1;
        annotation = this.parseScriptArgument();
      }
      return { type: "underbrace", body, annotation };
    }

    if (command === "text" || command === "operatorname") {
      const value = this.parseRawGroup(command);
      return command === "operatorname"
        ? { type: "function", value }
        : text(value);
    }

    if (FONT_WRAPPERS.has(command)) {
      return this.parseRequiredArgument(command);
    }

    if (
      command === "hat" ||
      command === "widehat" ||
      command === "bar" ||
      command === "vec" ||
      command === "dot" ||
      command === "ddot"
    ) {
      return {
        type: "accent",
        accent: command,
        body: this.parseRequiredArgument(command),
      };
    }

    if (command === "overline" || command === "underline") {
      return {
        type: command,
        body: this.parseRequiredArgument(command),
      };
    }

    if (command === "left") {
      const left = this.parseDelimiter();
      const body = this.parseRow({ stopCommands: new Set(["right"]) });
      if (!this.startsCommand("right")) {
        throw this.error("Missing \\right for \\left");
      }
      this.readCommand();
      return {
        type: "fenced",
        left,
        right: this.parseDelimiter(),
        body,
      };
    }

    if (command === "begin") {
      const environment = this.parseRawGroup(command);
      if (!Object.hasOwn(MATRIX_DELIMITERS, environment)) {
        throw this.error(`Unsupported environment "${environment}"`);
      }
      return this.parseMatrix(environment as keyof typeof MATRIX_DELIMITERS);
    }

    if (command === "\\") {
      return { type: "space", em: 0 };
    }
    if (Object.hasOwn(SPACING, command)) {
      return { type: "space", em: SPACING[command] };
    }
    if (
      command === "%" ||
      command === "$" ||
      command === "#" ||
      command === "&"
    ) {
      return text(command);
    }

    this.warnings.push(
      `Unsupported command \\${command} at offset ${commandStart}; rendered as text`,
    );
    return text(command);
  }

  private parseMatrix(
    environment: keyof typeof MATRIX_DELIMITERS,
  ): LatexAstNode {
    const rows: LatexAstNode[][] = [];
    let cells: LatexAstNode[] = [];

    while (!this.done()) {
      cells.push(
        this.parseRow({
          stopCommands: new Set(["end"]),
          stopOnAmpersand: true,
        }),
      );

      if (this.peek() === "&") {
        this.position += 1;
        continue;
      }
      if (this.startsWith("\\\\")) {
        this.position += 2;
        rows.push(cells);
        cells = [];
        continue;
      }
      if (this.startsCommand("end")) {
        this.readCommand();
        const closingEnvironment = this.parseRawGroup("end");
        if (closingEnvironment !== environment) {
          throw this.error(
            `Expected \\end{${environment}}, got \\end{${closingEnvironment}}`,
          );
        }
        rows.push(cells);
        const [left, right] = MATRIX_DELIMITERS[environment];
        return { type: "matrix", rows, left, right };
      }
      throw this.error(`Unterminated ${environment} environment`);
    }

    throw this.error(`Missing \\end{${environment}}`);
  }

  private parseScriptArgument(): LatexAstNode {
    this.skipMathWhitespace();
    if (this.peek() === "{") {
      this.position += 1;
      const body = this.parseRow();
      this.expect("}");
      return body;
    }
    if (this.peek() !== "\\") {
      const value = this.peek();
      this.position += 1;
      return text(value);
    }
    return this.parseAtom();
  }

  private parseRequiredArgument(command: string): LatexAstNode {
    this.skipMathWhitespace();
    if (this.peek() !== "{") {
      throw this.error(`\\${command} requires a braced argument`);
    }
    this.position += 1;
    const body = this.parseRow();
    this.expect("}");
    return body;
  }

  private parseRawGroup(command: string): string {
    this.skipMathWhitespace();
    if (this.peek() !== "{") {
      throw this.error(`\\${command} requires a braced argument`);
    }

    this.position += 1;
    const start = this.position;
    let depth = 1;

    while (!this.done() && depth > 0) {
      const character = this.peek();
      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
      }
      this.position += 1;
    }

    if (depth !== 0) {
      throw this.error(`Unterminated argument for \\${command}`);
    }
    return this.input.slice(start, this.position - 1);
  }

  private peekOptionalArgument(): LatexAstNode | null {
    this.skipMathWhitespace();
    if (this.peek() !== "[") {
      return null;
    }
    this.position += 1;
    const body = this.parseRow({ stopCharacters: new Set(["]"]) });
    this.expect("]");
    return body;
  }

  private parseDelimiter(): string {
    this.skipMathWhitespace();
    let delimiter: string;
    if (this.peek() === "\\") {
      const command = this.readCommand();
      delimiter = DELIMITERS[command] ?? SYMBOLS[command] ?? command;
    } else {
      delimiter = this.peek();
      this.position += 1;
    }
    return delimiter === "." ? "" : delimiter;
  }

  private readCommand(): string {
    this.expect("\\");
    if (this.peek() === "\\") {
      this.position += 1;
      return "\\";
    }

    const start = this.position;
    while (/[A-Za-z]/.test(this.peek())) {
      this.position += 1;
    }
    if (this.position > start) {
      return this.input.slice(start, this.position);
    }

    const command = this.peek();
    if (!this.done()) {
      this.position += 1;
    }
    return command;
  }

  private readPlainRun(): string {
    const start = this.position;
    const first = this.peek();
    if (/[A-Za-z0-9.]/.test(first)) {
      while (/[A-Za-z0-9.]/.test(this.peek())) {
        this.position += 1;
      }
    } else {
      this.position += 1;
    }
    return this.input.slice(start, this.position);
  }

  private mergeAdjacentText(children: LatexAstNode[]): LatexAstNode[] {
    const merged: LatexAstNode[] = [];
    for (const child of children) {
      const previous = merged.at(-1);
      if (previous?.type === "text" && child.type === "text") {
        previous.value += child.value;
      } else {
        merged.push(child);
      }
    }
    return merged;
  }

  private skipMathWhitespace() {
    while (!this.done() && /\s/.test(this.peek())) {
      this.position += 1;
    }
  }

  private startsCommand(command: string): boolean {
    const prefix = `\\${command}`;
    if (!this.startsWith(prefix)) {
      return false;
    }
    const next = this.input[this.position + prefix.length] ?? "";
    return !/[A-Za-z]/.test(next);
  }

  private startsWith(value: string): boolean {
    return this.input.startsWith(value, this.position);
  }

  private expect(value: string) {
    if (!this.startsWith(value)) {
      throw this.error(`Expected "${value}"`);
    }
    this.position += value.length;
  }

  private peek(): string {
    return this.input[this.position] ?? "";
  }

  private done(): boolean {
    return this.position >= this.input.length;
  }

  private error(message: string): LatexSyntaxError {
    return new LatexSyntaxError(message, this.input, this.position);
  }
}

export const parseLatex = (input: string) => new Parser(input).parse();

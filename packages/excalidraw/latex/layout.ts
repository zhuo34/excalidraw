import type { FontFamilyValues } from "@excalidraw/element/types";

import type { LatexAstNode } from "./parser";

const EXCALIFONT_ASCENDER_RATIO = 0.881;

export type LatexTextPrimitive = {
  kind: "text";
  role: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
  fontSize: number;
  fontFamily: FontFamilyValues;
  lineHeight: number;
};

export type LatexLinePrimitive = {
  kind: "line";
  role: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
};

export type LatexPathPrimitive = {
  kind: "path";
  role: string;
  points: readonly (readonly [number, number])[];
  strokeWidth: number;
  curved: boolean;
};

export type LatexPrimitive =
  | LatexTextPrimitive
  | LatexLinePrimitive
  | LatexPathPrimitive;

export type LatexLayoutBox = {
  width: number;
  height: number;
  baseline: number;
  primitives: LatexPrimitive[];
};

export type LatexTextMeasurer = (
  value: string,
  fontSize: number,
  fontFamily: FontFamilyValues,
  lineHeight: number,
) => {
  width: number;
  height?: number;
  baseline?: number;
};

type LayoutStyle = {
  fontSize: number;
  minFontSize: number;
  fontFamily: FontFamilyValues;
  lineHeight: number;
  scriptScale: number;
  fractionScale: number;
  measureText: LatexTextMeasurer;
};

type LayoutNode = (node: LatexAstNode, style: LayoutStyle) => LatexLayoutBox;

export type LatexLayoutOptions = Partial<
  Omit<LayoutStyle, "fontFamily" | "measureText">
> & {
  fontFamily?: FontFamilyValues;
  measureText?: LatexTextMeasurer;
};

const createBox = (
  width: number,
  height: number,
  baseline: number,
  primitives: LatexPrimitive[] = [],
): LatexLayoutBox => ({ width, height, baseline, primitives });

const translatePrimitive = (
  primitive: LatexPrimitive,
  dx: number,
  dy: number,
): LatexPrimitive => {
  if (primitive.kind === "text") {
    return { ...primitive, x: primitive.x + dx, y: primitive.y + dy };
  }
  if (primitive.kind === "path") {
    return {
      ...primitive,
      points: primitive.points.map(([x, y]) => [x + dx, y + dy] as const),
    };
  }
  return {
    ...primitive,
    x1: primitive.x1 + dx,
    y1: primitive.y1 + dy,
    x2: primitive.x2 + dx,
    y2: primitive.y2 + dy,
  };
};

const translatePrimitives = (
  primitives: LatexPrimitive[],
  dx: number,
  dy: number,
) => primitives.map((primitive) => translatePrimitive(primitive, dx, dy));

const pathPrimitive = (
  points: readonly (readonly [number, number])[],
  role: string,
  strokeWidth: number,
  curved: boolean,
): LatexPathPrimitive => ({
  kind: "path",
  role,
  points,
  strokeWidth,
  curved,
});

const mergeAdjacentTextPrimitives = (
  primitives: LatexPrimitive[],
): LatexPrimitive[] => {
  const merged: LatexPrimitive[] = [];

  for (const primitive of primitives) {
    const previous = merged.at(-1);
    const canMerge =
      previous?.kind === "text" &&
      primitive.kind === "text" &&
      previous.role === "text" &&
      primitive.role === "text" &&
      previous.fontFamily === primitive.fontFamily &&
      previous.fontSize === primitive.fontSize &&
      previous.lineHeight === primitive.lineHeight &&
      Math.abs(previous.y - primitive.y) < 0.001 &&
      Math.abs(previous.x + previous.width - primitive.x) < 0.001;

    if (canMerge && previous?.kind === "text" && primitive.kind === "text") {
      previous.text += primitive.text;
      previous.width = primitive.x + primitive.width - previous.x;
      previous.height = Math.max(previous.height, primitive.height);
    } else {
      merged.push({ ...primitive });
    }
  }

  return merged;
};

const scaledStyle = (style: LayoutStyle, scale: number): LayoutStyle => ({
  ...style,
  fontSize: Math.max(style.minFontSize, style.fontSize * scale),
});

const defaultCharacterWidth = (character: string) => {
  if (/\s/u.test(character)) {
    return 0.32;
  }
  if (/[\u2e80-\u9fff\uac00-\ud7af]/u.test(character)) {
    return 1;
  }
  if (/[ilI1.,:;'`|!]/u.test(character)) {
    return 0.31;
  }
  if (/[mwMW@%]/u.test(character)) {
    return 0.86;
  }
  if (/[∑∏∫∬∭∮]/u.test(character)) {
    return 0.82;
  }
  if (/[+\-=<>≤≥≠≈×÷±∓→←↔⇒⇐⇔]/u.test(character)) {
    return 0.68;
  }
  if (/[()[\]{}]/u.test(character)) {
    return 0.42;
  }
  return 0.58;
};

export const defaultMeasureText: LatexTextMeasurer = (
  value,
  fontSize,
  _fontFamily,
  lineHeight,
) => ({
  width:
    [...value].reduce(
      (total, character) => total + defaultCharacterWidth(character),
      0,
    ) * fontSize,
  height: fontSize * lineHeight,
  baseline: fontSize * EXCALIFONT_ASCENDER_RATIO,
});

const measure = (value: string, style: LayoutStyle) => {
  const result = style.measureText(
    value,
    style.fontSize,
    style.fontFamily,
    style.lineHeight,
  );
  return {
    width: result.width,
    height: result.height ?? style.fontSize * style.lineHeight,
    baseline: result.baseline ?? style.fontSize * EXCALIFONT_ASCENDER_RATIO,
  };
};

const layoutTextValue = (
  value: string,
  style: LayoutStyle,
  role = "text",
): LatexLayoutBox => {
  if (!value) {
    return createBox(0, 0, 0);
  }
  const metrics = measure(value, style);
  return createBox(metrics.width, metrics.height, metrics.baseline, [
    {
      kind: "text",
      role,
      text: value,
      x: 0,
      y: 0,
      width: metrics.width,
      height: metrics.height,
      baseline: metrics.baseline,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      lineHeight: style.lineHeight,
    },
  ]);
};

const layoutRow = (
  node: Extract<LatexAstNode, { type: "row" }>,
  style: LayoutStyle,
  layoutNode: LayoutNode,
): LatexLayoutBox => {
  const children = node.children.map((child) => layoutNode(child, style));
  if (children.length === 0) {
    return createBox(
      0,
      style.fontSize * style.lineHeight,
      style.fontSize * EXCALIFONT_ASCENDER_RATIO,
    );
  }

  const baseline = Math.max(...children.map((child) => child.baseline));
  const descent = Math.max(
    ...children.map((child) => child.height - child.baseline),
  );
  const primitives: LatexPrimitive[] = [];
  let x = 0;

  for (const child of children) {
    primitives.push(
      ...translatePrimitives(child.primitives, x, baseline - child.baseline),
    );
    x += child.width;
  }
  return createBox(x, baseline + descent, baseline, primitives);
};

const layoutFraction = (
  node: Extract<LatexAstNode, { type: "fraction" }>,
  style: LayoutStyle,
  layoutNode: LayoutNode,
): LatexLayoutBox => {
  const childStyle = scaledStyle(style, style.fractionScale);
  const numerator = layoutNode(node.numerator, childStyle);
  const denominator = layoutNode(node.denominator, childStyle);
  const padding = Math.max(2, style.fontSize * 0.14);
  const gap = Math.max(2, style.fontSize * 0.1);
  const strokeWidth = Math.max(1, style.fontSize * 0.055);
  const width = Math.max(numerator.width, denominator.width) + padding * 2;
  const barY = numerator.height + gap;
  const denominatorY = barY + strokeWidth + gap;

  return createBox(
    width,
    denominatorY + denominator.height,
    barY + strokeWidth + style.fontSize * 0.22,
    [
      ...translatePrimitives(
        numerator.primitives,
        (width - numerator.width) / 2,
        0,
      ),
      {
        kind: "line",
        role: "fraction-bar",
        x1: 0,
        y1: barY,
        x2: width,
        y2: barY,
        strokeWidth,
      },
      ...translatePrimitives(
        denominator.primitives,
        (width - denominator.width) / 2,
        denominatorY,
      ),
    ],
  );
};

const layoutScripts = (
  node: Extract<LatexAstNode, { type: "script" }>,
  style: LayoutStyle,
  layoutNode: LayoutNode,
): LatexLayoutBox => {
  const base = layoutNode(node.base, style);
  const scriptStyle = scaledStyle(style, style.scriptScale);
  const superscript = node.superscript
    ? layoutNode(node.superscript, scriptStyle)
    : null;
  const subscript = node.subscript
    ? layoutNode(node.subscript, scriptStyle)
    : null;

  if (node.limits) {
    const width = Math.max(
      base.width,
      superscript?.width ?? 0,
      subscript?.width ?? 0,
    );
    const gap = Math.max(1, style.fontSize * 0.06);
    const baseY = superscript ? superscript.height + gap : 0;
    const subscriptY = subscript ? baseY + base.height + gap : 0;
    const height = subscript
      ? subscriptY + subscript.height
      : baseY + base.height;

    return createBox(width, height, baseY + base.baseline, [
      ...(superscript
        ? translatePrimitives(
            superscript.primitives,
            (width - superscript.width) / 2,
            0,
          )
        : []),
      ...translatePrimitives(base.primitives, (width - base.width) / 2, baseY),
      ...(subscript
        ? translatePrimitives(
            subscript.primitives,
            (width - subscript.width) / 2,
            subscriptY,
          )
        : []),
    ]);
  }

  const scriptX = base.width + Math.max(1, style.fontSize * 0.04);
  const superscriptY = superscript
    ? base.baseline - style.fontSize * 0.48 - superscript.baseline
    : 0;
  const subscriptY = subscript
    ? base.baseline + style.fontSize * 0.42 - subscript.baseline
    : 0;
  const minY = Math.min(0, superscript ? superscriptY : 0);
  const maxY = Math.max(
    base.height,
    superscript ? superscriptY + superscript.height : 0,
    subscript ? subscriptY + subscript.height : 0,
  );
  const shiftY = -minY;

  return createBox(
    scriptX + Math.max(superscript?.width ?? 0, subscript?.width ?? 0),
    maxY - minY,
    base.baseline + shiftY,
    [
      ...translatePrimitives(base.primitives, 0, shiftY),
      ...(superscript
        ? translatePrimitives(
            superscript.primitives,
            scriptX,
            superscriptY + shiftY,
          )
        : []),
      ...(subscript
        ? translatePrimitives(
            subscript.primitives,
            scriptX,
            subscriptY + shiftY,
          )
        : []),
    ],
  );
};

const layoutUnderbrace = (
  node: Extract<LatexAstNode, { type: "underbrace" }>,
  style: LayoutStyle,
  layoutNode: LayoutNode,
): LatexLayoutBox => {
  const body = layoutNode(node.body, style);
  const annotation = node.annotation
    ? layoutNode(node.annotation, scaledStyle(style, style.scriptScale))
    : null;
  const braceWidth = Math.max(body.width, style.fontSize * 0.8);
  const width = Math.max(braceWidth, annotation?.width ?? 0);
  const bodyX = (width - body.width) / 2;
  const braceX = (width - braceWidth) / 2;
  const braceGap = Math.max(1, style.fontSize * 0.05);
  const braceDepth = Math.max(5, style.fontSize * 0.24);
  const braceY = body.height + braceGap;
  const annotationGap = Math.max(2, style.fontSize * 0.08);
  const annotationY = braceY + braceDepth + annotationGap;
  const strokeWidth = Math.max(0.9, style.fontSize * 0.04);
  const bracePoints = [
    [0, 0],
    [braceWidth * 0.08, braceDepth * 0.55],
    [braceWidth * 0.42, braceDepth * 0.55],
    [braceWidth * 0.5, braceDepth],
    [braceWidth * 0.58, braceDepth * 0.55],
    [braceWidth * 0.92, braceDepth * 0.55],
    [braceWidth, 0],
  ] as const;
  const annotationPrimitives =
    annotation?.primitives.map((primitive) =>
      primitive.kind === "text"
        ? { ...primitive, role: "underbrace-label" }
        : primitive,
    ) ?? [];

  return createBox(
    width,
    annotation ? annotationY + annotation.height : braceY + braceDepth,
    body.baseline,
    [
      ...translatePrimitives(body.primitives, bodyX, 0),
      ...translatePrimitives(
        [pathPrimitive(bracePoints, "underbrace", strokeWidth, true)],
        braceX,
        braceY,
      ),
      ...(annotation
        ? translatePrimitives(
            annotationPrimitives,
            (width - annotation.width) / 2,
            annotationY,
          )
        : []),
    ],
  );
};

const layoutSquareRoot = (
  node: Extract<LatexAstNode, { type: "sqrt" }>,
  style: LayoutStyle,
  layoutNode: LayoutNode,
): LatexLayoutBox => {
  const body = layoutNode(node.body, style);
  const index = node.index
    ? layoutNode(node.index, scaledStyle(style, style.scriptScale * 0.85))
    : null;
  const strokeWidth = Math.max(1, style.fontSize * 0.055);
  const topPadding = Math.max(2, style.fontSize * 0.1);
  const radicalWidth = Math.max(style.fontSize * 0.58, body.height * 0.36);
  const radicandLeftPadding = Math.max(1, style.fontSize * 0.04);
  const radicandRightPadding = Math.max(2, style.fontSize * 0.1);
  const bodyX = radicalWidth * 0.68 + radicandLeftPadding;
  const bodyY = topPadding + strokeWidth;
  const indexExtra = index ? Math.max(0, index.width - radicalWidth * 0.45) : 0;
  const width = indexExtra + bodyX + body.width + radicandRightPadding;
  const height = bodyY + body.height;
  const rootX = indexExtra;
  const rootTop = topPadding;
  const rootBottom = height - Math.max(1, style.fontSize * 0.06);
  const rootMidY = rootTop + (rootBottom - rootTop) * 0.56;
  const primitives: LatexPrimitive[] = [
    ...translatePrimitives(body.primitives, indexExtra + bodyX, bodyY),
    {
      kind: "line",
      role: "radical",
      x1: rootX,
      y1: rootMidY,
      x2: rootX + radicalWidth * 0.2,
      y2: rootMidY + (rootBottom - rootMidY) * 0.34,
      strokeWidth,
    },
    {
      kind: "line",
      role: "radical",
      x1: rootX + radicalWidth * 0.2,
      y1: rootMidY + (rootBottom - rootMidY) * 0.34,
      x2: rootX + radicalWidth * 0.36,
      y2: rootBottom,
      strokeWidth,
    },
    {
      kind: "line",
      role: "radical",
      x1: rootX + radicalWidth * 0.36,
      y1: rootBottom,
      x2: rootX + radicalWidth * 0.62,
      y2: rootTop,
      strokeWidth,
    },
    {
      kind: "line",
      role: "radical-overbar",
      x1: rootX + radicalWidth * 0.6,
      y1: rootTop,
      x2: width,
      y2: rootTop,
      strokeWidth,
    },
  ];

  if (index) {
    primitives.push(
      ...translatePrimitives(
        index.primitives,
        0,
        Math.max(0, rootMidY - index.height * 0.8),
      ),
    );
  }
  return createBox(width, height, bodyY + body.baseline, primitives);
};

const layoutRuleDecoration = (
  node: Extract<LatexAstNode, { type: "overline" | "underline" }>,
  style: LayoutStyle,
  layoutNode: LayoutNode,
  placement: "top" | "bottom",
): LatexLayoutBox => {
  const body = layoutNode(node.body, style);
  const gap = Math.max(1, style.fontSize * 0.07);
  const strokeWidth = Math.max(1, style.fontSize * 0.05);
  const onTop = placement === "top";
  const bodyY = onTop ? gap + strokeWidth : 0;
  const lineY = onTop ? 0 : body.height + gap;

  return createBox(
    body.width,
    body.height + gap + strokeWidth,
    body.baseline + bodyY,
    [
      ...translatePrimitives(body.primitives, 0, bodyY),
      {
        kind: "line",
        role: onTop ? "overline" : "underline",
        x1: 0,
        y1: lineY,
        x2: body.width,
        y2: lineY,
        strokeWidth,
      },
    ],
  );
};

const layoutAccent = (
  node: Extract<LatexAstNode, { type: "accent" }>,
  style: LayoutStyle,
  layoutNode: LayoutNode,
): LatexLayoutBox => {
  if (node.accent === "bar") {
    return layoutRuleDecoration(
      { type: "overline", body: node.body },
      style,
      layoutNode,
      "top",
    );
  }

  const body = layoutNode(node.body, style);
  const accents: Record<string, string> = {
    hat: "^",
    widehat: "^",
    vec: "→",
    dot: "˙",
    ddot: "¨",
  };
  const accent = layoutTextValue(
    accents[node.accent] ?? "^",
    scaledStyle(style, node.accent === "vec" ? 0.72 : 0.58),
    "accent",
  );
  const gap = Math.max(0, style.fontSize * 0.015);
  const width = Math.max(body.width, accent.width);
  const bodyY = accent.height * 0.55 + gap;

  return createBox(width, bodyY + body.height, bodyY + body.baseline, [
    ...translatePrimitives(accent.primitives, (width - accent.width) / 2, 0),
    ...translatePrimitives(body.primitives, (width - body.width) / 2, bodyY),
  ]);
};

const layoutFencedBox = (
  body: LatexLayoutBox,
  left: string,
  right: string,
  style: LayoutStyle,
): LatexLayoutBox => {
  const delimiterStyle = {
    ...style,
    fontSize: Math.max(style.fontSize, body.height / 1.08),
  };
  const leftBox = layoutTextValue(left, delimiterStyle, "delimiter");
  const rightBox = layoutTextValue(right, delimiterStyle, "delimiter");
  const gap = Math.max(1, style.fontSize * 0.08);
  const leftGap = left ? gap : 0;
  const rightGap = right ? gap : 0;
  const height = Math.max(body.height, leftBox.height, rightBox.height);
  const bodyY = (height - body.height) / 2;
  const bodyX = leftBox.width + leftGap;
  const rightX = bodyX + body.width + rightGap;

  return createBox(rightX + rightBox.width, height, bodyY + body.baseline, [
    ...translatePrimitives(
      leftBox.primitives,
      0,
      (height - leftBox.height) / 2,
    ),
    ...translatePrimitives(body.primitives, bodyX, bodyY),
    ...translatePrimitives(
      rightBox.primitives,
      rightX,
      (height - rightBox.height) / 2,
    ),
  ]);
};

const layoutMatrixDelimiter = (
  delimiter: string,
  height: number,
  style: LayoutStyle,
): LatexLayoutBox => {
  if (!delimiter) {
    return createBox(0, height, height / 2);
  }

  const strokeWidth = Math.max(0.75, style.fontSize * 0.034);
  const width = Math.max(
    delimiter === "|" ? 3 : 5,
    style.fontSize * (delimiter === "‖" ? 0.24 : 0.32),
  );
  const role = "matrix-delimiter";

  if (delimiter === "|" || delimiter === "‖") {
    const xs = delimiter === "‖" ? [width * 0.3, width * 0.7] : [width * 0.5];
    return createBox(
      width,
      height,
      height / 2,
      xs.map((x) => ({
        kind: "line",
        role,
        x1: x,
        y1: 0,
        x2: x,
        y2: height,
        strokeWidth,
      })),
    );
  }

  let points: readonly (readonly [number, number])[];
  if (delimiter === "(" || delimiter === ")") {
    points = [
      [width, 0],
      [width * 0.2, height * 0.22],
      [0, height * 0.5],
      [width * 0.2, height * 0.78],
      [width, height],
    ];
  } else if (delimiter === "[" || delimiter === "]") {
    points = [
      [width, 0],
      [0, 0],
      [0, height],
      [width, height],
    ];
  } else {
    points = [
      [width, 0],
      [width * 0.4, height * 0.12],
      [width * 0.35, height * 0.38],
      [0, height * 0.5],
      [width * 0.35, height * 0.62],
      [width * 0.4, height * 0.88],
      [width, height],
    ];
  }

  if (delimiter === ")" || delimiter === "]" || delimiter === "}") {
    points = points.map(([x, y]) => [width - x, y] as const);
  }

  return createBox(width, height, height / 2, [
    pathPrimitive(
      points,
      role,
      strokeWidth,
      delimiter !== "[" && delimiter !== "]",
    ),
  ]);
};

const layoutMatrixFencedBox = (
  body: LatexLayoutBox,
  left: string,
  right: string,
  style: LayoutStyle,
): LatexLayoutBox => {
  const verticalPadding =
    left || right ? Math.max(2, style.fontSize * 0.08) : 0;
  const height = body.height + verticalPadding * 2;
  const leftBox = layoutMatrixDelimiter(left, height, style);
  const rightBox = layoutMatrixDelimiter(right, height, style);
  const gap = Math.max(2, style.fontSize * 0.1);
  const bodyX = leftBox.width + (left ? gap : 0);
  const bodyY = verticalPadding;
  const rightX = bodyX + body.width + (right ? gap : 0);

  return createBox(rightX + rightBox.width, height, bodyY + body.baseline, [
    ...leftBox.primitives,
    ...translatePrimitives(body.primitives, bodyX, bodyY),
    ...translatePrimitives(rightBox.primitives, rightX, 0),
  ]);
};

const layoutMatrix = (
  node: Extract<LatexAstNode, { type: "matrix" }>,
  style: LayoutStyle,
  layoutNode: LayoutNode,
): LatexLayoutBox => {
  const cellStyle = scaledStyle(style, 0.9);
  const rows = node.rows.map((matrixRow) =>
    matrixRow.map((cell) => layoutNode(cell, cellStyle)),
  );
  const columnCount = Math.max(0, ...rows.map((cells) => cells.length));
  const columnWidths = Array.from({ length: columnCount }, (_, column) =>
    Math.max(0, ...rows.map((cells) => cells[column]?.width ?? 0)),
  );
  const rowBaselines = rows.map((cells) =>
    Math.max(0, ...cells.map((cell) => cell.baseline)),
  );
  const rowDescents = rows.map((cells, rowIndex) =>
    Math.max(0, ...cells.map((cell) => cell.height - rowBaselines[rowIndex])),
  );
  const columnGap = Math.max(5, style.fontSize * 0.55);
  const rowGap = Math.max(3, style.fontSize * 0.22);
  const width =
    columnWidths.reduce((total, value) => total + value, 0) +
    Math.max(0, columnCount - 1) * columnGap;
  const height =
    rowBaselines.reduce(
      (total, baseline, index) => total + baseline + rowDescents[index],
      0,
    ) +
    Math.max(0, rows.length - 1) * rowGap;
  const primitives: LatexPrimitive[] = [];
  let y = 0;

  rows.forEach((cells, rowIndex) => {
    let x = 0;
    cells.forEach((cell, columnIndex) => {
      primitives.push(
        ...translatePrimitives(
          cell.primitives,
          x + (columnWidths[columnIndex] - cell.width) / 2,
          y + rowBaselines[rowIndex] - cell.baseline,
        ),
      );
      x += columnWidths[columnIndex] + columnGap;
    });
    y += rowBaselines[rowIndex] + rowDescents[rowIndex] + rowGap;
  });

  return layoutMatrixFencedBox(
    createBox(width, height, height / 2 + style.fontSize * 0.18, primitives),
    node.left,
    node.right,
    style,
  );
};

const normalizeBox = (box: LatexLayoutBox): LatexLayoutBox => {
  let minX = 0;
  let minY = 0;
  let maxX = box.width;
  let maxY = box.height;

  for (const primitive of box.primitives) {
    if (primitive.kind === "text") {
      minX = Math.min(minX, primitive.x);
      minY = Math.min(minY, primitive.y);
      maxX = Math.max(maxX, primitive.x + primitive.width);
      maxY = Math.max(maxY, primitive.y + primitive.height);
    } else if (primitive.kind === "path") {
      for (const [x, y] of primitive.points) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    } else {
      minX = Math.min(minX, primitive.x1, primitive.x2);
      minY = Math.min(minY, primitive.y1, primitive.y2);
      maxX = Math.max(maxX, primitive.x1, primitive.x2);
      maxY = Math.max(maxY, primitive.y1, primitive.y2);
    }
  }

  return createBox(
    maxX - minX,
    maxY - minY,
    box.baseline - minY,
    mergeAdjacentTextPrimitives(
      translatePrimitives(box.primitives, -minX, -minY),
    ),
  );
};

export const layoutLatexAst = (
  ast: LatexAstNode,
  options: LatexLayoutOptions = {},
): LatexLayoutBox => {
  const style: LayoutStyle = {
    fontSize: options.fontSize ?? 28,
    minFontSize: options.minFontSize ?? 6,
    fontFamily: options.fontFamily ?? 5,
    lineHeight: options.lineHeight ?? 1.25,
    scriptScale: options.scriptScale ?? 0.64,
    fractionScale: options.fractionScale ?? 0.82,
    measureText: options.measureText ?? defaultMeasureText,
  };

  const layoutNode: LayoutNode = (node, currentStyle) => {
    switch (node.type) {
      case "row":
        return layoutRow(node, currentStyle, layoutNode);
      case "text":
        return layoutTextValue(node.value, currentStyle);
      case "function": {
        const functionBox = layoutTextValue(
          node.value,
          currentStyle,
          "function",
        );
        return {
          ...functionBox,
          width: functionBox.width + currentStyle.fontSize * 0.16,
        };
      }
      case "operator":
        return layoutTextValue(
          node.value,
          scaledStyle(currentStyle, node.value.length === 1 ? 1.3 : 1),
          "operator",
        );
      case "relation": {
        const relation = layoutTextValue(node.value, currentStyle, "relation");
        const sideSpacing = Math.max(3, currentStyle.fontSize * 0.2);
        return createBox(
          relation.width + sideSpacing * 2,
          relation.height,
          relation.baseline,
          translatePrimitives(relation.primitives, sideSpacing, 0),
        );
      }
      case "space":
        return createBox(currentStyle.fontSize * node.em, 0, 0);
      case "fraction":
        return layoutFraction(node, currentStyle, layoutNode);
      case "script":
        return layoutScripts(node, currentStyle, layoutNode);
      case "sqrt":
        return layoutSquareRoot(node, currentStyle, layoutNode);
      case "underbrace":
        return layoutUnderbrace(node, currentStyle, layoutNode);
      case "overline":
        return layoutRuleDecoration(node, currentStyle, layoutNode, "top");
      case "underline":
        return layoutRuleDecoration(node, currentStyle, layoutNode, "bottom");
      case "accent":
        return layoutAccent(node, currentStyle, layoutNode);
      case "fenced":
        return layoutFencedBox(
          layoutNode(node.body, currentStyle),
          node.left,
          node.right,
          currentStyle,
        );
      case "matrix":
        return layoutMatrix(node, currentStyle, layoutNode);
    }
  };

  return normalizeBox(layoutNode(ast, style));
};

import {
  FONT_FAMILY,
  getFontString,
  getLineHeight,
  randomId,
} from "@excalidraw/common";
import {
  measureText,
  newLinearElement,
  newTextElement,
} from "@excalidraw/element";
import { pointFrom } from "@excalidraw/math";

import type {
  ExcalidrawElement,
  ExcalidrawTextElement,
  FontFamilyValues,
  StrokeStyle,
} from "@excalidraw/element/types";

import { layoutLatexAst } from "./layout";
import { parseLatex } from "./parser";

import type { LatexPrimitive } from "./layout";

export type RenderLatexOptions = {
  x?: number;
  y?: number;
  fontSize?: number;
  fontFamily?: FontFamilyValues;
  strokeColor?: string;
  opacity?: number;
  roughness?: number;
  strokeStyle?: StrokeStyle;
};

export type RenderLatexResult = {
  elements: ExcalidrawElement[];
  warnings: string[];
  groupId: string;
  width: number;
  height: number;
};

const createTextElement = (
  primitive: Extract<LatexPrimitive, { kind: "text" }>,
  context: {
    latex: string;
    formulaId: string;
    groupId: string;
    originX: number;
    originY: number;
    strokeColor: string;
    opacity: number;
  },
): ExcalidrawElement =>
  newTextElement({
    x: context.originX + primitive.x,
    y: context.originY + primitive.y,
    text: primitive.text,
    fontSize: primitive.fontSize,
    fontFamily: primitive.fontFamily,
    lineHeight: primitive.lineHeight as ExcalidrawTextElement["lineHeight"],
    strokeColor: context.strokeColor,
    opacity: context.opacity,
    groupIds: [context.groupId],
    customData: {
      latex: context.latex,
      latexFormulaId: context.formulaId,
      latexRenderer: "excalidraw-text-v1",
      latexRole: primitive.role,
    },
  });

const createLineElement = (
  primitive: Extract<LatexPrimitive, { kind: "line" }>,
  context: {
    latex: string;
    formulaId: string;
    groupId: string;
    originX: number;
    originY: number;
    strokeColor: string;
    opacity: number;
    roughness: number;
    strokeStyle: StrokeStyle;
  },
): ExcalidrawElement => {
  const minX = Math.min(primitive.x1, primitive.x2);
  const minY = Math.min(primitive.y1, primitive.y2);
  const maxX = Math.max(primitive.x1, primitive.x2);
  const maxY = Math.max(primitive.y1, primitive.y2);

  return newLinearElement({
    type: "line",
    x: context.originX + minX,
    y: context.originY + minY,
    width: maxX - minX,
    height: maxY - minY,
    points: [
      pointFrom(primitive.x1 - minX, primitive.y1 - minY),
      pointFrom(primitive.x2 - minX, primitive.y2 - minY),
    ],
    strokeColor: context.strokeColor,
    strokeWidth: primitive.strokeWidth,
    strokeStyle: context.strokeStyle,
    roughness: context.roughness,
    opacity: context.opacity,
    groupIds: [context.groupId],
    customData: {
      latex: context.latex,
      latexFormulaId: context.formulaId,
      latexRenderer: "excalidraw-text-v1",
      latexRole: primitive.role,
    },
  });
};

export const renderLatexToElements = (
  latex: string,
  options: RenderLatexOptions = {},
): RenderLatexResult => {
  const source = latex.trim();
  if (!source) {
    throw new Error("The LaTeX formula cannot be empty.");
  }

  const fontFamily = options.fontFamily ?? FONT_FAMILY.Excalifont;
  const lineHeight = getLineHeight(fontFamily);
  const { ast, warnings } = parseLatex(source);
  const layout = layoutLatexAst(ast, {
    fontSize: options.fontSize ?? 28,
    fontFamily,
    lineHeight,
    measureText: (value, fontSize, measuredFontFamily, measuredLineHeight) => {
      const metrics = measureText(
        value,
        getFontString({
          fontSize,
          fontFamily: measuredFontFamily,
        }),
        measuredLineHeight as ExcalidrawTextElement["lineHeight"],
      );
      return {
        ...metrics,
        baseline: fontSize * 0.881,
      };
    },
  });
  const groupId = randomId();
  const formulaId = randomId();
  const context = {
    latex: source,
    formulaId,
    groupId,
    originX: options.x ?? 0,
    originY: options.y ?? 0,
    strokeColor: options.strokeColor ?? "#1b1b1f",
    opacity: options.opacity ?? 100,
    roughness: options.roughness ?? 1,
    strokeStyle: options.strokeStyle ?? ("solid" as const),
  };

  return {
    elements: layout.primitives.map((primitive) =>
      primitive.kind === "text"
        ? createTextElement(primitive, context)
        : createLineElement(primitive, context),
    ),
    warnings,
    groupId,
    width: layout.width,
    height: layout.height,
  };
};

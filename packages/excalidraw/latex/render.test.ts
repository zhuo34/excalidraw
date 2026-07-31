import { FONT_FAMILY } from "@excalidraw/common";

import { renderLatexToElements } from "./render";

describe("renderLatexToElements", () => {
  it("renders a fraction as editable text and a line", () => {
    const result = renderLatexToElements("\\frac{a+b}{c}");
    const roles = result.elements.map(
      (element) => element.customData?.latexRole,
    );

    expect(result.elements.some((element) => element.type === "text")).toBe(
      true,
    );
    expect(result.elements.some((element) => element.type === "line")).toBe(
      true,
    );
    expect(roles).toContain("fraction-bar");
  });

  it("puts every generated element in one group", () => {
    const source = "\\sqrt{x^2+y^2}";
    const { elements, groupId } = renderLatexToElements(source);

    expect(elements.length).toBeGreaterThan(1);
    expect(
      elements.every(
        (element) =>
          element.groupIds.length === 1 && element.groupIds[0] === groupId,
      ),
    ).toBe(true);
    expect(
      elements.every((element) => element.customData?.latex === source),
    ).toBe(true);
  });

  it("uses Excalifont and smaller text elements for scripts", () => {
    const { elements } = renderLatexToElements("x_{ij}^{2}");
    const textElements = elements.filter((element) => element.type === "text");

    expect(
      textElements.every(
        (element) => element.fontFamily === FONT_FAMILY.Excalifont,
      ),
    ).toBe(true);
    expect(
      Math.min(...textElements.map((element) => element.fontSize)),
    ).toBeLessThan(
      Math.max(...textElements.map((element) => element.fontSize)),
    );
  });

  it("renders matrices and their delimiters", () => {
    const { elements } = renderLatexToElements(
      "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}",
    );
    const text = elements
      .filter((element) => element.type === "text")
      .map((element) => element.text)
      .join("");
    const delimiters = elements.filter(
      (element) => element.customData?.latexRole === "matrix-delimiter",
    );

    expect(text).toContain("a");
    expect(text).toContain("d");
    expect(delimiters.length).toBeGreaterThan(2);
    expect(
      Math.max(...delimiters.map((element) => element.strokeWidth)),
    ).toBeLessThanOrEqual(1);
  });

  it("renders an underbrace with a centered annotation", () => {
    const { elements } = renderLatexToElements(
      "\\underbrace{a + b + c}_{说明文字}",
    );
    const braceLines = elements.filter(
      (element) => element.customData?.latexRole === "underbrace",
    );
    const annotation = elements.find(
      (element) => element.customData?.latexRole === "underbrace-label",
    );

    expect(braceLines.length).toBeGreaterThan(6);
    expect(annotation?.type).toBe("text");
    expect(annotation?.type === "text" && annotation.text).toBe("说明文字");
    const braceLeft = Math.min(...braceLines.map((element) => element.x));
    const braceRight = Math.max(
      ...braceLines.map((element) => element.x + element.width),
    );
    expect(
      annotation &&
        Math.abs(
          annotation.x + annotation.width / 2 - (braceLeft + braceRight) / 2,
        ),
    ).toBeLessThan(0.01);
  });

  it("adds space on both sides of relation symbols", () => {
    const { elements } = renderLatexToElements("a=b");
    const textElements = elements.filter((element) => element.type === "text");
    const left = textElements.find((element) => element.text === "a")!;
    const relation = textElements.find((element) => element.text === "=")!;
    const right = textElements.find((element) => element.text === "b")!;

    expect(relation.x - (left.x + left.width)).toBeGreaterThanOrEqual(3);
    expect(right.x - (relation.x + relation.width)).toBeGreaterThanOrEqual(3);
  });

  it("rejects empty or malformed formulas", () => {
    expect(() => renderLatexToElements("   ")).toThrow();
    expect(() => renderLatexToElements("\\frac{a}")).toThrow();
  });
});

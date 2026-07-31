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

    expect(text).toContain("(");
    expect(text).toContain(")");
    expect(text).toContain("a");
    expect(text).toContain("d");
  });

  it("rejects empty or malformed formulas", () => {
    expect(() => renderLatexToElements("   ")).toThrow();
    expect(() => renderLatexToElements("\\frac{a}")).toThrow();
  });
});

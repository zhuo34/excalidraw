import React from "react";

import { FONT_FAMILY } from "@excalidraw/common";

import { getCommonBounds } from "@excalidraw/element";

import { Excalidraw } from "../index";

import { Keyboard, Pointer, UI } from "./helpers/ui";
import {
  fireEvent,
  GlobalTestState,
  render,
  screen,
  waitFor,
} from "./test-utils";

const mouse = new Pointer("mouse");

describe("LaTeX toolbar input", () => {
  it("opens the dialog and inserts one grouped formula", async () => {
    const { container } = await render(<Excalidraw />);
    const source = "$\\underbrace{a+b+c}_{说明文字}=d$";

    fireEvent.click(
      container.querySelector(".App-toolbar__extra-tools-trigger")!,
    );
    fireEvent.click(
      document.querySelector<HTMLElement>('[data-testid="toolbar-latex"]')!,
    );

    const input = await screen.findByLabelText("LaTeX");
    fireEvent.change(input, {
      target: { value: source },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Insert formula",
      }),
    );

    await waitFor(() => {
      expect(window.h.elements.length).toBeGreaterThan(1);
    });

    const groupIds = new Set(
      window.h.elements.flatMap((element) => element.groupIds),
    );
    expect(groupIds.size).toBe(1);
    expect(
      window.h.elements.some(
        (element) => element.customData?.latexRole === "underbrace",
      ),
    ).toBe(true);
    expect(
      window.h.elements
        .filter((element) => element.type === "text")
        .every((element) => element.fontFamily === FONT_FAMILY.Excalifont),
    ).toBe(true);
    expect(
      window.h.elements.every(
        (element) =>
          element.customData?.latex === source &&
          (element.type !== "text" || !element.text.includes("$")),
      ),
    ).toBe(true);
    expect(window.h.state.openDialog).toBeNull();
    expect(GlobalTestState.renderResult.queryByLabelText("LaTeX")).toBeNull();
  });

  it("edits a rendered formula in place on double click", async () => {
    const { container } = await render(
      <Excalidraw handleKeyboardGlobally={true} />,
    );
    const source = "\\underbrace{a+b}_{说明}=c";
    const updatedSource = "x^2 = y";

    fireEvent.click(
      container.querySelector(".App-toolbar__extra-tools-trigger")!,
    );
    fireEvent.click(
      document.querySelector<HTMLElement>('[data-testid="toolbar-latex"]')!,
    );
    fireEvent.change(await screen.findByLabelText("LaTeX"), {
      target: { value: source },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Insert formula",
      }),
    );

    await waitFor(() => {
      expect(window.h.elements.length).toBeGreaterThan(1);
    });

    const insertedElements = [...window.h.elements];
    UI.resize(insertedElements, "se", [100, 100]);

    const originalElements = window.h.elements.filter(
      (element) => !element.isDeleted,
    );
    const originalElementIds = new Set(
      originalElements.map((element) => element.id),
    );
    const originalGroupId = originalElements[0].groupIds[0];
    const [oldX1, oldY1, oldX2, oldY2] = getCommonBounds(originalElements);
    const formulaText = originalElements.find(
      (element) => element.type === "text",
    )!;
    const resizedMaxFontSize = Math.max(
      ...originalElements
        .filter((element) => element.type === "text")
        .map((element) => element.fontSize),
    );

    expect(resizedMaxFontSize).toBeGreaterThan(28);

    mouse.doubleClickOn(formulaText);

    const editInput = await screen.findByLabelText("LaTeX");
    expect(editInput).toHaveValue(source);
    fireEvent.change(editInput, {
      target: { value: updatedSource },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Update formula",
      }),
    );

    await waitFor(() => {
      expect(
        window.h.elements.every(
          (element) => element.customData?.latex === updatedSource,
        ),
      ).toBe(true);
    });

    const [newX1, newY1, newX2, newY2] = getCommonBounds(window.h.elements);
    const updatedMaxFontSize = Math.max(
      ...window.h.elements.flatMap((element) =>
        !element.isDeleted && element.type === "text" ? [element.fontSize] : [],
      ),
    );
    expect(
      window.h.elements.every(
        (element) =>
          element.groupIds[0] === originalGroupId &&
          !originalElementIds.has(element.id),
      ),
    ).toBe(true);
    expect((newX1 + newX2) / 2).toBeCloseTo((oldX1 + oldX2) / 2);
    expect((newY1 + newY2) / 2).toBeCloseTo((oldY1 + oldY2) / 2);
    expect(updatedMaxFontSize).toBeCloseTo(resizedMaxFontSize);
    expect(GlobalTestState.renderResult.queryByLabelText("LaTeX")).toBeNull();

    Keyboard.undo();
    await waitFor(() => {
      expect(
        window.h.elements
          .filter((element) => !element.isDeleted)
          .every((element) => element.customData?.latex === source),
      ).toBe(true);
    });
  });

  it("leaves double click behavior unchanged for regular elements", async () => {
    await render(<Excalidraw />);
    const rectangle = UI.createElement("rectangle", {
      x: 20,
      y: 20,
      size: 100,
    });

    UI.clickTool("selection");
    mouse.clickOn(rectangle);
    mouse.doubleClickOn(rectangle);

    expect(GlobalTestState.renderResult.queryByLabelText("LaTeX")).toBeNull();
    expect(window.h.state.openDialog?.name).not.toBe("latex");
  });
});

import React from "react";

import { FONT_FAMILY } from "@excalidraw/common";

import { Excalidraw } from "../index";

import {
  fireEvent,
  GlobalTestState,
  render,
  screen,
  waitFor,
} from "./test-utils";

describe("LaTeX toolbar input", () => {
  it("opens the dialog and inserts one grouped formula", async () => {
    const { container } = await render(<Excalidraw />);

    fireEvent.click(
      container.querySelector(".App-toolbar__extra-tools-trigger")!,
    );
    fireEvent.click(
      document.querySelector<HTMLElement>('[data-testid="toolbar-latex"]')!,
    );

    const input = await screen.findByLabelText("LaTeX");
    fireEvent.change(input, {
      target: { value: "\\underbrace{a+b+c}_{说明文字}=d" },
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
    expect(window.h.state.openDialog).toBeNull();
    expect(GlobalTestState.renderResult.queryByLabelText("LaTeX")).toBeNull();
  });
});

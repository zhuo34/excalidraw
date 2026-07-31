import { useState } from "react";

import { t } from "../i18n";
import { renderLatexToElements } from "../latex/render";

import { useApp } from "./App";
import { Dialog } from "./Dialog";
import DialogActionButton from "./DialogActionButton";

import "./LatexDialog.scss";

export const LatexDialog = () => {
  const app = useApp();
  const dialogState =
    app.state.openDialog?.name === "latex" ? app.state.openDialog : null;
  const isEditing = Boolean(dialogState?.elementId);
  const [formula, setFormula] = useState(dialogState?.source ?? "");
  const [error, setError] = useState<string | null>(null);

  const onClose = () => {
    app.setOpenDialog(null);
    app.focusContainer();
  };

  const onSubmit = () => {
    const source = formula.trim();
    if (!source) {
      setError(t("latex.emptyError"));
      return;
    }

    try {
      const targetElement = dialogState?.elementId
        ? app.scene.getElement(dialogState.elementId)
        : null;
      const formulaGroupId = targetElement?.groupIds[0];
      const formulaElements = formulaGroupId
        ? app.scene
            .getNonDeletedElements()
            .filter(
              (element) =>
                element.groupIds[0] === formulaGroupId &&
                element.customData?.latexFormulaId ===
                  targetElement?.customData?.latexFormulaId,
            )
        : [];
      const storedFontSize = targetElement?.customData?.latexFontSize;
      const storedRoughness = targetElement?.customData?.latexRoughness;
      const storedStrokeStyle = targetElement?.customData?.latexStrokeStyle;
      const fallbackFontSize =
        formulaElements.reduce(
          (fontSize, element) =>
            element.type === "text"
              ? Math.max(fontSize, element.fontSize)
              : fontSize,
          0,
        ) || app.state.currentItemFontSize;
      const { elements } = renderLatexToElements(source, {
        fontSize:
          typeof storedFontSize === "number"
            ? storedFontSize
            : fallbackFontSize,
        strokeColor:
          targetElement?.strokeColor ?? app.state.currentItemStrokeColor,
        opacity: targetElement?.opacity ?? app.state.currentItemOpacity,
        roughness:
          typeof storedRoughness === "number"
            ? storedRoughness
            : app.state.currentItemRoughness,
        strokeStyle:
          storedStrokeStyle === "solid" ||
          storedStrokeStyle === "dashed" ||
          storedStrokeStyle === "dotted"
            ? storedStrokeStyle
            : app.state.currentItemStrokeStyle,
      });
      if (
        dialogState?.elementId &&
        !app.replaceLatexFormula(dialogState.elementId, elements)
      ) {
        setError(t("latex.editTargetMissing"));
        return;
      }
      if (!dialogState?.elementId) {
        app.onInsertElements(elements);
      }
      onClose();
    } catch (renderError) {
      setError(
        renderError instanceof Error
          ? renderError.message.split("\n")[0]
          : t("latex.renderError"),
      );
    }
  };

  return (
    <Dialog
      className="LatexDialog"
      size="small"
      title={t(isEditing ? "latex.editTitle" : "latex.title")}
      onCloseRequest={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="LatexDialog__label" htmlFor="latex-formula-input">
          {t("latex.inputLabel")}
        </label>
        <textarea
          id="latex-formula-input"
          className="LatexDialog__input"
          value={formula}
          onChange={(event) => {
            setFormula(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={t("latex.placeholder")}
          rows={5}
          spellCheck={false}
          aria-describedby="latex-formula-help"
        />
        <p id="latex-formula-help" className="LatexDialog__help">
          {t(isEditing ? "latex.editDescription" : "latex.description")}
        </p>
        {error && (
          <p className="LatexDialog__error" role="alert">
            {error}
          </p>
        )}
        <div className="LatexDialog__actions">
          <DialogActionButton label={t("buttons.cancel")} onClick={onClose} />
          <DialogActionButton
            label={t(isEditing ? "latex.update" : "latex.insert")}
            actionType="primary"
            type="submit"
          />
        </div>
      </form>
    </Dialog>
  );
};

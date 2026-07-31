import { useState } from "react";

import { t } from "../i18n";
import { renderLatexToElements } from "../latex/render";

import { useApp } from "./App";
import { Dialog } from "./Dialog";
import DialogActionButton from "./DialogActionButton";

import "./LatexDialog.scss";

export const LatexDialog = () => {
  const app = useApp();
  const [formula, setFormula] = useState("");
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
      const { elements } = renderLatexToElements(source, {
        fontSize: app.state.currentItemFontSize,
        strokeColor: app.state.currentItemStrokeColor,
        opacity: app.state.currentItemOpacity,
        roughness: app.state.currentItemRoughness,
        strokeStyle: app.state.currentItemStrokeStyle,
      });
      app.onInsertElements(elements);
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
      title={t("latex.title")}
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
          {t("latex.description")}
        </p>
        {error && (
          <p className="LatexDialog__error" role="alert">
            {error}
          </p>
        )}
        <div className="LatexDialog__actions">
          <DialogActionButton label={t("buttons.cancel")} onClick={onClose} />
          <DialogActionButton
            label={t("latex.insert")}
            actionType="primary"
            type="submit"
          />
        </div>
      </form>
    </Dialog>
  );
};

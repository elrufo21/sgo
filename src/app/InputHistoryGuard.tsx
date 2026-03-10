import { useEffect } from "react";

type FormFieldElement = HTMLInputElement | HTMLTextAreaElement;

const FORM_SELECTOR = "form";
const FIELD_SELECTOR = "input, textarea";

const TEXT_LIKE_INPUT_TYPES = new Set([
  "text",
  "password",
  "email",
  "search",
  "tel",
  "url",
  "number",
]);

const setAttr = (el: Element, name: string, value: string) => {
  if (el.getAttribute(name) !== value) {
    el.setAttribute(name, value);
  }
};

const hardenForm = (form: HTMLFormElement) => {
  setAttr(form, "autocomplete", "off");
  setAttr(form, "data-lpignore", "true");
  setAttr(form, "data-1p-ignore", "true");
  setAttr(form, "data-bwignore", "true");
  setAttr(form, "data-form-type", "other");
};

const hardenField = (field: FormFieldElement) => {
  if (field instanceof HTMLInputElement) {
    const inputType = field.type.toLowerCase();
    if (!TEXT_LIKE_INPUT_TYPES.has(inputType)) {
      return;
    }

    const autoCompleteValue = inputType === "password" ? "new-password" : "off";
    setAttr(field, "autocomplete", autoCompleteValue);
  } else {
    setAttr(field, "autocomplete", "off");
  }

  setAttr(field, "autocorrect", "off");
  setAttr(field, "autocapitalize", "off");
  setAttr(field, "spellcheck", "false");
  setAttr(field, "data-lpignore", "true");
  setAttr(field, "data-1p-ignore", "true");
  setAttr(field, "data-bwignore", "true");
  setAttr(field, "data-form-type", "other");
};

const hardenNodeTree = (node: ParentNode | Element) => {
  if (node instanceof HTMLFormElement) {
    hardenForm(node);
  }
  if (
    node instanceof HTMLInputElement ||
    node instanceof HTMLTextAreaElement
  ) {
    hardenField(node);
  }

  if (!(node instanceof Element || node instanceof Document)) return;

  node.querySelectorAll(FORM_SELECTOR).forEach((form) => {
    hardenForm(form as HTMLFormElement);
  });
  node.querySelectorAll(FIELD_SELECTOR).forEach((field) => {
    hardenField(field as FormFieldElement);
  });
};

export function InputHistoryGuard() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    hardenNodeTree(document);

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      hardenNodeTree(target);
      const parentForm = target.closest("form");
      if (parentForm) {
        hardenForm(parentForm);
      }
    };

    document.addEventListener("focusin", onFocusIn, true);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((addedNode) => {
          if (addedNode instanceof Element) {
            hardenNodeTree(addedNode);
          }
        });
      });
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", onFocusIn, true);
    };
  }, []);

  return null;
}

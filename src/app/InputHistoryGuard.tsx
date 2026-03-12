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

const USERNAME_HINTS = ["username", "usuario", "user", "login", "alias"];
const PASSWORD_HINTS = [
  "password",
  "pass",
  "clave",
  "contrasena",
  "currentpassword",
  "newpassword",
];

const normalizeHint = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const includesAnyHint = (value: string, hints: string[]) =>
  hints.some((hint) => value.includes(hint));

const setAttr = (el: Element, name: string, value: string) => {
  if (el.getAttribute(name) !== value) {
    el.setAttribute(name, value);
  }
};

const clearManagedUppercaseStyle = (field: FormFieldElement) => {
  if (field.getAttribute("data-uppercase-managed") !== "true") return;
  field.style.removeProperty("text-transform");
  field.removeAttribute("data-uppercase-managed");
};

const setUppercaseStyle = (field: FormFieldElement) => {
  setAttr(field, "data-uppercase-managed", "true");
  field.style.setProperty("text-transform", "uppercase");
};

const isTextLikeField = (field: FormFieldElement) => {
  if (field instanceof HTMLTextAreaElement) return true;
  const inputType = field.type.toLowerCase();
  return TEXT_LIKE_INPUT_TYPES.has(inputType) && inputType !== "hidden";
};

const getFieldDescriptors = (field: FormFieldElement) => {
  const descriptors = [
    field.getAttribute("name") ?? "",
    field.getAttribute("id") ?? "",
    field.getAttribute("placeholder") ?? "",
    field.getAttribute("aria-label") ?? "",
    field.getAttribute("data-field") ?? "",
  ]
    .map((value) => normalizeHint(value))
    .filter(Boolean);

  return descriptors;
};

const shouldSkipUppercase = (field: FormFieldElement) => {
  const noUppercaseAttr = field.getAttribute("data-no-uppercase");
  if (noUppercaseAttr === "true" || noUppercaseAttr === "1") return true;

  if (field instanceof HTMLInputElement) {
    const inputType = field.type.toLowerCase();
    if (inputType === "password") return true;
  }

  const descriptors = getFieldDescriptors(field);
  if (!descriptors.length) return false;

  return descriptors.some(
    (descriptor) =>
      includesAnyHint(descriptor, USERNAME_HINTS) ||
      includesAnyHint(descriptor, PASSWORD_HINTS),
  );
};

const enforceUppercaseValue = (field: FormFieldElement) => {
  if (field.disabled || field.readOnly) return;

  const rawValue = field.value ?? "";
  if (!rawValue) return;

  const upperValue = rawValue.toLocaleUpperCase("es-PE");
  if (upperValue === rawValue) return;

  const selectionStart = field.selectionStart;
  const selectionEnd = field.selectionEnd;

  field.value = upperValue;

  if (selectionStart === null || selectionEnd === null) return;
  try {
    field.setSelectionRange(selectionStart, selectionEnd);
  } catch {
    // ignore selection errors in unsupported input types
  }
};

const applyUppercaseBehavior = (field: FormFieldElement) => {
  if (!isTextLikeField(field)) return;

  if (shouldSkipUppercase(field)) {
    clearManagedUppercaseStyle(field);
    return;
  }

  setUppercaseStyle(field);
};

const hardenForm = (form: HTMLFormElement) => {
  setAttr(form, "autocomplete", "off");
  setAttr(form, "data-lpignore", "true");
  setAttr(form, "data-1p-ignore", "true");
  setAttr(form, "data-bwignore", "true");
  setAttr(form, "data-form-type", "other");
};

const hardenField = (
  field: FormFieldElement,
  options?: { skipReadonly?: boolean },
) => {
  if (!isTextLikeField(field)) return;
  applyUppercaseBehavior(field);

  if (field instanceof HTMLInputElement) {
    // Chrome/Safari ignore "off" in several cases; "new-password" is more reliable.
    setAttr(field, "autocomplete", "new-password");
  } else {
    setAttr(field, "autocomplete", "off");
  }

  setAttr(field, "aria-autocomplete", "none");
  setAttr(field, "autocorrect", "off");
  setAttr(field, "autocapitalize", "off");
  setAttr(field, "spellcheck", "false");
  setAttr(field, "data-lpignore", "true");
  setAttr(field, "data-1p-ignore", "true");
  setAttr(field, "data-bwignore", "true");
  setAttr(field, "data-form-type", "other");

  if (options?.skipReadonly) {
    if (field.hasAttribute("data-history-managed-readonly")) {
      field.removeAttribute("readonly");
    }
    return;
  }

  if (field.disabled) return;
  if (field.hasAttribute("readonly")) return;

  const activeElement = (field.ownerDocument ?? document).activeElement;
  if (activeElement === field) return;

  // Additional hardening for stubborn browser history/autofill dropdowns.
  setAttr(field, "data-history-managed-readonly", "true");
  setAttr(field, "readonly", "readonly");
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

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        hardenField(target, { skipReadonly: true });
      }

      const parentForm = target.closest("form");
      if (parentForm) {
        hardenForm(parentForm);
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      const target = event.target;
      if (
        !(
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
        )
      ) {
        return;
      }

      if (
        target.hasAttribute("data-history-managed-readonly") &&
        !target.disabled
      ) {
        target.setAttribute("readonly", "readonly");
      }
    };

    const onInput = (event: Event) => {
      const target = event.target;
      if (
        !(
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
        )
      ) {
        return;
      }

      applyUppercaseBehavior(target);
      if (shouldSkipUppercase(target)) return;
      enforceUppercaseValue(target);
    };

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    // Use window capture so uppercase mutation runs before React delegated onChange handlers.
    window.addEventListener("input", onInput, true);

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
      document.removeEventListener("focusout", onFocusOut, true);
      window.removeEventListener("input", onInput, true);
    };
  }, []);

  return null;
}

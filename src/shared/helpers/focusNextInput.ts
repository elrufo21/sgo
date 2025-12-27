const isSkippable = (el: HTMLElement) => {
  if (el.hasAttribute("disabled")) return true;
  if (el.getAttribute("aria-disabled") === "true") return true;
  if (el instanceof HTMLInputElement && el.type === "hidden") return true;
  return false;
};

const focusElement = (el: HTMLElement) => {
  el.focus({ preventScroll: true });

  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    const length = el.value?.length ?? 0;
    try {
      el.setSelectionRange?.(length, length);
    } catch {
      // Ignore selection errors on unsupported input types
    }
  }
};

export const focusNextInput = (current: HTMLElement): boolean => {
  const scope: ParentNode | Document =
    current.closest("form") ?? current.ownerDocument ?? document;

  const focusable = Array.from(
    scope.querySelectorAll<HTMLElement>('[data-auto-next="true"]')
  );

  const idx = focusable.indexOf(current);
  if (idx === -1) return false;

  for (let i = idx + 1; i < focusable.length; i += 1) {
    const candidate = focusable[i];
    if (isSkippable(candidate)) continue;
    focusElement(candidate);
    return true;
  }
  return false;
};

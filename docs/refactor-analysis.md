# Refactor analysis and recommendations

## Current state observations
- **API handling**: `apiRequest` responses are used inconsistently (checking `false`, `status === 500`, or truthy). Error handling is duplicated across stores and pages, sometimes logging to console.
- **State stores**: `employees.store.ts` and `maintenance.store.ts` have minimal typing and mix data normalization (e.g., uppercase transforms) with business operations. No shared helpers for common patterns (CRUD, normalization, validators).
- **Forms and validation**: Validations (email, DNI) and normalizations (uppercase names, machine codes) are implemented ad hoc per form. Focus logic is duplicated (custom helper exists but per-form wiring varies).
- **UI feedback**: Toast usage is scattered with hardcoded strings. Dialog confirmation is implemented via `useDialogStore` but without shared helpers for common flows (delete confirm).
- **Configuration**: API base URLs and endpoints are hardcoded in multiple files (`http://localhost:5000/api/v1/...`), making environment changes error-prone.
- **Table/search**: `DataTable` handles search and counts inline; there’s no debounce for heavy datasets.

## Opportunities for reuse
- **API layer helpers**: Create typed wrappers for CRUD (get/list/create/update/delete) that return a consistent shape `{ ok, data, status, error }`. Centralize base URL and headers. Example: `apiClient.delete("Personal", id)`.
- **Normalizers**: Functions for transforming payloads before sending (e.g., `normalizeEmployee`, `normalizeCategory`, `normalizeComputer`). Keeps uppercase logic out of components.
- **Validators**: Shared validation utils (email, DNI 8 digits, numeric-only with length) to reuse in React Hook Form rules.
- **Dialogs**: Helper `confirmDelete(entityLabel, onConfirm)` built on `useDialogStore` to standardize copy, buttons, and loading.
- **Toasts**: Wrapper functions `toastSuccess`, `toastError`, `toastInfo` to enforce consistent wording and options (`richColors` already enabled).
- **Focus management**: Already using `focusFirstInput`; ensure all forms use it consistently and accept a `ref` to avoid per-form boilerplate.
- **Configuration**: A central `config.ts` exporting environment-derived values (API base, feature flags). This avoids hardcoding endpoints across modules.

## Proposed structure
- `src/config.ts`
  - `API_BASE_URL`
  - `ENDPOINTS` (e.g., `{ personal: "/api/v1/Personal", categoria: "/api/v1/Category" }`)
  - `FEATURE_FLAGS` (optional)
- `src/shared/api/client.ts`
  - `request<T>(path, options) => ApiResult<T>`
  - CRUD helpers that compose `API_BASE_URL` + `ENDPOINTS`
- `src/shared/validators.ts`
  - `isEmail`, `isDni`, `required`, etc.
- `src/shared/normalizers.ts`
  - `normalizeEmployee`, `normalizeCategory`, `normalizeComputer`, etc.
- `src/shared/ui/confirmDelete.tsx`
  - Utility that invokes `useDialogStore` with standard text and handles async loading.
- `src/shared/ui/toast.ts`
  - `toastSuccess`, `toastError`, `toastWarning` wrappers.

## Targeted refactors
1) **API contract**: Define `ApiResult<T>` and update `apiRequest` to always resolve to `{ ok, data, status, error }`. Refactor stores to use this shape instead of `any`.
2) **Config**: Introduce `src/config.ts` and replace hardcoded URLs. Example usage: `request(`${ENDPOINTS.personal}/${id}`, { method: "DELETE" })`.
3) **Normalization**: Move uppercase transforms into normalizers consumed by stores or API layer, not in components. This reduces UI coupling.
4) **Validation**: Replace inline regexes with shared validators; compose them in form rules for clarity.
5) **Deletion flow**: Use a shared `confirmDelete` helper across categories, areas, employees, etc., to standardize UX copy and error handling.
6) **Toast messaging**: Replace hardcoded strings with centralized helpers to keep consistent tone and options.
7) **Types**: Strengthen store typings (actions, state) and API responses to reduce `any`.

## Quick win examples
- `config.ts`
  - ```ts
    export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
    export const ENDPOINTS = {
      personal: "/Personal",
      categoria: "/Categoria",
      // ...
    };
    ```
- `validators.ts`
  - ```ts
    export const isEmail = (v?: string) => !v?.trim() || /^\S+@\S+\.\S+$/.test(v.trim());
    export const isDni = (v?: string) => !v?.trim() || /^\d{8}$/.test(v.trim());
    ```
- `normalizers.ts`
  - ```ts
    export const normalizeEmployee = (v: Personal): Personal => ({
      ...v,
      personalNombres: v.personalNombres?.toUpperCase() ?? "",
      personalApellidos: v.personalApellidos?.toUpperCase() ?? "",
    });
    ```
- `ui/confirmDelete.tsx`
  - ```ts
    export const confirmDelete = (label: string, onConfirm: () => Promise<void> | void) =>
      useDialogStore.getState().openDialog({
        title: "Eliminar",
        content: <p>¿Seguro que deseas eliminar {label}?</p>,
        onConfirm,
      });
    ```

## Suggested sequence
1) Add `config.ts` and update API calls to use `API_BASE_URL` and `ENDPOINTS`.
2) Refactor `apiRequest` to return `ApiResult<T>` and update stores to use `ok`/`error`.
3) Introduce `validators.ts` and update form rules (email, DNI).
4) Add `normalizers.ts` and apply in stores before mutations.
5) Add `confirmDelete` and `toast` wrappers; replace per-page implementations.
6) Clean up logs, ensure focus helper is used uniformly.

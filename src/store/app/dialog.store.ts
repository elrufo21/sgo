import { create } from "zustand";
import type { ReactNode } from "react";
import type { DialogProps } from "@mui/material/Dialog";

type DialogOptions = {
  title?: string;
  content: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: (data?: unknown) => Promise<void> | void;
  onCancel?: () => void;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
  disableBackdropClose?: boolean;
};

const defaults = {
  open: false,
  title: "",
  content: null as ReactNode,
  confirmText: "Aceptar",
  cancelText: "Cancelar",
  fullWidth: true,
  maxWidth: "sm" as DialogProps["maxWidth"],
  disableBackdropClose: false,
  loading: false,
  data: null as unknown,
};

type DialogState = typeof defaults & {
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
  setLoading: (loading: boolean) => void;
  setData: (data: unknown) => void;
};

export const useDialogStore = create<DialogState>((set) => ({
  ...defaults,
  openDialog: (options) => set({ ...defaults, ...options, open: true }),
  closeDialog: () => set(defaults),
  setLoading: (loading) => set({ loading }),
  setData: (data) => set({ data }),
}));

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { useDialogStore } from "@/store/app/dialog.store";

export function GlobalDialog() {
  const {
    open,
    title,
    content,
    confirmText,
    cancelText,
    maxWidth,
    fullWidth,
    disableBackdropClose,
    loading,
    onConfirm,
    onCancel,
    closeDialog,
    setLoading,
  } = useDialogStore();

  const handleClose = (_e?: unknown, reason?: string) => {
    if (
      disableBackdropClose &&
      (reason === "backdropClick" || reason === "escapeKeyDown")
    )
      return;
    onCancel?.();
    closeDialog();
  };

  const handleConfirm = async () => {
    if (!onConfirm) return closeDialog();
    try {
      setLoading(true);
      await onConfirm();
      closeDialog();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
    >
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      <DialogContent dividers>{content}</DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {cancelText}
        </Button>
        {onConfirm && (
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : undefined}
          >
            {confirmText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

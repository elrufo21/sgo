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
    disableClose,
    hideCancelButton,
    loading,
    data,
    onConfirm,
    onCancel,
    closeDialog,
    setLoading,
    setData,
  } = useDialogStore();

  const handleClose = (_e?: unknown, reason?: string) => {
    if (disableClose) return;
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
    let shouldResetData = true;
    try {
      setLoading(true);
      const shouldClose = await onConfirm(data);
      if (shouldClose === false) {
        shouldResetData = false;
        return;
      }
      closeDialog();
    } catch (error) {
      shouldResetData = false;
      console.error("Dialog confirm failed", error);
    } finally {
      setLoading(false);
      if (shouldResetData) {
        setData(null);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      disableEscapeKeyDown={disableClose || disableBackdropClose}
    >
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      <DialogContent dividers>{content}</DialogContent>
      <DialogActions>
        {!hideCancelButton && (
          <Button onClick={handleClose} disabled={loading}>
            {cancelText}
          </Button>
        )}
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

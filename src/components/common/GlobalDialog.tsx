import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useDialogStore } from "@/store/app/dialog.store";

export function GlobalDialog() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
    mobileFullScreen,
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
      fullScreen={isMobile && mobileFullScreen}
      maxWidth={maxWidth}
      disableEscapeKeyDown={disableClose || disableBackdropClose}
      scroll="paper"
      PaperProps={{
        sx: isMobile
          ? {
              width: "calc(100% - 16px)",
              maxHeight: "calc(100dvh - 16px)",
              m: 1,
            }
          : undefined,
      }}
    >
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      <DialogContent dividers sx={isMobile ? { p: 2 } : undefined}>
        {content}
      </DialogContent>
      <DialogActions sx={isMobile ? { px: 2, py: 1.5 } : undefined}>
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

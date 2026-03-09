import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface BackArrowButtonProps {
  fallbackTo?: string;
  className?: string;
  title?: string;
  ariaLabel?: string;
}

export function BackArrowButton({
  fallbackTo = "/",
  className,
  title = "Volver",
  ariaLabel = "Volver",
}: BackArrowButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackTo, { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      title={title}
      aria-label={ariaLabel}
      className={
        className ??
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors"
      }
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

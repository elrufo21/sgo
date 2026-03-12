import { useEffect, useMemo, useRef } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { BackArrowButton } from "@/components/common/BackArrowButton";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { getLocalDateISO } from "@/shared/helpers/localDate";
import type { Holiday } from "@/types/maintenance";
import { useDialogStore } from "@/store/app/dialog.store";

interface HolidayFormProps {
  initialData?: Partial<Holiday>;
  mode: "create" | "edit";
  onSave: (data: Holiday) => void | Promise<void>;
  onNew?: () => void;
  onDelete?: () => void;
  variant?: "page" | "modal";
}

const buildDefaults = (data?: Partial<Holiday>): Holiday => {
  const today = getLocalDateISO();

  return {
    id: data?.id ?? 0,
    fecha: data?.fecha ?? today,
    motivo: data?.motivo ?? "",
  };
};

export default function HolidayForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
  variant = "page",
}: HolidayFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isModal = variant === "modal";
  const setDialogData = useDialogStore((s) => s.setData);

  const defaults = useMemo(
    () => (mode === "edit" ? buildDefaults(initialData) : buildDefaults()),
    [initialData, mode],
  );

  const formMethods = useForm<Holiday>({
    defaultValues: defaults,
  });

  const {
    reset,
    handleSubmit,
    setFocus,
    watch,
    formState: { isSubmitting },
  } = formMethods;

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  useEffect(() => {
    focusFirstInput(containerRef.current);
  }, [mode, initialData]);

  useEffect(() => {
    if (!isModal) return;
    setDialogData(defaults);
    const subscription = watch((values) => {
      setDialogData({
        ...values,
        motivo: values.motivo?.toUpperCase() ?? "",
      });
    });
    return () => subscription.unsubscribe();
  }, [defaults, isModal, setDialogData, watch]);

  const handleSave = async (values: Holiday) => {
    await onSave({
      ...values,
      motivo: values.motivo?.toUpperCase() ?? "",
    });
    focusFirstInput(containerRef.current);
  };

  const handleNew = () => {
    reset(buildDefaults());
    onNew?.();
    focusFirstInput(containerRef.current);
  };

  return (
    <div
      ref={containerRef}
      className={isModal ? "h-auto" : "h-auto py-8 px-4 sm:px-6 lg:px-8"}
    >
      <div
        className={`w-full mx-auto bg-white overflow-hidden ${
          isModal ? "" : "rounded-2xl shadow-xl"
        }`}
      >
        <HookForm methods={formMethods} onSubmit={handleSubmit(handleSave)}>
          {!isModal && (
            <div className="bg-[#B23636] text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BackArrowButton />
                <h1 className="text-base font-semibold">
                  {mode === "create" ? "Crear feriado" : "Editar feriado"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-70 transition-colors"
                  title="Guardar"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Guardar</span>
                </button>
                {mode !== "edit" && (
                  <button
                    type="button"
                    onClick={handleNew}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                    title="Nuevo"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo</span>
                  </button>
                )}
                {mode === "edit" && onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
              {" "}
              <HookFormInput<Holiday>
                name="fecha"
                label="Fecha"
                type="date"
                autoComplete="off"
                onChange={() => {
                  window.setTimeout(() => {
                    setFocus("motivo");
                  }, 0);
                }}
                rules={{ required: "La fecha es obligatoria" }}
              />
            </div>
            <HookFormInput<Holiday>
              data-focus-first
              name="motivo"
              label="Motivo"
              autoComplete="one-time-code"
              placeholder="Motivo del feriado"
              rules={{ required: "El motivo es obligatorio" }}
            />
          </div>
        </HookForm>
      </div>
    </div>
  );
}

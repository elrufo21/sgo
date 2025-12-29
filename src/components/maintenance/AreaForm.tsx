import React, { useEffect, useMemo, useRef } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Area } from "@/types/maintenance";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";

interface AreaFormProps {
  initialData?: Partial<Area>;
  mode: "create" | "edit";
  onSave: (data: Area) => void | Promise<void>;
  onNew?: () => void;
  onDelete?: () => void;
}

const buildDefaults = (data?: Partial<Area>): Area => ({
  id: Number(data?.id ?? 0) || 0,
  area: data?.area ?? "",
});

export default function AreaForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: AreaFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const defaults = useMemo(() => buildDefaults(initialData), [initialData]);

  const formMethods = useForm<Area>({
    defaultValues: defaults,
  });

  const {
    reset,
    formState: { isSubmitting },
  } = formMethods;

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  useEffect(() => {
    focusFirstInput(containerRef.current);
  }, [mode, initialData]);

  const handleNew = () => {
    reset(buildDefaults());
    focusFirstInput(containerRef.current);
    onNew?.();
  };

  const onSubmit = async (values: Area) => {
    const payload: Area = { ...values, area: values.area?.toUpperCase() ?? "" };
    await onSave(payload);
    focusFirstInput(containerRef.current);
    if (mode === "create") {
      handleNew();
    }
  };

  return (
    <div ref={containerRef} className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <HookForm methods={formMethods} onSubmit={onSubmit}>
            <div className="bg-[#B23636]  text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <h1 className="text-base font-semibold">
                {mode === "create" ? "Crear area" : "Editar area"}
              </h1>
              <div className="flex items-center gap-2">
                {mode !== "edit" && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-70 transition-colors"
                    title="Guardar"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Guardar</span>
                  </button>
                )}
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

            <div className="p-6 sm:p-8">
              <div className="space-y-4">
                <HookFormInput<Area>
                  data-focus-first
                  name="area"
                  label="Nombre del area"
                  placeholder="Ingrese area"
                  rules={{ required: "El nombre del area es obligatorio" }}
                  disabled={mode === "edit"}
                />
              </div>
            </div>
          </HookForm>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useRef } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Provider } from "@/types/maintenance";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";

interface ProviderFormProps {
  initialData?: Partial<Provider>;
  mode: "create" | "edit";
  onSave: (data: Provider) => void | Promise<void>;
  onNew?: () => void;
  onDelete?: () => void;
}

export default function ProviderForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: ProviderFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const defaults = useMemo<Provider>(
    () => ({
      id: initialData?.id ?? 0,
      razon: initialData?.razon ?? "",
      ruc: initialData?.ruc ?? "",
      contacto: initialData?.contacto ?? "",
      celular: initialData?.celular ?? "",
      telefono: initialData?.telefono ?? "",
      correo: initialData?.correo ?? "",
      direccion: initialData?.direccion ?? "",
      estado: initialData?.estado ?? "",
    }),
    [initialData]
  );

  const formMethods = useForm<Provider>({
    defaultValues: defaults,
  });

  const {
    handleSubmit,
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
    reset({
      id: 0,
      razon: "",
      ruc: "",
      contacto: "",
      celular: "",
      telefono: "",
      correo: "",
      direccion: "",
      estado: "",
    });
    onNew?.();
    focusFirstInput(containerRef.current);
  };

  const onSubmit = async (values: Provider) => {
    const payload: Provider = {
      ...values,
      razon: values.razon?.toUpperCase() ?? "",
      contacto: values.contacto?.toUpperCase() ?? "",
      direccion: values.direccion?.toUpperCase() ?? "",
      estado: values.estado?.toUpperCase() ?? "",
    };
    await onSave(payload);
    if (mode === "create") {
      handleNew();
    }
  };

  const estadoOptions = [
    { value: "", label: "Seleccionar..." },
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
  ];

  return (
    <div ref={containerRef} className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {mode === "create" ? "Crear proveedor" : "Editar proveedor"}
            </h2>

            <HookForm methods={formMethods} onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HookFormInput<Provider>
                  name="razon"
                  label="Razon social"
                  placeholder="Ingrese razon social"
                  rules={{ required: "La razon social es obligatoria" }}
                  data-focus-first
                />
                <HookFormInput<Provider>
                  name="ruc"
                  label="RUC"
                  placeholder="RUC"
                  inputMode="numeric"
                  rules={{
                    required: "El RUC es obligatorio",
                    validate: (value) =>
                      !value?.trim() ||
                      /^\d{8,20}$/.test(value.trim()) ||
                      "Ingrese un RUC valido",
                  }}
                />
                <HookFormInput<Provider>
                  name="contacto"
                  label="Contacto"
                  placeholder="Nombre de contacto"
                />
                <HookFormInput<Provider>
                  name="correo"
                  label="Correo"
                  placeholder="Correo electronico"
                  type="email"
                />
                <HookFormInput<Provider>
                  name="celular"
                  label="Celular"
                  placeholder="Celular"
                  inputMode="tel"
                />
                <HookFormInput<Provider>
                  name="telefono"
                  label="Telefono"
                  placeholder="Telefono"
                  inputMode="tel"
                />
                <HookFormInput<Provider>
                  name="direccion"
                  label="Direccion"
                  placeholder="Direccion"
                />
                <HookFormSelect<Provider>
                  name="estado"
                  label="Estado"
                  options={estadoOptions}
                  rules={{ required: "El estado es obligatorio" }}
                />
              </div>

              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-70"
                >
                  <Save />
                  Guardar
                </button>
                {mode === "create" && (
                  <button
                    type="button"
                    onClick={handleNew}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg"
                  >
                    <Plus />
                    Nuevo
                  </button>
                )}
                {mode === "edit" && onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-lg"
                  >
                    <Trash2 />
                    Eliminar
                  </button>
                )}
              </div>
            </HookForm>
          </div>
        </div>
      </div>
    </div>
  );
}

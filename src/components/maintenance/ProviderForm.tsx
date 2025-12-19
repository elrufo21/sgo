import React, { useEffect, useMemo, useRef } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Provider } from "@/types/maintenance";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { useDialogStore } from "@/store/app/dialog.store";

interface ProviderFormProps {
  initialData?: Partial<Provider>;
  mode: "create" | "edit";
  onSave: (data: Provider) => void | Promise<void>;
  onNew?: () => void;
  onDelete?: () => void;
  variant?: "page" | "modal";
}

export default function ProviderForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
  variant = "page",
}: ProviderFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setDialogData = useDialogStore((s) => s.setData);
  const isModal = variant === "modal";

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
      estado: initialData?.estado ?? "ACTIVO",
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

  useEffect(() => {
    if (!isModal) return;
    const subscription = formMethods.watch((values) => {
      setDialogData({
        ...values,
        razon: values.razon?.toUpperCase() ?? "",
        contacto: values.contacto?.toUpperCase() ?? "",
        direccion: values.direccion?.toUpperCase() ?? "",
        estado: values.estado?.toUpperCase() ?? "",
      });
    });
    return () => subscription.unsubscribe();
  }, [isModal, formMethods, setDialogData]);

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
      <div
        className={`w-full mx-auto bg-white overflow-hidden ${
          isModal ? "" : "rounded-2xl shadow-xl"
        }`}
      >
        <HookForm methods={formMethods} onSubmit={handleSubmit(onSubmit)}>
          {!isModal && (
            <div className="bg-slate-700 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <h1 className="text-base font-semibold">
                {mode === "create" ? "Crear proveedor" : "Editar proveedor"}
              </h1>
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
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 order-2 xl:order-1">
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
                  disabled={mode !== "edit"}
                />
              </div>
              <div className="border-t-2 xl:border-t-0 xl:border-l-2 border-gray-100 pt-4 xl:pt-0 xl:pl-6 order-1 xl:order-2 xl:col-span-2">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    Buscar por RUC
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...formMethods.register("numeroDocumento")}
                      placeholder="Ingrese numero"
                      className="flex-1 w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                    <button
                      type="button"
                      className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        console.log("Consultar documento");
                      }}
                    >
                      Consultar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </HookForm>
      </div>
    </div>
  );
}

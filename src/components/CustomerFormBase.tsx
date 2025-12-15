import React, { useEffect, useMemo, useRef } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import type { Client } from "@/types/customer";

type CustomerFormValues = Omit<Client, "id"> & {
  tipoDocumento: "ruc" | "dni";
  numeroDocumento?: string;
};

interface ClientFormBaseProps {
  initialData?: Partial<Client>;
  mode: "create" | "edit";
  onSave: (data: Omit<Client, "id">) => void;
  onNew?: () => void;
  onDelete?: () => void;
}

const buildDefaults = (data?: Partial<Client>): CustomerFormValues => ({
  nombreRazon: data?.nombreRazon ?? "",
  ruc: data?.ruc ?? "",
  dni: data?.dni ?? "",
  direccionFiscal: data?.direccionFiscal ?? "",
  direccionDespacho: data?.direccionDespacho ?? "",
  telefonoMovil: data?.telefonoMovil ?? "",
  email: data?.email ?? "",
  registradoPor: data?.registradoPor ?? "",
  estado: data?.estado ?? "activo",
  fecha: data?.fecha ?? null,
  tipoDocumento: "ruc",
  numeroDocumento: "",
});

export default function CustomerFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: ClientFormBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const defaults = useMemo(
    () => (mode === "edit" ? buildDefaults(initialData) : buildDefaults()),
    [initialData, mode]
  );

  const formMethods = useForm<CustomerFormValues>({
    defaultValues: defaults,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = formMethods;

  useEffect(() => {
    focusFirstInput(containerRef.current);
  }, [mode, initialData]);

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const handleSave = async (values: CustomerFormValues) => {
    const nombreRazonUpper = values.nombreRazon?.toUpperCase() ?? "";
    const payload: Omit<Client, "id"> = {
      nombreRazon: nombreRazonUpper,
      ruc: values.ruc,
      dni: values.dni,
      direccionFiscal: values.direccionFiscal,
      direccionDespacho: values.direccionDespacho,
      telefonoMovil: values.telefonoMovil,
      email: values.email,
      registradoPor: values.registradoPor,
      estado: values.estado,
      fecha: values.fecha ?? null,
    };
    await onSave(payload);
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
      className="h-auto from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {mode === "create"
                  ? "Registrar Nuevo Cliente"
                  : "Editar Cliente"}
              </h2>
            </div>

            <HookForm methods={formMethods} onSubmit={handleSave}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 order-2 lg:order-1">
                  <div className="col-span-2">
                    <HookFormInput<CustomerFormValues>
                      data-focus-first="true"
                      name="nombreRazon"
                      label="Nombre o Razon Social"
                      placeholder="Ingrese nombre o razon social"
                      rules={{ required: "El nombre es obligatorio" }}
                    />
                  </div>

                  <HookFormInput<CustomerFormValues>
                    name="ruc"
                    label="RUC"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ingrese RUC"
                    rules={{
                      pattern: {
                        value: /^\d{11}$/,
                        message: "Debe tener 11 digitos",
                      },
                    }}
                  />

                  <HookFormInput<CustomerFormValues>
                    name="dni"
                    label="DNI"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    pattern="[0-9]*"
                    placeholder="Ingrese DNI"
                    rules={{
                      pattern: {
                        value: /^\d{8}$/,
                        message: "Debe tener 8 dígitos numéricos",
                      },
                      maxLength: {
                        value: 8,
                        message: "Debe tener 8 dígitos",
                      },
                      minLength: {
                        value: 8,
                        message: "Debe tener 8 dígitos",
                      },
                    }}
                  />

                  <HookFormInput<CustomerFormValues>
                    name="direccionFiscal"
                    label="Direccion Fiscal"
                    placeholder="Ingrese direccion fiscal"
                  />

                  <HookFormInput<CustomerFormValues>
                    name="direccionDespacho"
                    label="Direccion de Despacho"
                    placeholder="Ingrese direccion de despacho"
                  />

                  <HookFormInput<CustomerFormValues>
                    name="telefonoMovil"
                    label="Telefono Movil"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ingrese telefono movil"
                    rules={{
                      pattern: {
                        value: /^\d+$/,
                        message: "Solo números",
                      },
                    }}
                  />

                  <HookFormInput<CustomerFormValues>
                    name="email"
                    label="Correo / Email"
                    type="email"
                    placeholder="Ingrese correo electronico"
                    rules={{
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.com$/i,
                        message: "Debe incluir @ y terminar en .com",
                      },
                    }}
                  />

                  <HookFormInput<CustomerFormValues>
                    name="registradoPor"
                    label="Registrado por"
                    placeholder="Nombre del usuario"
                    disabled
                    className="w-full px-4 py-3 border-2 bg-gray-50 border-gray-200 cursor-not-allowed"
                  />

                  <HookFormSelect<CustomerFormValues>
                    name="estado"
                    label="Estado"
                    options={[
                      { value: "activo", label: "Activo" },
                      { value: "inactivo", label: "Inactivo" },
                    ]}
                    disabled={mode === "create"}
                  />
                </div>

                <div className="border-t-2 border-gray-100 pt-4 order-1 lg:order-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="ruc"
                          defaultChecked
                          {...formMethods.register("tipoDocumento")}
                          className="w-5 h-5 text-slate-600 focus:ring-2 focus:ring-slate-500"
                        />
                        <span className="text-gray-700 font-medium">RUC</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="dni"
                          {...formMethods.register("tipoDocumento")}
                          className="w-5 h-5 text-slate-600 focus:ring-2 focus:ring-slate-500"
                        />
                        <span className="text-gray-700 font-medium">DNI</span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="relative w-full">
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          {...formMethods.register("numeroDocumento")}
                          placeholder="Ingrese numero"
                          className="w-full pr-32 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                        />
                        <button
                          type="button"
                          className="absolute top-1/2 right-1.5 -translate-y-1/2 px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
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

                <div className="mt-8 pt-6 border-t-2 border-gray-100 w-full lg:col-span-3 order-3 lg:order-3">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <Save className="w-5 h-5" />
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={handleNew}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Nuevo
                    </button>
                    {mode === "edit" && onDelete && (
                      <button
                        type="button"
                        onClick={onDelete}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-600 hover:bg-red-50 transform hover:scale-105 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </HookForm>
          </div>
        </div>
      </div>
    </div>
  );
}

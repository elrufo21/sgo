import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2, X, FileEdit } from "lucide-react";
import type { Client } from "@/types/customer";

interface ClientFormBaseProps {
  initialData?: Partial<Client>;
  mode: "create" | "edit";
  onSave: (data: Omit<Client, "id">) => void;
  onNew?: () => void;
  onDelete?: () => void;
}

export default function CustomerFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: ClientFormBaseProps) {
  const [form, setForm] = useState<Omit<Client, "id">>({
    nombreRazon: "",
    ruc: "",
    dni: "",
    direccionFiscal: "",
    direccionDespacho: "",
    telefonoMovil: "",
    email: "",
    registradoPor: "",
    estado: "activo",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        nombreRazon: initialData.nombreRazon || "",
        ruc: initialData.ruc || "",
        dni: initialData.dni || "",
        direccionFiscal: initialData.direccionFiscal || "",
        direccionDespacho: initialData.direccionDespacho || "",
        telefonoMovil: initialData.telefonoMovil || "",
        email: initialData.email || "",
        registradoPor: initialData.registradoPor || "",
        estado: initialData.estado || "activo",
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSaveClick = () => {
    onSave(form);
  };

  const handleNewClick = () => {
    setForm({
      nombreRazon: "",
      ruc: "",
      dni: "",
      direccionFiscal: "",
      direccionDespacho: "",
      telefonoMovil: "",
      email: "",
      registradoPor: "",
      estado: "activo",
    });
    onNew?.();
  };

  return (
    <div className="h-auto from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nombre o Razón Social
                  </label>
                  <input
                    type="text"
                    name="nombreRazon"
                    value={form.nombreRazon}
                    onChange={handleChange}
                    placeholder="Ingrese nombre o razón social"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    RUC
                  </label>
                  <input
                    type="number"
                    name="ruc"
                    value={form.ruc}
                    onChange={handleChange}
                    placeholder="Ingrese RUC"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    DNI
                  </label>
                  <input
                    type="number"
                    name="dni"
                    value={form.dni}
                    onChange={handleChange}
                    placeholder="Ingrese DNI"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Dirección Fiscal
                  </label>
                  <input
                    type="text"
                    name="direccionFiscal"
                    value={form.direccionFiscal}
                    onChange={handleChange}
                    placeholder="Ingrese dirección fiscal"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Dirección de Despacho
                  </label>
                  <input
                    type="text"
                    name="direccionDespacho"
                    value={form.direccionDespacho}
                    onChange={handleChange}
                    placeholder="Ingrese dirección de despacho"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Teléfono Móvil
                  </label>
                  <input
                    type="number"
                    name="telefonoMovil"
                    value={form.telefonoMovil}
                    onChange={handleChange}
                    placeholder="Ingrese teléfono móvil"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Correo / Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Ingrese correo electrónico"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Registrado por
                  </label>
                  <input
                    type="text"
                    name="registradoPor"
                    value={form.registradoPor}
                    onChange={handleChange}
                    placeholder="Nombre del usuario"
                    className="w-full px-4 py-3 border-2 bg-gray-50 border-gray-200 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="border-t-2 border-gray-100 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoDocumento"
                        value="ruc"
                        defaultChecked
                        className="w-5 h-5 text-slate-600 focus:ring-2 focus:ring-slate-500"
                      />
                      <span className="text-gray-700 font-medium">RUC</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoDocumento"
                        value="dni"
                        className="w-5 h-5 text-slate-600 focus:ring-2 focus:ring-slate-500"
                      />
                      <span className="text-gray-700 font-medium">DNI</span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="relative w-full">
                      <input
                        type="number"
                        name="numeroDocumento"
                        placeholder="Ingrese número"
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

              <div className="mt-8 pt-6 border-t-2 border-gray-100 w-full lg:col-span-3">
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={handleSaveClick}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Save className="w-5 h-5" />
                    Guardar
                  </button>
                  <button
                    onClick={handleNewClick}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo
                  </button>
                  {mode === "edit" && onDelete && (
                    <button
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
          </div>
        </div>
      </div>
    </div>
  );
}

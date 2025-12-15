import React, { useState, useEffect, useRef } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import type { Category } from "@/types/maintenance";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { useDialogStore } from "@/store/app/dialog.store";

interface CategoriaFormProps {
  initialData?: Partial<Category>;
  mode: "create" | "edit";
  onSave: (data: Category) => void;
  onNew?: () => void;
  onDelete?: () => void;

  variant?: "page" | "modal";
}

export default function CategoriaForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
  variant = "page",
}: CategoriaFormProps) {
  console.log("initialData", initialData);
  const [form, setForm] = useState<Category>({
    id: 0,
    nombreSublinea: "",
    codigoSunat: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const setDialogData = useDialogStore((s) => s.setData);

  const isModal = variant === "modal";

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  useEffect(() => {
    focusFirstInput(containerRef.current);
  }, [mode, initialData]);

  const handleNew = () => {
    setForm({ id: 0, nombreSublinea: "", codigoSunat: null });
    focusFirstInput(containerRef.current);
    onNew?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Para modo modal, exponer data al dialog store
  useEffect(() => {
    if (isModal) {
      setDialogData({
        ...form,
        nombreSublinea: form.nombreSublinea?.toUpperCase() ?? "",
      });
    }
  }, [form, isModal, setDialogData]);

  const handleSave = async () => {
    const payload: Category = {
      ...form,
      nombreSublinea: form.nombreSublinea?.toUpperCase() ?? "",
    };
    await onSave(payload);
    focusFirstInput(containerRef.current);
  };

  return (
    <div ref={containerRef} className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div
          className={`bg-white ${
            variant !== "modal" && "rounded-2xl shadow-xl"
          } overflow-hidden`}
        >
          <div className="p-6 sm:p-8">
            {variant !== "modal" && (
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {mode === "create" ? "Crear Categoría" : "Editar Categoría"}
              </h2>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nombre de categoría
                </label>
                <input
                  data-focus-first
                  type="text"
                  name="nombreSublinea"
                  value={form.nombreSublinea}
                  onChange={handleChange}
                  placeholder="Ingrese nombre"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              {mode === "edit" && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Código SUNAT
                  </label>
                  <input
                    type="text"
                    name="codigoSunat"
                    value={form.codigoSunat ?? ""}
                    onChange={handleChange}
                    placeholder="Ej: 1232"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
              )}
            </div>

            {/* ----------- Actions ----------- */}
            {!isModal && (
              <div className="mt-8 flex gap-3 justify-center flex-wrap">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600
                  text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  <Save className="w-5 h-5" /> Guardar
                </button>

                {mode === "create" && (
                  <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-6 py-3 border-2 
                    border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                  >
                    <Plus className="w-5 h-5" /> Nuevo
                  </button>
                )}

                {mode === "edit" && onDelete && (
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-2 px-6 py-3 border-2 
                    border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-5 h-5" /> Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

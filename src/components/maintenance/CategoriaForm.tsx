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

  const Header = () =>
    isModal ? null : (
      <div className="bg-[#DB564D]  text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
        <h1 className="text-base font-semibold">
          {mode === "create" ? "Crear Categoria" : "Editar Categoria"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
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
    );

  return (
    <div ref={containerRef} className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div
          className={`bg-white ${
            variant !== "modal" && "rounded-2xl shadow-xl"
          } overflow-hidden`}
        >
          <Header />
          <div className="p-6 sm:p-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nombre de categoria
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
                    Codigo SUNAT
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
          </div>
        </div>
      </div>
    </div>
  );
}

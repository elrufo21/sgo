import React, { useEffect, useState, useRef } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import type { Area } from "@/types/maintenance";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";

interface AreaFormProps {
  initialData?: Partial<Area>;
  mode: "create" | "edit";
  onSave: (data: Area) => void;
  onNew?: () => void;
  onDelete?: () => void;
}

export default function AreaForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: AreaFormProps) {
  const [form, setForm] = useState<Area>({ id: 0, area: "" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (initialData) setForm((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  useEffect(() => {
    focusFirstInput(formRef.current);
  }, [mode, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClickNew = () => {
    setForm({ id: 0, area: "" });
    focusFirstInput(formRef.current);
    onNew?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.area.trim()) {
      alert("El nombre del area es obligatorio");
      return;
    }
    const payload: Area = { ...form, area: form.area.toUpperCase() };
    await onSave(payload);
    focusFirstInput(formRef.current);
    if (mode === "create") {
      setForm({ id: 0, area: "" });
      focusFirstInput(formRef.current);
    }
  };
  console.log("mode", mode);
  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="h-auto py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-700 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
            <h1 className="text-base font-semibold">
              {mode === "create" ? "Crear area" : "Editar area"}
            </h1>
            <div className="flex items-center gap-2">
              {mode !== "edit" && (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                  title="Guardar"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Guardar</span>
                </button>
              )}
              {mode !== "edit" && (
                <button
                  type="button"
                  onClick={handleClickNew}
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
              <label className="block text-sm font-semibold text-gray-700">
                Nombre del area
              </label>
              <input
                data-focus-first="true"
                type="text"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="Ingrese area"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                disabled={mode === "edit"}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

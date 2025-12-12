import React, { useEffect, useState, useRef } from "react";
import { Save, Plus } from "lucide-react";
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
      alert("El nombre del Ē­rea es obligatorio");
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

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="h-auto py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {mode === "create" ? "Crear area" : "Editar area"}
            </h2>

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
                placeholder="Ingrese Ē­rea"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                disabled={mode === "edit"}
              />
            </div>

            <div className="mt-8 flex gap-3 justify-center flex-wrap">
              {mode !== "edit" && (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white 
                font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  <Save className="w-5 h-5" /> Guardar
                </button>
              )}

              {mode === "create" && (
                <button
                  type="button"
                  onClick={handleClickNew}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-blue-600 
                    text-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  <Plus className="w-5 h-5" /> Nuevo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

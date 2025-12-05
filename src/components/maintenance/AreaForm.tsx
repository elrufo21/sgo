import React, { useEffect, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import type { Area } from "@/types/maintenance";

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

  useEffect(() => {
    if (initialData) setForm((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(form)
    if (!form.area.trim()) {
      alert("El nombre del área es obligatorio");
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {mode === "create" ? "Crear Área" : "Editar Área"}
            </h2>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Nombre del Área
              </label>
              <input
                type="text"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="Ingrese área"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                disabled
              />
            </div>

            <div className="mt-8 flex gap-3 justify-center flex-wrap">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white 
                font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                <Save className="w-5 h-5" /> Guardar
              </button>

              {mode === "edit" && (
                <>
                  <button
                    type="button"
                    onClick={onNew}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-blue-600 
                    text-blue-600 rounded-lg hover:bg-blue-50 transition"
                  >
                    <Plus className="w-5 h-5" /> Nuevo
                  </button>

                  {onDelete && (
                    <button
                      type="button"
                      onClick={onDelete}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-red-600 
                      text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-5 h-5" /> Eliminar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

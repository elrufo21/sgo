import { useEffect, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Computer } from "@/types/maintenance";

interface ComputerFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Computer>;
  onSave: (data: Omit<Computer, "id">) => void;
  onNew?: () => void;
  onDelete?: () => void;
}

export default function ComputerForm({
  mode,
  initialData,
  onSave,
  onNew,
  onDelete,
}: ComputerFormProps) {
  const { areas, fetchAreas } = useMaintenanceStore();

  const [form, setForm] = useState<Omit<Computer, "id">>({
    maquina: "",
    registro: "",
    serieFactura: "",
    serieNc: "",
    serieBoleta: "",
    ticketera: "",
    areaId: 0,
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        registro: initialData.registro
          ? new Date(initialData.registro).toISOString().slice(0, 10)
          : "",
      }));
    }
  }, [initialData]);

  // Cargar áreas
  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "areaId" ? Number(value) : value,
    }));
  };

  return (
    <div className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {mode === "create"
                ? "Registrar nueva Computadora"
                : "Editar Computadora"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Máquina *
                </label>
                <input
                  type="text"
                  name="maquina"
                  value={form.maquina}
                  onChange={handleChange}
                  placeholder="Ej: PC-001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Registro *
                </label>
                <input
                  type="date"
                  name="registro"
                  value={form.registro}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Serie Factura
                </label>
                <input
                  type="text"
                  name="serieFactura"
                  value={form.serieFactura}
                  onChange={handleChange}
                  placeholder="Ej: F001-000123"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Serie NC
                </label>
                <input
                  type="text"
                  name="serieNc"
                  value={form.serieNc}
                  onChange={handleChange}
                  placeholder="Ej: NC001-00001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Serie Boleta
                </label>
                <input
                  type="text"
                  name="serieBoleta"
                  value={form.serieBoleta}
                  onChange={handleChange}
                  placeholder="Ej: B001-000123"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Ticketera
                </label>
                <input
                  type="text"
                  name="ticketera"
                  value={form.ticketera}
                  onChange={handleChange}
                  placeholder="Ej: TICKET-01"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Área asignada
                </label>
                <select
                  name="areaId"
                  value={form.areaId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  <option value={0}>Seleccione área</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => onSave(form)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white 
                  font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                <Save className="w-5 h-5" /> Guardar
              </button>

              {mode === "edit" && (
                <>
                  {onNew && (
                    <button
                      onClick={onNew}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-blue-600 
                        text-blue-600 rounded-lg hover:bg-blue-50 transition"
                    >
                      <Plus className="w-5 h-5" /> Nuevo
                    </button>
                  )}

                  {onDelete && (
                    <button
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
    </div>
  );
}

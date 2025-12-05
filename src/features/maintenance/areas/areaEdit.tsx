import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import type { Area } from "@/types/maintenance";
import AreaForm from "@/components/maintenance/AreaForm";
import { toast } from "sonner";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

export default function AreaEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { areas, fetchAreas, updateArea, deleteArea } = useMaintenanceStore();

  const [form, setForm] = useState<Omit<Area, "id">>({
    area: "",
  });

  // Cargar áreas si aún no están
  useEffect(() => {
    if (areas.length === 0) fetchAreas();
  }, [areas, fetchAreas]);

  // Cargar datos del área a editar
  useEffect(() => {
    const area = areas.find((a) => a.id === Number(id));
    if (area) {
      const { id, ...rest } = area;
      setForm(rest);
    }
  }, [areas, id]);

  if (!form) return <div>Cargando área...</div>;

  const handleSave = () => {
    updateArea(Number(id), form);
    toast.success("Área actualizada correctamente");
    navigate("/maintenance/areas");
  };

  const handleDelete = () => {
    deleteArea(Number(id));
    toast.success("Área eliminada correctamente");
    navigate("/maintenance/areas");
  };

  return (
    <AreaForm
      mode="edit"
      initialData={form}
      onSave={handleSave}
      onNew={() => navigate("/maintenance/areas/create")}
      onDelete={handleDelete}
    />
  );
}

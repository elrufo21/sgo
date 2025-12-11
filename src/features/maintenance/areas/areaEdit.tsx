import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Area } from "@/types/maintenance";
import AreaForm from "@/components/maintenance/AreaForm";
import { useAreasQuery } from "./useAreasQuery";

export default function AreaEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateArea, deleteArea, areas } = useMaintenanceStore();
  const { data = [] } = useAreasQuery();

  const [initialData, setInitialData] = useState<Area | undefined>();

  useEffect(() => {
    const source = areas.length ? areas : data;
    console.log("idid", id, areas);
    const area = source.find((a) => Number(a.id) === Number(id));
    if (area) setInitialData(area);
  }, [areas, data, id]);

  if (!initialData) return <div>Cargando área...</div>;

  const handleSave = async (data: Area) => {
    if (!id) return;
    await updateArea(Number(id), data);
    toast.success("Área actualizada correctamente");
    navigate("/maintenance/areas");
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteArea(Number(id));
    toast.success("Área eliminada");
    navigate("/maintenance/areas");
  };

  return (
    <AreaForm
      mode="edit"
      initialData={initialData}
      onSave={handleSave}
      onNew={() => navigate("/maintenance/areas/create")}
      onDelete={handleDelete}
    />
  );
}

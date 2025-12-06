import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Area } from "@/types/maintenance";
import AreaForm from "@/components/maintenance/AreaForm";
import { useAppStore } from "@/store/app/app.store";

export default function AreaEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { areas, fetchAreas, updateArea, deleteArea } = useMaintenanceStore();

  const [initialData, setInitialData] = useState<Area | undefined>();

  useEffect(() => {
    if (areas.length === 0) fetchAreas();
  }, [areas, fetchAreas]);

  useEffect(() => {
    const area = areas.find((a) => a.id === Number(id));
    if (area) setInitialData(area);
  }, [areas, id]);

  if (!initialData) return <div>Cargando área...</div>;

  const handleSave = (data: Area) => {
    console.log("data", data);
    updateArea(Number(id), data);
    toast.success("Área actualizada correctamente");
    navigate("/maintenance/areas");
  };

  const handleDelete = () => {
    deleteArea(Number(id));
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

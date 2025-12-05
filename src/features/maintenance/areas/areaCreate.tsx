import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { Area } from "@/types/maintenance";
import AreaForm from "@/components/maintenance/AreaForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

export default function AreaCreate() {
  const navigate = useNavigate();
  const { addArea, deleteArea } = useMaintenanceStore();

  const [form, setForm] = useState<Omit<Area, "id">>({
    area: "",
  });

  const handleSave = () => {
    addArea(form);
    toast.success("Área creada correctamente");
    navigate("/maintenance/areas");
  };

  const handleNew = () => {
    setForm({ area: "" });
  };

  return (
    <AreaForm
      mode="create"
      initialData={form}
      onSave={handleSave}
      onNew={handleNew}
      onDelete={() => {}}
    />
  );
}

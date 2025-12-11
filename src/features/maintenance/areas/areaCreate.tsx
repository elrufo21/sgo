import { useNavigate } from "react-router";
import { toast } from "sonner";
import AreaForm from "@/components/maintenance/AreaForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

export default function AreaCreate() {
  const navigate = useNavigate();
  const { addArea } = useMaintenanceStore();

  const handleSave = async (data: any) => {
    await addArea(data);
    toast.success("Área creada correctamente");
    navigate("/maintenance/areas/create");
  };

  const handleNew = () => {
    navigate("/maintenance/areas/create");
  };

  return <AreaForm mode="create" onSave={handleSave} onNew={handleNew} />;
}

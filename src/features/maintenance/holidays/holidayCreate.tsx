import { useNavigate } from "react-router";
import { toast } from "sonner";
import HolidayForm from "@/components/maintenance/HolidayForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Holiday } from "@/types/maintenance";

export default function HolidayCreate() {
  const navigate = useNavigate();
  const { addHoliday } = useMaintenanceStore();

  const handleSave = async (data: Holiday) => {
    await addHoliday(data);
    toast.success("Feriado creado correctamente");
  };

  const handleNew = () => {
    navigate("/maintenance/holidays/create");
  };

  return (
    <HolidayForm mode="create" onSave={handleSave} onNew={handleNew} />
  );
}

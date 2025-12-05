import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";

import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Computer } from "@/types/maintenance";
import ComputerForm from "@/components/maintenance/ComputerForm";

export default function ComputerEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { computers, fetchComputers, updateComputer, deleteComputer } =
    useMaintenanceStore();

  const [initialData, setInitialData] = useState<Partial<Computer> | undefined>(
    undefined
  );

  // Cargar computadoras si no hay
  useEffect(() => {
    if (computers.length === 0) fetchComputers();
  }, [computers, fetchComputers]);

  // Seleccionar computadora a editar cuando computers esté cargado
  useEffect(() => {
    if (computers.length === 0) return;
    const comp = computers.find((c) => c.id === Number(id));
    if (comp) setInitialData(comp);
  }, [computers, id]);

  if (!initialData) return <div>Cargando computadora...</div>;

  const handleSave = (data: Omit<Computer, "id">) => {
    updateComputer(Number(id), data);
    toast.success("Computadora actualizada correctamente");
    navigate("/maintenance/computers");
  };

  const handleDelete = () => {
    deleteComputer(Number(id));
    toast.success("Computadora eliminada correctamente");
    navigate("/maintenance/computers");
  };

  const handleNew = () => navigate("/maintenance/computers/create");

  return (
    <ComputerForm
      mode="edit"
      initialData={initialData}
      onSave={handleSave}
      onNew={handleNew}
      onDelete={handleDelete}
    />
  );
}

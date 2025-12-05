import React, { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Computer } from "@/types/maintenance";
import ComputerForm from "@/components/maintenance/ComputerForm";

const ComputerCreate = () => {
  const { addComputer } = useMaintenanceStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<Omit<Computer, "id">>({
    brand: "",
    model: "",
    serialNumber: "",
    areaId: 0,
  });

  const handleSave = (data: Omit<Computer, "id">) => {
    addComputer(data);
    toast.success("Computadora creada correctamente");
    navigate("/maintenance/categories");
  };

  const handleNew = () => {
    setForm({
      brand: "",
      model: "",
      serialNumber: "",
      areaId: 0,
    });
  };

  return (
    <ComputerForm
      mode="create"
      initialData={form}
      onSave={handleSave}
      onNew={handleNew}
    />
  );
};

export default ComputerCreate;

import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import type { Category } from "@/types/maintenance";
import CategoriaForm from "@/components/maintenance/CategoriaForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

export default function CategoryCreate() {
  const navigate = useNavigate();
  const { addCategory } = useMaintenanceStore();

  const [form, setForm] = useState<Omit<Category, "id">>({
    nombreSublinea: "",
    codigoSunat: "",
  });

  const handleSave = async (data: Omit<Category, "id">) => {
    await addCategory(data);
    toast.success("Categoría creada correctamente");
    setForm({
      nombreSublinea: "",
      codigoSunat: "",
    });
  };

  const handleNew = () => {
    setForm({
      nombreSublinea: "",
      codigoSunat: "",
    });
  };

  return (
    <CategoriaForm
      mode="create"
      initialData={form}
      onSave={handleSave}
      onNew={handleNew}
    />
  );
}

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
    category: "",
    sunatCode: "",
  });

  const handleSave = () => {
    addCategory(form);
    toast.success("Categoría creada correctamente");
    navigate("/maintenance/categories");
  };

  const handleNew = () => {
    setForm({
      category: "",
      sunatCode: "",
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

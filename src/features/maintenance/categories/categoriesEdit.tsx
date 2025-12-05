import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Category } from "@/types/maintenance";
import CategoriaForm from "@/components/maintenance/CategoriaForm";

export default function CategoryEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    categories,
    updateCategory,
    deleteCategory,
    addCategory,
    fetchCategories,
  } = useMaintenanceStore();

  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories(); // por si no está cargado
  }, []);

  useEffect(() => {
    if (categories.length > 0 && id) {
      const found = categories.find((c) => String(c.id) === id);
      if (found) setCategory(found);
    }
  }, [categories, id]);

  const handleSave = (data: Category) => {
    if (!id) return;

    updateCategory(Number(id), data);
    toast.success("Categoría actualizada");
    navigate("/categories");
  };

  const handleNew = () => {
    setCategory({
      id: "",
      categoria: "",
      codigoSunat: "",
    });
    navigate("/categories/create");
  };

  const handleDelete = () => {
    if (!id) return;

    deleteCategory(Number(id));
    toast.success("Categoría eliminada");
    navigate("/categories");
  };

  if (!category) {
    return <p className="p-6">Cargando categoría...</p>;
  }

  return (
    <CategoriaForm
      mode="edit"
      initialData={category}
      onSave={handleSave}
      onNew={handleNew}
      onDelete={handleDelete}
    />
  );
}

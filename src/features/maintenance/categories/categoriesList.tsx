import { createColumnHelper } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router";
import DataTable from "@/components/DataTable";
import { useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

const CategoryList = () => {
  const navigate = useNavigate();

  const { categories, fetchCategories, deleteCategory } = useMaintenanceStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  const columnHelper = createColumnHelper();

  const categoryColumns = [
    columnHelper.accessor("category", {
      header: "Categoría",
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor("sunatCode", {
      header: "Código SUNAT",
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor("id", {
      header: "Acciones",
      cell: (info) => {
        const id = info.getValue();

        return (
          <div className="flex gap-2">
            <Link
              to={`/maintenance/categories/${id}/edit`}
              className="text-blue-600 hover:underline"
            >
              <Pencil color="green" />
            </Link>

            <button
              onClick={() => {
                if (confirm("¿Seguro deseas eliminar esta categoría?")) {
                  deleteCategory(id);
                  toast.success("Categoría eliminada.");
                }
              }}
              className="text-red-600 hover:text-red-800 cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        );
      },
    }),
  ];

  return (
    <div>
      <div className="w-full h-16 flex mb-5">
        <button
          className="bg-slate-600 text-white px-4 py-2 rounded cursor-pointer"
          onClick={() => navigate(`/maintenance/categories/create`)}
        >
          Añadir categoría
        </button>
      </div>

      <DataTable data={categories} columns={categoryColumns} />
    </div>
  );
};

export default CategoryList;

import { createColumnHelper } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router";
import DataTable from "@/components/DataTable";

import { useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

const AreaList = () => {
  const navigate = useNavigate();

  const { areas, fetchAreas, deleteArea } = useMaintenanceStore();

  useEffect(() => {
    fetchAreas();
  }, []);

  const columnHelper = createColumnHelper();
  const areaColumns = [
    columnHelper.accessor("area", {
      header: "Área",
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor("id", {
      header: "Acciones",
      cell: (info) => {
        const id = info.getValue();
        return (
          <div className="flex gap-3">
            <Link
              to={`/maintenance/areas/${id}/edit`}
              className="text-blue-600 hover:underline"
            >
              <Pencil color="green" />
            </Link>

            <button
              onClick={() => {
                if (confirm("¿Seguro deseas eliminar esta área?")) {
                  deleteArea(id);
                  toast.success("Área eliminada.");
                }
              }}
            >
              <Trash2 className="w-5 h-5 text-red-600 hover:text-red-800" />
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
          onClick={() => navigate(`/maintenance/areas/create`)}
        >
          Añadir área
        </button>
      </div>

      <DataTable data={areas} columns={areaColumns} />
    </div>
  );
};

export default AreaList;

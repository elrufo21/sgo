import { createColumnHelper } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router";
import DataTable from "../../../components/DataTable";
import { useProductsStore } from "@/store/products/products.store";
import { useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Computer } from "@/types/maintenance";

interface Product {
  id: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  preVenta: number;
}

const ComputerList = () => {
  const navigate = useNavigate();
  const { computers, fetchComputers, deleteComputer } = useMaintenanceStore();

  useEffect(() => {
    fetchComputers();
  }, []);

  const columnHelper = createColumnHelper<Computer>();

  const computerColumns = [
    columnHelper.accessor("brand", {
      header: "Marca",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("model", {
      header: "Modelo",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("serialNumber", {
      header: "N° de Serie",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor((row) => row.area?.area || "-", {
      id: "area",
      header: "Área",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("id", {
      header: "Acciones",
      cell: (info) => {
        const id = info.getValue();
        return (
          <div className="flex gap-2">
            <Link to={`${id}/edit`}>
              <Pencil className="w-5 h-5 text-green-600 hover:text-green-700" />
            </Link>
            <button
              onClick={() => {
                if (confirm("¿Estás seguro de eliminar esta computadora?")) {
                  deleteComputer(id);
                  toast.success("Computadora eliminada correctamente.");
                }
              }}
              className="text-red-600 hover:text-red-800"
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
          onClick={() => navigate(`/create`)}
        >
          Añadir producto
        </button>
      </div>

      <DataTable data={computers} columns={computerColumns} />
    </div>
  );
};

export default ComputerList;

import { createColumnHelper } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router";
import DataTable from "@/components/DataTable";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Computer, Area } from "@/types/maintenance";

const ComputerList = () => {
  const navigate = useNavigate();
  const { computers, areas, fetchComputers, fetchAreas, deleteComputer } =
    useMaintenanceStore();

  useEffect(() => {
    fetchComputers();
    fetchAreas(); // para tener el listado de áreas
  }, []);

  const columnHelper = createColumnHelper<Computer>();

  const computerColumns = [
    columnHelper.accessor("maquina", {
      header: "Máquina",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("registro", {
      header: "Registro",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("serieFactura", {
      header: "Serie Factura",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("serieNc", {
      header: "Serie NC",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("serieBoleta", {
      header: "Serie Boleta",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("ticketera", {
      header: "Ticketera",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor(
      (row) => {
        const area = areas.find((a: Area) => a.id === row.areaId);
        return area?.area || "-";
      },
      {
        id: "area",
        header: "Área",
        cell: (info) => info.getValue(),
      }
    ),
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
          onClick={() => navigate(`create`)}
        >
          Añadir computadora
        </button>
      </div>

      <DataTable data={computers} columns={computerColumns} />
    </div>
  );
};

export default ComputerList;

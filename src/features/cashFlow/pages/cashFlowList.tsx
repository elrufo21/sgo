import DataTable from "@/components/DataTable";
import { useCashFlowStore } from "@/store/cashFlow/cashFlow.store";
import type { CashFlow } from "@/types/cashFlow";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

const CashFlowList = () => {
  const { flows, fetchFlows, deleteFlow, loading } = useCashFlowStore();
  const navigate = useNavigate();
  const columnHelper = createColumnHelper<CashFlow>();

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  // Función para calcular totales de cada flujo
  const calcularTotales = (flow: CashFlow) => {
    const totalEfectivo = flow.conteoMonedas.reduce(
      (sum, item) => sum + item.cantidad * item.denominacion,
      0
    );
    const totalIngresos = flow.ingresos.reduce(
      (sum, item) => sum + item.importe,
      0
    );
    const totalGastos = flow.gastos.reduce(
      (sum, item) => sum + item.importe,
      0
    );
    const efectivoCaja = totalEfectivo + totalIngresos - totalGastos;
    const ventasTotal =
      flow.ventaTotal.efectivo +
      flow.ventaTotal.tarjeta +
      flow.ventaTotal.deposito;
    const total = ventasTotal - totalGastos;

    return { totalEfectivo, efectivoCaja, ventasTotal, total };
  };

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("caja", {
      header: "Caja",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("encargado", {
      header: "Encargado",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("sencillo", {
      header: "Sencillo",
      cell: (info) => `S/ ${info.getValue().toFixed(2)}`,
    }),
    columnHelper.accessor("estado", {
      header: "Estado",
      cell: (info) => {
        const estado = info.getValue();
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              estado === "ABIERTA"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {estado}
          </span>
        );
      },
    }),
    columnHelper.accessor("fechaApertura", {
      header: "Fecha Apertura",
      cell: (info) =>
        new Date(info.getValue()).toLocaleString("es-PE", {
          dateStyle: "short",
          timeStyle: "short",
        }),
    }),
    columnHelper.accessor("fechaCierre", {
      header: "Fecha Cierre",
      cell: (info) =>
        info.getValue()
          ? new Date(info.getValue()!).toLocaleString("es-PE", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "-",
    }),
    columnHelper.display({
      id: "efectivoCaja",
      header: "Efectivo en Caja",
      cell: ({ row }) => {
        const { efectivoCaja } = calcularTotales(row.original);
        return (
          <span className="font-medium text-gray-700">
            S/ {efectivoCaja.toFixed(2)}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "ventasTotal",
      header: "Ventas Total",
      cell: ({ row }) => {
        const { ventasTotal } = calcularTotales(row.original);
        return (
          <span className="font-medium text-blue-700">
            S/ {ventasTotal.toFixed(2)}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "total",
      header: "Total",
      cell: ({ row }) => {
        const { total } = calcularTotales(row.original);
        return (
          <span className="font-bold text-slate-800">
            S/ {total.toFixed(2)}
          </span>
        );
      },
    }),
    columnHelper.accessor("id", {
      id: "actions",
      header: "Acciones",
      cell: (info) => {
        const id = info.getValue();
        return (
          <div className="flex gap-2">
            <Link
              to={`/cash_flow_control/${id}/edit`}
              className="text-green-600 hover:text-green-800 transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    "¿Estás seguro de eliminar este flujo de caja?"
                  )
                ) {
                  deleteFlow(id);
                  toast.success("Flujo de caja eliminado correctamente");
                }
              }}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    }),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 text-lg">Cargando flujos de caja...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold text-gray-800">
          Control de Flujo de Caja
        </h1>
        <button
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded transition-colors shadow-sm"
          onClick={() => navigate("/cash_flow_control/create")}
        >
          + Añadir Flujo de Caja
        </button>
      </div>

      {flows.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">
            No hay flujos de caja registrados
          </p>
          <button
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded transition-colors"
            onClick={() => navigate("/cash_flow_control/create")}
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <DataTable columns={columns} data={flows} />
      )}
    </div>
  );
};

export default CashFlowList;

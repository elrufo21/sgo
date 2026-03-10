import DataTable from "@/components/DataTable";
import { BackArrowButton } from "@/components/common/BackArrowButton";
import { useOrderNoteStore } from "@/store/orderNote/orderNote.store";
import type { OrderNote } from "@/types/orderNote";
import { createColumnHelper } from "@tanstack/react-table";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";

const columnHelper = createColumnHelper<OrderNote>();

const OrderNotesList = () => {
  const navigate = useNavigate();
  const { notes, fetchNotes } = useOrderNoteStore();

  useEffect(() => {
    void fetchNotes({ page: 1, pageSize: 50 });
  }, [fetchNotes]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "ver",
        header: "Ver",
        cell: ({ row }) => {
          const noteId = row.original.notaId;
          return (
            <button
              type="button"
              className="text-sm font-medium text-blue-600 hover:underline"
              onClick={() => navigate(`/sales/order_notes/${noteId}/view`)}
            >
              Ver
            </button>
          );
        },
      }),
      columnHelper.accessor("notaId", {
        header: "ID Nota",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("documento", {
        header: "Documento",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("fecha", {
        header: "Fecha",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("cliente", {
        header: "Cliente",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("formaPago", {
        header: "Forma Pago",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("total", {
        header: "Total",
        cell: (info) => info.getValue(),
        meta: { tdClassName: "text-right" },
      }),
      columnHelper.accessor("acuenta", {
        header: "A cuenta",
        cell: (info) => info.getValue(),
        meta: { tdClassName: "text-right" },
      }),
      columnHelper.accessor("saldo", {
        header: "Saldo",
        cell: (info) => info.getValue(),
        meta: { tdClassName: "text-right" },
      }),
      columnHelper.accessor("usuario", {
        header: "Usuario",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        cell: (info) => {
          const value = info.getValue();
          const normalized = String(value).toUpperCase();
          const stateClass =
            normalized === "PENDIENTE"
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-emerald-100 text-emerald-700 border-emerald-200";
          return (
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${stateClass}`}
            >
              {value}
            </span>
          );
        },
      }),
    ],
    [navigate],
  );

  return (
    <div className="p-4">
      <div className="mb-3">
        <h1 className="text-2xl font-semibold text-[#0f2748]">Nota Pedidos</h1>
      </div>

      <DataTable
        columns={columns}
        data={notes}
        filterKeys={["notaId", "cliente", "estado", "fecha", "documento"]}
        toolbarLeading={
          <BackArrowButton className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors" />
        }
      />
    </div>
  );
};

export default OrderNotesList;

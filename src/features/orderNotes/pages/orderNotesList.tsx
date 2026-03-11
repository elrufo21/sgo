import DataTable from "@/components/DataTable";
import { BackArrowButton } from "@/components/common/BackArrowButton";
import { toast } from "@/shared/ui/toast";
import { useOrderNoteStore } from "@/store/orderNote/orderNote.store";
import type { OrderNote } from "@/types/orderNote";
import { createColumnHelper } from "@tanstack/react-table";
import { FileSpreadsheet, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

const columnHelper = createColumnHelper<OrderNote>();

const OrderNotesList = () => {
  const navigate = useNavigate();
  const { notes, fetchNotes, loading } = useOrderNoteStore();
  const initialDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [fechaInicio, setFechaInicio] = useState(initialDate);
  const [fechaFin, setFechaFin] = useState(initialDate);

  useEffect(() => {
    void fetchNotes({ fechaInicio: initialDate, fechaFin: initialDate });
  }, [fetchNotes, initialDate]);

  const handleSearch = useCallback(() => {
    const from = String(fechaInicio ?? "").trim();
    const to = String(fechaFin ?? "").trim();

    if (!from || !to) {
      toast.error("Debes seleccionar fecha inicio y fecha fin.");
      return;
    }

    if (from > to) {
      toast.error("La fecha inicio no puede ser mayor que la fecha fin.");
      return;
    }

    void fetchNotes({ fechaInicio: from, fechaFin: to });
  }, [fechaInicio, fechaFin, fetchNotes]);

  const handleExportExcel = useCallback(() => {
    if (!notes.length) {
      toast.info("No hay datos para exportar.");
      return;
    }

    const headers = [
      "ID Nota",
      "Documento",
      "Fecha",
      "Cliente",
      "Forma Pago",
      "Total",
      "A cuenta",
      "Saldo",
      "Usuario",
      "Estado",
    ];

    const escapeCsvValue = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = notes.map((note) =>
      [
        note.notaId,
        note.documento,
        note.fecha,
        note.cliente,
        note.formaPago,
        note.total,
        note.acuenta,
        note.saldo,
        note.usuario,
        note.estado,
      ]
        .map(escapeCsvValue)
        .join(","),
    );

    const csv = `\uFEFF${[headers.map(escapeCsvValue).join(","), ...rows].join("\n")}`;
    const fileFrom = fechaInicio || "sin-inicio";
    const fileTo = fechaFin || "sin-fin";
    const fileName = `notas-pedido_${fileFrom}_${fileTo}.csv`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }, [fechaFin, fechaInicio, notes]);

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
        isLoading={loading}
        filterKeys={["notaId", "cliente", "estado", "fecha", "documento"]}
        toolbarLeading={
          <BackArrowButton className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors" />
        }
        toolbarAction={
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <label className="flex min-w-[160px] flex-col gap-1 text-xs text-slate-600">
              Fecha Inicio
              <input
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#B23636] focus:ring-2 focus:ring-[#B23636]/20"
              />
            </label>

            <label className="flex min-w-[160px] flex-col gap-1 text-xs text-slate-600">
              Fecha Fin
              <input
                type="date"
                value={fechaFin}
                onChange={(event) => setFechaFin(event.target.value)}
                className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#B23636] focus:ring-2 focus:ring-[#B23636]/20"
              />
            </label>

            <div className="relative group">
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-white transition-colors hover:bg-slate-700"
                aria-label="Buscar"
              >
                <Search className="h-4 w-4" />
              </button>
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
                Buscar
              </span>
            </div>

            <div className="relative group">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-700"
                aria-label="Exportar a Excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
              </button>
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
                Excel
              </span>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default OrderNotesList;

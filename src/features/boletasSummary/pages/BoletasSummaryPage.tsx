import DataTable from "@/components/DataTable";
import { BackArrowButton } from "@/components/common/BackArrowButton";
import { toast } from "@/shared/ui/toast";
import { useBoletasSummaryStore } from "@/store/boletasSummary/boletasSummary.store";
import type { BoletaSummaryDocument } from "@/types/boletasSummary";
import { createColumnHelper } from "@tanstack/react-table";
import {
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  SendHorizonal,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  buildBoletasCsv,
  calculateBoletaTotals,
} from "../boletasSummary.utils";

const columnHelper = createColumnHelper<BoletaSummaryDocument>();

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function BoletasSummaryPage() {
  const navigate = useNavigate();
  const { documents, fetchDocuments, loading } = useBoletasSummaryStore();
  const [filterBy, setFilterBy] = useState<
    "cliente" | "clienteDni" | "serieNumero" | "notaId" | "fechaEmision"
  >("cliente");
  const [filteredRows, setFilteredRows] = useState<BoletaSummaryDocument[]>([]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    setFilteredRows(documents);
  }, [documents]);

  const totals = useMemo(
    () => calculateBoletaTotals(filteredRows),
    [filteredRows],
  );
  const referenceDate = useMemo(
    () => documents[0]?.fechaEmision ?? "-",
    [documents],
  );

  const handleRefresh = useCallback(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const handleSendSummary = useCallback(() => {
    if (!filteredRows.length) {
      toast.info("No hay boletas pendientes para enviar.");
      return;
    }

    toast.info("Proceso de envío de resumen pendiente de integración.");
  }, [filteredRows.length]);

  const handleExportCsv = useCallback(() => {
    if (!filteredRows.length) {
      toast.info("No hay boletas para exportar.");
      return;
    }

    const csv = buildBoletasCsv(filteredRows);
    const fileDate =
      referenceDate !== "-" ? referenceDate.replaceAll("/", "-") : "sin-fecha";
    const fileName = `resumen-boletas_${fileDate}.csv`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }, [filteredRows, referenceDate]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "ver",
        header: "Ver",
        cell: ({ row }) => {
          const notaId = Number(row.original.notaId ?? 0);
          const canView = Number.isFinite(notaId) && notaId > 0;

          return (
            <button
              type="button"
              className={`text-sm font-medium ${
                canView
                  ? "text-blue-600 hover:underline"
                  : "text-slate-400 cursor-not-allowed"
              }`}
              disabled={!canView}
              onClick={() =>
                canView && navigate(`/sales/order_notes/${notaId}/view`)
              }
            >
              Ver
            </button>
          );
        },
      }),
      columnHelper.accessor("docuId", {
        header: "DocuId",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("notaId", {
        header: "NotaId",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("fechaEmision", {
        header: "FechaEmision",
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: "numero",
        header: "Numero",
        cell: ({ row }) => row.original.serieNumero,
      }),
      columnHelper.accessor("cliente", {
        header: "RazonSocial",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("clienteDni", {
        header: "DNI",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("subTotal", {
        header: "Sub Total",
        cell: (info) => info.getValue(),
        meta: { tdClassName: "text-right" },
      }),
      columnHelper.accessor("igv", {
        header: "IGV",
        cell: (info) => info.getValue(),
        meta: { tdClassName: "text-right" },
      }),

      columnHelper.accessor("total", {
        header: "Total",
        cell: (info) => info.getValue(),
        meta: { tdClassName: "text-right" },
      }),
      columnHelper.accessor("estadoSunat", {
        header: "Estado Sunat",
        cell: (info) => {
          const value = String(info.getValue() ?? "").toUpperCase();
          const isPending = value === "PENDIENTE";
          const stateClass = isPending
            ? "bg-amber-100 text-amber-700 border-amber-200"
            : "bg-emerald-100 text-emerald-700 border-emerald-200";

          return (
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${stateClass}`}
            >
              {value || "-"}
            </span>
          );
        },
      }),
    ],
    [navigate],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BackArrowButton />
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              Resumen de boletas
            </h1>
            <p className="text-sm text-slate-500">
              Basado en documentos pendientes de tipo 03 (BOLETA).
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          Fecha de referencia:{" "}
          <span className="font-semibold">{referenceDate}</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center gap-3 py-12 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando boletas...</span>
          </div>
        </div>
      ) : (
        <DataTable
          data={documents}
          columns={columns}
          filterKeys={[filterBy]}
          searchPlaceholder="Buscar..."
          onFilteredDataChange={setFilteredRows}
          toolbarLeading={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                Enviar Boletas:
              </span>
              <select
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none"
                value="PENDIENTES"
                disabled
              >
                <option value="PENDIENTES">PENDIENTES</option>
              </select>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#B23636]/25 bg-[#B23636]/10 px-3 text-sm font-medium text-[#B23636] hover:bg-[#B23636]/15"
                onClick={handleSendSummary}
              >
                <SendHorizonal className="h-4 w-4" />
                Enviar Resumen
              </button>
            </div>
          }
          renderFilters={
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700">Filtrar por:</span>
              <select
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none"
                value={filterBy}
                onChange={(event) =>
                  setFilterBy(
                    event.target.value as
                      | "cliente"
                      | "clienteDni"
                      | "serieNumero"
                      | "notaId"
                      | "fechaEmision",
                  )
                }
              >
                <option value="cliente">RazonSocial</option>
                <option value="clienteDni">DNI</option>
                <option value="serieNumero">Numero</option>
                <option value="notaId">NotaId</option>
                <option value="fechaEmision">FechaEmision</option>
              </select>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {totals.count} registros
              </span>
            </div>
          }
          toolbarAction={
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                onClick={handleExportCsv}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
          }
          footerContent={
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-6 justify-end w-full">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Cant.</p>
                <p className="text-lg font-semibold text-slate-800">
                  {totals.count}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">SubTotal S/</p>
                <p className="text-lg font-semibold text-slate-800">
                  {formatCurrency(totals.subTotal)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">IGV S/</p>
                <p className="text-lg font-semibold text-slate-800">
                  {formatCurrency(totals.igv)}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Ticket Promedio S/</p>
                <p className="text-lg font-semibold text-slate-800">
                  {formatCurrency(totals.average)}
                </p>
              </div>
              <div className="rounded-lg border border-[#B23636]/25 bg-[#B23636]/10 px-3 py-2">
                <p className="text-xs text-[#B23636]/80">Total S/</p>
                <p className="text-lg font-semibold text-[#B23636]">
                  {formatCurrency(totals.total)}
                </p>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}

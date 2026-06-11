import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, FilePlus2, RefreshCw } from "lucide-react";
import DataTable from "@/components/DataTable";
import { BackArrowButton } from "@/components/common/BackArrowButton";
import { toast } from "@/shared/ui/toast";
import { useServiceInvoicesStore } from "@/store/serviceInvoices/serviceInvoices.store";
import type { ServiceInvoiceListItem } from "@/types/serviceInvoice";

const columnHelper = createColumnHelper<ServiceInvoiceListItem>();

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

const normalizeInvoiceEstado = (estado?: string) =>
  String(estado ?? "")
    .trim()
    .toUpperCase();

const isAnnulledInvoice = (row: ServiceInvoiceListItem) =>
  normalizeInvoiceEstado(row.compra.estado) === "ANULADO";

const annulledRowClassName =
  "bg-red-50 text-red-800 border-red-200 hover:bg-red-100/80";

export default function ServiceInvoiceList() {
  const { invoices, loading, error, fetchInvoices } = useServiceInvoicesStore();
  const [estado, setEstado] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [pageSize, setPageSize] = useState(50);

  const load = useCallback(() => {
    if ((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) {
      toast.error("Para filtrar por fecha completa Desde y Hasta.");
      return;
    }

    void fetchInvoices({
      estado,
      fechaInicio,
      fechaFin,
      page: 1,
      pageSize,
    });
  }, [estado, fechaFin, fechaInicio, fetchInvoices, pageSize]);

  useEffect(() => {
    void fetchInvoices({ page: 1, pageSize: 50 });
  }, [fetchInvoices]);

  const columns = useMemo<ColumnDef<ServiceInvoiceListItem, unknown>[]>(
    () =>
      [
        columnHelper.accessor((row) => row.compra.compraId, {
          id: "id",
          header: "ID",
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor(
          (row) =>
            row.compra.nroComprobante ||
            `${row.compra.serie}-${row.compra.numero}`,
          {
            id: "comprobante",
            header: "Comprobante",
            cell: (info) => info.getValue(),
          },
        ),
        columnHelper.accessor((row) => row.compra.fechaEmision, {
          id: "fecha",
          header: "Fecha",
          cell: (info) => info.getValue() || "-",
        }),
        columnHelper.accessor((row) => row.compra.compraConcepto, {
          id: "concepto",
          header: "Concepto",
          cell: (info) => info.getValue() || "SERVICIO",
        }),
        columnHelper.accessor((row) => row.compra.clienteRazon, {
          id: "cliente",
          header: "Cliente",
          cell: (info) => info.getValue() || "-",
        }),
        columnHelper.display({
          id: "estado",
          header: "Estado",
          cell: ({ row }) => {
            const estado = normalizeInvoiceEstado(row.original.compra.estado);
            if (!estado) return "-";

            const isAnnulled = estado === "ANULADO";
            const badgeClass = isAnnulled
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-emerald-100 text-emerald-700 border-emerald-200";

            return (
              <span
                className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${badgeClass}`}
              >
                {estado}
              </span>
            );
          },
        }),
        columnHelper.accessor((row) => row.compra.estadoSunat ?? "", {
          id: "estadoSunat",
          header: "SUNAT",
          cell: (info) => info.getValue() || "-",
        }),
        columnHelper.accessor((row) => row.compra.total, {
          id: "total",
          header: "Total",
          cell: (info) => formatMoney(info.getValue()),
          meta: { align: "right" },
        }),
        columnHelper.accessor((row) => row.compra.saldo ?? 0, {
          id: "saldo",
          header: "Saldo",
          cell: (info) => formatMoney(info.getValue()),
          meta: { align: "right" },
        }),
        columnHelper.display({
          id: "acciones",
          header: "",
          cell: ({ row }) => (
            <Link
              to={`/service-invoices/${row.original.compra.compraId}`}
              title="Ver factura"
              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              aria-label="Ver factura"
            >
              <Eye className="h-4 w-4" />
            </Link>
          ),
          meta: { align: "right" },
        }),
      ] as ColumnDef<ServiceInvoiceListItem, unknown>[],
    [],
  );

  return (
    <div className="space-y-4 p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackArrowButton fallbackTo="/shopping" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Facturas de servicio
            </h1>
            <p className="text-sm text-slate-500">
              Facturas de servicio enviadas al OSE
            </p>
          </div>
        </div>
      </div>

      <DataTable
        data={invoices}
        columns={columns}
        isLoading={loading}
        filterKeys={[]}
        searchPlaceholder="Buscar comprobante o servicio..."
        emptyMessage="No hay facturas de servicio."
        initialPageSize={pageSize}
        rowClassName={(row) =>
          isAnnulledInvoice(row) ? annulledRowClassName : undefined
        }
        tdClassName={(cell) =>
          isAnnulledInvoice(cell.row.original) ? "text-red-800" : undefined
        }
        toolbarLeading={undefined}
        toolbarAction={
          <Link
            to="/service-invoices/create"
            title="Nueva factura"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#B23636] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#96312a]"
          >
            <FilePlus2 className="h-5 w-5" />
            Nueva
          </Link>
        }
        footerContent={
          error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null
        }
        renderFilters={
          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              <span>Estado</span>
              <select
                value={estado}
                onChange={(event) => setEstado(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-[#B23636] focus:ring-2 focus:ring-[#B23636]/20"
              >
                <option value="">Todos</option>
                <option value="EMITIDO">Emitido</option>
                <option value="ANULADO">Anulado</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              <span>Desde</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-[#B23636] focus:ring-2 focus:ring-[#B23636]/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              <span>Hasta</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(event) => setFechaFin(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-[#B23636] focus:ring-2 focus:ring-[#B23636]/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              <span>Filas</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-10 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-[#B23636] focus:ring-2 focus:ring-[#B23636]/20"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>

            <button
              type="button"
              onClick={load}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Buscar
            </button>
          </div>
        }
      />
    </div>
  );
}

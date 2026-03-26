import DataTable from "@/components/DataTable";
import { BackArrowButton } from "@/components/common/BackArrowButton";
import { toast } from "@/shared/ui/toast";
import { useBoletasSummaryStore } from "@/store/boletasSummary/boletasSummary.store";
import type { BoletaSummaryDocument } from "@/types/boletasSummary";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import {
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  SendHorizonal,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildBoletasCsv,
  calculateBoletaTotals,
  parseAmount,
} from "../boletasSummary.utils";

const columnHelper = createColumnHelper<BoletaSummaryDocument>();

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const safeTrim = (value: unknown) => String(value ?? "").trim();

const pad2 = (value: number) => String(value).padStart(2, "0");

const toLocalIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const toDateOnly = (value: string) => {
  const raw = safeTrim(value);
  if (!raw) return "";
  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, dd, mm, yyyy] = slashMatch;
    return `${yyyy}-${mm}-${dd}`;
  }
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return raw;
  return "";
};

const compactSerie = (serie: string) => {
  const compact = serie.replace(/0/g, "");
  return compact || serie;
};

const normalizeSerieNumero = (value: string) => {
  const raw = safeTrim(value);
  if (!raw) return raw;
  const [serieRaw = "", numeroRaw = ""] = raw.split("-");
  const serie = compactSerie(safeTrim(serieRaw));
  const numero = String(Number(safeTrim(numeroRaw))).replace(/^NaN$/, "");
  if (!serie && !numero) return raw;
  if (!numero) return serie || raw;
  return `${serie || serieRaw}-${numero}`;
};

export default function BoletasSummaryPage() {
  const {
    documents,
    fetchDocuments,
    loading,
    sequenceLoading,
    fetchNextSummarySequence,
  } = useBoletasSummaryStore();
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

  const handleSendSummary = useCallback(async () => {
    if (!filteredRows.length) {
      toast.info("No hay boletas pendientes para enviar.");
      return;
    }

    const nextSequence = await fetchNextSummarySequence();
    if (!nextSequence) {
      toast.error("No se pudo obtener la secuencia del resumen.");
      return;
    }

    let parsedSession: any = null;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("sgo.auth.session");
        parsedSession = raw ? JSON.parse(raw) : null;
      } catch {
        parsedSession = null;
      }
    }

    const user = parsedSession?.user ?? {};
    const loginPayload = parsedSession?.loginPayload ?? {};
    const companyId = Number(
      user.companyId ??
        parsedSession?.companiaId ??
        loginPayload.companiaId ??
        (typeof window !== "undefined"
          ? window.localStorage.getItem("companiaId")
          : 1) ??
        1,
    );
    const now = new Date();
    const todayIso = toLocalIsoDate(now);
    const serieResumen = todayIso.replaceAll("-", "");
    const referenceDateIso =
      toDateOnly(referenceDate) ||
      toDateOnly(filteredRows[0]?.fechaEmision ?? "") ||
      todayIso;

    const firstSerieNumero = safeTrim(filteredRows[0]?.serieNumero);
    const lastSerieNumero = safeTrim(
      filteredRows[filteredRows.length - 1]?.serieNumero,
    );
    const rangoNumeros =
      firstSerieNumero && lastSerieNumero
        ? `${normalizeSerieNumero(firstSerieNumero)} al ${normalizeSerieNumero(lastSerieNumero)}`
        : "";

    const detalle = filteredRows.map((row, index) => {
      const dni = safeTrim(row.clienteDni);
      return {
        item: index + 1,
        tipoComprobante: "03",
        nroComprobante: safeTrim(row.serieNumero),
        tipoDocumento: "1",
        nroDocumento: dni || "00000000",
        tipoComprobanteRef: "",
        nroComprobanteRef: "",
        statu: "1",
        codMoneda: "PEN",
        total: Number(parseAmount(row.total).toFixed(2)),
        icbper: Number(parseAmount(row.icbper).toFixed(2)),
        gravada: Number(parseAmount(row.subTotal).toFixed(2)),
        isc: 0,
        igv: Number(parseAmount(row.igv).toFixed(2)),
        otros: 0,
        cargoXAsignacion: 1,
        montoCargoXAsig: 0,
        exonerado: 0,
        inafecto: 0,
        exportacion: 0,
        gratuitas: 0,
        docuId: row.docuId,
        notaId: row.notaId,
      };
    });

    const payloadResumen = {
      NRO_DOCUMENTO_EMPRESA: safeTrim(
        user.companyRuc ?? parsedSession?.companiaRuc ?? loginPayload.companiaRuc,
      ),
      RAZON_SOCIAL: safeTrim(
        user.companyName ?? parsedSession?.razonSocial ?? loginPayload.razonSocial,
      ),
      TIPO_DOCUMENTO: "6",
      CODIGO: "RC",
      SERIE: serieResumen,
      SECUENCIA: String(nextSequence),
      FECHA_REFERENCIA: referenceDateIso,
      FECHA_DOCUMENTO: todayIso,
      TIPO_PROCESO: safeTrim(user.entorno ?? loginPayload.entorno ?? "3"),
      CONTRA_FIRMA: safeTrim(
        user.claveCertificado ?? loginPayload.claveCertificado,
      ),
      USUARIO_SOL_EMPRESA: safeTrim(user.usuarioSol ?? loginPayload.usuarioSol),
      PASS_SOL_EMPRESA: safeTrim(user.claveSol ?? loginPayload.claveSol),
      RUTA_PFX: safeTrim(
        user.certificadoBase64 ?? loginPayload.certificadoBase64,
      ),
      COMPANIA_ID: Number.isFinite(companyId) && companyId > 0 ? companyId : 1,
      RANGO_NUMEROS: rangoNumeros,
      SUBTOTAL: Number(totals.subTotal.toFixed(2)),
      IGV: Number(totals.igv.toFixed(2)),
      ICBPER: Number(totals.icbper.toFixed(2)),
      TOTAL: Number(totals.total.toFixed(2)),
      detalle,
    };

    console.log("Resumen de boletas payload (objeto):", payloadResumen);
    console.log(
      "Resumen de boletas payload (json):",
      JSON.stringify(payloadResumen, null, 2),
    );
    toast.success(`Secuencia de resumen obtenida: ${nextSequence}`);
    toast.info("Payload armado e impreso en consola.");
  }, [
    fetchNextSummarySequence,
    filteredRows,
    referenceDate,
    totals.icbper,
    totals.igv,
    totals.subTotal,
    totals.total,
  ]);

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

  const columns = useMemo<ColumnDef<BoletaSummaryDocument, unknown>[]>(
    () => [
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
      columnHelper.accessor("usuario", {
        header: "Usuario",
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
    [],
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
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
        <div className="text-xs text-slate-600 sm:text-sm">
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
          filterKeys={[
            "notaId",
            "serieNumero",
            "cliente",
            "clienteDni",
            "usuario",
          ]}
          searchPlaceholder="Buscar..."
          onFilteredDataChange={setFilteredRows}
          toolbarAction={
            <div className="w-full lg:w-auto">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-sm font-medium text-slate-700">
                  Enviar Boletas:
                </span>
                <select
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none sm:w-auto sm:min-w-[160px]"
                  value="PENDIENTES"
                  disabled
                >
                  <option value="PENDIENTES">PENDIENTES</option>
                </select>
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#B23636]/25 bg-[#B23636]/10 px-3 text-sm font-medium text-[#B23636] hover:bg-[#B23636]/15 sm:w-auto"
                  onClick={handleSendSummary}
                  disabled={sequenceLoading}
                >
                  {sequenceLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizonal className="h-4 w-4" />
                  )}
                  {sequenceLoading ? "Obteniendo..." : "Enviar Resumen"}
                </button>
              </div>
            </div>
          }
          renderFilters={
            <div className="w-full">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualizar
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 sm:w-auto"
                  onClick={handleExportCsv}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar CSV
                </button>
              </div>
            </div>
          }
          footerContent={
            <div className="flex w-full justify-end">
              <div className="grid w-full grid-cols-2 gap-2 text-sm sm:w-auto sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:min-w-[160px]">
                  <p className="text-xs text-slate-500">Cant.</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {totals.count}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:min-w-[160px]">
                  <p className="text-xs text-slate-500">SubTotal S/</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {formatCurrency(totals.subTotal)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:min-w-[160px]">
                  <p className="text-xs text-slate-500">IGV S/</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {formatCurrency(totals.igv)}
                  </p>
                </div>

                <div className="rounded-lg border border-[#B23636]/25 bg-[#B23636]/10 px-3 py-2 sm:min-w-[160px]">
                  <p className="text-xs text-[#B23636]/80">Total S/</p>
                  <p className="text-lg font-semibold text-[#B23636]">
                    {formatCurrency(totals.total)}
                  </p>
                </div>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}

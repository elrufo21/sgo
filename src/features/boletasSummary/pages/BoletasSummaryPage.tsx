import DataTable from "@/components/DataTable";
import { BackArrowButton } from "@/components/common/BackArrowButton";
import { toast } from "@/shared/ui/toast";
import { useBoletasSummaryStore } from "@/store/boletasSummary/boletasSummary.store";
import type {
  BoletaSummaryDocument,
  BoletaSummarySentRecord,
  BoletaSummarySendPayload,
} from "@/types/boletasSummary";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import {
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  SendHorizonal,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildBoletasCsv,
  calculateBoletaTotals,
  parseAmount,
} from "../boletasSummary.utils";

const columnHelper = createColumnHelper<BoletaSummaryDocument>();
const sentColumnHelper = createColumnHelper<BoletaSummarySentRecord>();

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

type BoletasSummarySession = {
  user?: {
    companyId?: string | number | null;
    companyRuc?: string | null;
    companyName?: string | null;
    entorno?: string | number | null;
    claveCertificado?: string | null;
    usuarioSol?: string | null;
    claveSol?: string | null;
    certificadoBase64?: string | null;
  };
  companiaId?: string | number | null;
  companiaRuc?: string | null;
  razonSocial?: string | null;
  loginPayload?: {
    companiaId?: string | number | null;
    companiaRuc?: string | null;
    razonSocial?: string | null;
    entorno?: string | number | null;
    claveCertificado?: string | null;
    usuarioSol?: string | null;
    claveSol?: string | null;
    certificadoBase64?: string | null;
  };
} | null;

type SummaryTab = "pending" | "sent";

export default function BoletasSummaryPage() {
  const {
    documents,
    sentSummaries,
    fetchDocuments,
    fetchSentSummaries,
    loading,
    sentSummariesLoading,
    sequenceLoading,
    sendingSummary,
    fetchNextSummarySequence,
    sendSummary,
  } = useBoletasSummaryStore();
  const [activeTab, setActiveTab] = useState<SummaryTab>("pending");
  const [filteredRows, setFilteredRows] = useState<BoletaSummaryDocument[]>([]);
  const todayIso = useMemo(() => toLocalIsoDate(new Date()), []);
  const firstDayOfMonthIso = useMemo(
    () => `${todayIso.slice(0, 8)}01`,
    [todayIso],
  );
  const [sentDateFrom, setSentDateFrom] = useState(firstDayOfMonthIso);
  const [sentDateTo, setSentDateTo] = useState(todayIso);
  const [filteredSentRows, setFilteredSentRows] = useState<
    BoletaSummarySentRecord[]
  >([]);
  const lastAutoFetchedSentRangeRef = useRef<string>("");

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    setFilteredRows(documents);
  }, [documents]);

  useEffect(() => {
    setFilteredSentRows(sentSummaries);
  }, [sentSummaries]);

  useEffect(() => {
    if (activeTab !== "sent") return;
    if (sentSummariesLoading) return;
    if (!sentDateFrom || !sentDateTo || sentDateFrom > sentDateTo) return;

    const currentRangeKey = `${sentDateFrom}|${sentDateTo}`;
    if (lastAutoFetchedSentRangeRef.current === currentRangeKey) return;

    lastAutoFetchedSentRangeRef.current = currentRangeKey;

    void fetchSentSummaries({
      fechaInicio: sentDateFrom,
      fechaFin: sentDateTo,
    });
  }, [
    activeTab,
    fetchSentSummaries,
    sentDateFrom,
    sentDateTo,
    sentSummariesLoading,
  ]);

  const totals = useMemo(
    () => calculateBoletaTotals(filteredRows),
    [filteredRows],
  );
  const sentTotals = useMemo(
    () =>
      filteredSentRows.reduce(
        (acc, row) => {
          acc.count += 1;
          acc.subTotal += parseAmount(row.subTotal);
          acc.igv += parseAmount(row.igv);
          acc.icbper += parseAmount(row.icbper);
          acc.total += parseAmount(row.total);
          return acc;
        },
        { count: 0, subTotal: 0, igv: 0, icbper: 0, total: 0 },
      ),
    [filteredSentRows],
  );
  const referenceDate = useMemo(
    () => documents[0]?.fechaEmision ?? "-",
    [documents],
  );

  const handleRefresh = useCallback(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const requestSentSummaries = useCallback(() => {
    if (!sentDateFrom || !sentDateTo) {
      toast.error("Debes seleccionar fecha inicio y fecha fin.");
      return;
    }
    if (sentDateFrom > sentDateTo) {
      toast.error("La fecha inicio no puede ser mayor que la fecha fin.");
      return;
    }

    void fetchSentSummaries({
      fechaInicio: sentDateFrom,
      fechaFin: sentDateTo,
    });
  }, [fetchSentSummaries, sentDateFrom, sentDateTo]);

  const handleRefreshSentSummaries = useCallback(() => {
    requestSentSummaries();
  }, [requestSentSummaries]);

  const handleSearchSentSummaries = useCallback(() => {
    requestSentSummaries();
  }, [requestSentSummaries]);

  const handleConsultSentSummary = useCallback(
    (row: BoletaSummarySentRecord) => {
      const detail = [
        safeTrim(row.serie) && `Serie: ${safeTrim(row.serie)}`,
        safeTrim(row.ticket) && `Ticket: ${safeTrim(row.ticket)}`,
        safeTrim(row.codigoSunat) && `Código: ${safeTrim(row.codigoSunat)}`,
        safeTrim(row.mensaje) && `Mensaje: ${safeTrim(row.mensaje)}`,
      ]
        .filter(Boolean)
        .join(" | ");

      toast.info(detail || "Sin detalle adicional del resumen.");
    },
    [],
  );

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

    let parsedSession: BoletasSummarySession = null;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("sgo.auth.session");
        parsedSession = raw ? (JSON.parse(raw) as BoletasSummarySession) : null;
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

    const payloadResumen: BoletaSummarySendPayload = {
      NRO_DOCUMENTO_EMPRESA: safeTrim(
        user.companyRuc ??
          parsedSession?.companiaRuc ??
          loginPayload.companiaRuc,
      ),
      RAZON_SOCIAL: safeTrim(
        user.companyName ??
          parsedSession?.razonSocial ??
          loginPayload.razonSocial,
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

    const response = await sendSummary(payloadResumen);
    const isSuccess = response.ok || response.flg_rta === "1";

    if (isSuccess) {
      const ticket = safeTrim(response.ticket || response.msj_sunat);
      const code = safeTrim(response.cod_sunat);
      const registroBdMensaje =
        safeTrim(response.registro_bd?.mensaje) ||
        safeTrim(response.registro_bd?.resultado);
      const sentRangeFrom = `${todayIso.slice(0, 8)}01`;
      const sentRangeTo = todayIso;
      if (ticket && code) {
        toast.success(`Resumen enviado. Ticket: ${ticket}. Código: ${code}`);
      } else if (ticket) {
        toast.success(`Resumen enviado. Ticket: ${ticket}`);
      } else if (code) {
        toast.success(`Resumen enviado. Código SUNAT: ${code}`);
      } else {
        toast.success(
          safeTrim(response.mensaje) || "Resumen enviado correctamente.",
        );
      }

      if (response.registro_bd && !response.registro_bd.ok) {
        toast.warning(
          registroBdMensaje ||
            "SUNAT aceptó el resumen, pero no se confirmó el registro en BD.",
        );
      }

      setSentDateFrom(sentRangeFrom);
      setSentDateTo(sentRangeTo);
      setActiveTab("sent");
      void fetchDocuments();
      void fetchSentSummaries({
        fechaInicio: sentRangeFrom,
        fechaFin: sentRangeTo,
      });
      return;
    }

    const errorCode = safeTrim(response.cod_sunat);
    const errorMessage = safeTrim(
      response.msj_sunat ||
        response.mensaje ||
        response.registro_bd?.mensaje ||
        response.registro_bd?.resultado,
    );
    if (errorCode && errorMessage) {
      toast.error(`${errorCode} - ${errorMessage}`);
      return;
    }
    toast.error(errorMessage || "No se pudo enviar el resumen.");
  }, [
    fetchDocuments,
    fetchNextSummarySequence,
    filteredRows,
    referenceDate,
    sendSummary,
    fetchSentSummaries,
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

  const handleExportSentCsv = useCallback(() => {
    if (!filteredSentRows.length) {
      toast.info("No hay resúmenes enviados para exportar.");
      return;
    }

    const headers = [
      "Fecha Emision",
      "Fecha Envio",
      "Serie",
      "Rango Numeros",
      "SubTotal",
      "IGV",
      "ICBPER",
      "Total",
      "Ticket",
      "Codigo SUNAT",
      "HASH CDR",
      "Mensaje",
      "Usuario",
      "Estado",
    ];

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredSentRows.map((row) =>
      [
        row.fechaEmision,
        row.fechaEnvio,
        row.serie,
        row.rangoNumeros,
        row.subTotal,
        row.igv,
        row.icbper,
        row.total,
        row.ticket,
        row.codigoSunat,
        row.hashCdr,
        row.mensaje,
        row.usuario,
        row.estado,
      ]
        .map(escapeCsv)
        .join(","),
    );

    const fileName = `resumenes-enviados_${sentDateFrom}_${sentDateTo}.csv`;
    const csv = `\uFEFF${[headers.map(escapeCsv).join(","), ...rows].join("\n")}`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }, [filteredSentRows, sentDateFrom, sentDateTo]);

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

  const sentColumns = useMemo<ColumnDef<BoletaSummarySentRecord, unknown>[]>(
    () => [
      sentColumnHelper.display({
        id: "consultar",
        header: "Consultar",
        cell: ({ row }) => (
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:underline"
            onClick={() => handleConsultSentSummary(row.original)}
          >
            Ver
          </button>
        ),
      }),
      sentColumnHelper.accessor("fechaEmision", {
        header: "Fecha Emisión",
        cell: (info) => info.getValue(),
      }),
      sentColumnHelper.accessor("fechaEnvio", {
        header: "Fecha Envío",
        cell: (info) => info.getValue(),
      }),
      sentColumnHelper.accessor("serie", {
        header: "Serie",
        cell: (info) => info.getValue(),
      }),
      sentColumnHelper.accessor("rangoNumeros", {
        header: "Rango Números",
        cell: (info) => info.getValue(),
      }),
      sentColumnHelper.accessor("subTotal", {
        header: "Sub Total",
        cell: (info) => info.getValue(),
        meta: { tdClassName: "text-right", align: "right" },
      }),
      sentColumnHelper.accessor("igv", {
        header: "IGV",
        cell: (info) => info.getValue(),
        meta: { tdClassName: "text-right", align: "right" },
      }),
      sentColumnHelper.accessor("icbper", {
        header: "ICBPER",
        cell: (info) => info.getValue(),
        meta: { tdClassName: "text-right", align: "right" },
      }),
      sentColumnHelper.accessor("total", {
        header: "Total",
        cell: (info) => info.getValue(),
        meta: { tdClassName: "text-right", align: "right" },
      }),
      sentColumnHelper.accessor("ticket", {
        header: "Ticket",
        cell: (info) => info.getValue() || "-",
      }),
      sentColumnHelper.accessor("codigoSunat", {
        header: "CD Sunat",
        cell: (info) => {
          const value = safeTrim(info.getValue());
          if (!value) return "-";

          const statusClass =
            value === "0"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-amber-100 text-amber-700 border-amber-200";

          return (
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClass}`}
            >
              {value}
            </span>
          );
        },
      }),
      sentColumnHelper.accessor("hashCdr", {
        header: "HASH CDR",
        cell: (info) => {
          const value = safeTrim(info.getValue());
          if (!value) return "-";

          return (
            <span className="inline-block max-w-[180px] truncate" title={value}>
              {value}
            </span>
          );
        },
      }),
      sentColumnHelper.accessor("mensaje", {
        header: "Mensaje",
        cell: (info) => {
          const value = safeTrim(info.getValue());
          if (!value) return "-";

          return (
            <span className="inline-block max-w-[320px] truncate" title={value}>
              {value}
            </span>
          );
        },
      }),
      sentColumnHelper.accessor("usuario", {
        header: "Usuario",
        cell: (info) => info.getValue() || "-",
      }),
    ],
    [handleConsultSentSummary],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <BackArrowButton />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              activeTab === "pending"
                ? "bg-[#B23636]/10 text-[#B23636]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Resumen de boletas
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              activeTab === "sent"
                ? "bg-[#B23636]/10 text-[#B23636]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setActiveTab("sent")}
          >
            Resúmenes enviados
          </button>
        </div>
      </div>

      {activeTab === "pending" ? (
        loading ? (
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
                    disabled={sequenceLoading || sendingSummary}
                  >
                    {sequenceLoading || sendingSummary ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SendHorizonal className="h-4 w-4" />
                    )}
                    {sequenceLoading
                      ? "Obteniendo..."
                      : sendingSummary
                        ? "Enviando..."
                        : "Enviar Resumen"}
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
        )
      ) : (
        <DataTable
          data={sentSummaries}
          columns={sentColumns}
          isLoading={sentSummariesLoading}
          emptyMessage="No hay resúmenes enviados en el rango seleccionado."
          filterKeys={[
            "fechaEmision",
            "fechaEnvio",
            "serie",
            "rangoNumeros",
            "ticket",
            "codigoSunat",
            "mensaje",
            "usuario",
          ]}
          searchPlaceholder="Buscar en resúmenes enviados..."
          onFilteredDataChange={setFilteredSentRows}
          toolbarAction={
            <div className="w-full lg:w-auto">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-sm font-medium text-slate-700">
                  Estado:
                </span>
                <select
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none sm:w-auto sm:min-w-[160px]"
                  value="ENVIADOS"
                  disabled
                >
                  <option value="ENVIADOS">ENVIADOS</option>
                </select>
              </div>
            </div>
          }
          renderFilters={
            <div className="w-full">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
                <label className="flex min-w-[150px] flex-col gap-1 text-xs text-slate-600">
                  Fecha Inicio
                  <input
                    type="date"
                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none"
                    value={sentDateFrom}
                    onChange={(event) => setSentDateFrom(event.target.value)}
                  />
                </label>
                <label className="flex min-w-[150px] flex-col gap-1 text-xs text-slate-600">
                  Fecha Fin
                  <input
                    type="date"
                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none"
                    value={sentDateTo}
                    onChange={(event) => setSentDateTo(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={handleSearchSentSummaries}
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={handleRefreshSentSummaries}
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualizar
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  onClick={handleExportSentCsv}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar CSV
                </button>
              </div>
            </div>
          }
          footerContent={
            <div className="flex w-full justify-end">
              <div className="grid w-full grid-cols-2 gap-2 text-sm lg:w-auto lg:grid-cols-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 lg:min-w-[140px]">
                  <p className="text-xs text-slate-500">Cant.</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {sentTotals.count}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 lg:min-w-[140px]">
                  <p className="text-xs text-slate-500">SubTotal S/</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {formatCurrency(sentTotals.subTotal)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 lg:min-w-[140px]">
                  <p className="text-xs text-slate-500">IGV S/</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {formatCurrency(sentTotals.igv)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 lg:min-w-[140px]">
                  <p className="text-xs text-slate-500">ICBPER S/</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {formatCurrency(sentTotals.icbper)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#B23636]/25 bg-[#B23636]/10 px-3 py-2 lg:min-w-[140px]">
                  <p className="text-xs text-[#B23636]/80">Total S/</p>
                  <p className="text-lg font-semibold text-[#B23636]">
                    {formatCurrency(sentTotals.total)}
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

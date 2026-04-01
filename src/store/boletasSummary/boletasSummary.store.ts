import { create } from "zustand";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import type {
  BoletaSummaryDocument,
  BoletaSummarySentRecord,
  BoletaSummarySendPayload,
  BoletaSummarySendResponse,
} from "@/types/boletasSummary";

interface BoletasSummaryState {
  documents: BoletaSummaryDocument[];
  sentSummaries: BoletaSummarySentRecord[];
  loading: boolean;
  sentSummariesLoading: boolean;
  sequenceLoading: boolean;
  sendingSummary: boolean;
  fetchDocuments: (dataOverride?: string | number) => Promise<void>;
  fetchSentSummaries: (params: {
    fechaInicio: string;
    fechaFin: string;
  }) => Promise<void>;
  fetchNextSummarySequence: (
    companyIdOverride?: string | number,
  ) => Promise<string | null>;
  sendSummary: (
    payload: BoletaSummarySendPayload,
  ) => Promise<BoletaSummarySendResponse>;
}

const toPositiveInt = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const normalizeText = (value: unknown, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const toBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  const raw = normalizeText(value, "").toLowerCase();
  return raw === "1" || raw === "true" || raw === "ok" || raw === "success";
};

const extractValidationMessages = (payload: unknown): string[] => {
  const record = asRecord(payload);
  if (!record) return [];

  return Object.values(record)
    .flatMap((value) =>
      Array.isArray(value)
        ? value.map((item) => normalizeText(item, "")).filter(Boolean)
        : [normalizeText(value, "")].filter(Boolean),
    )
    .filter(Boolean);
};

const extractApiMessage = (payload: unknown): string => {
  if (typeof payload === "string") return normalizeText(payload, "");

  const record = asRecord(payload);
  if (!record) return "";

  const directMessage = normalizeText(
    record.mensaje ?? record.message ?? record.title ?? record.detail ?? "",
    "",
  );
  if (directMessage) return directMessage;

  const validationMessages = extractValidationMessages(record.errors);
  if (validationMessages.length > 0) return validationMessages.join(" | ");

  const nestedMessage = extractApiMessage(record.error);
  if (nestedMessage) return nestedMessage;

  return "";
};

const resolveCompanyId = () => {
  if (typeof window === "undefined") return 1;
  try {
    const sessionRaw = window.localStorage.getItem("sgo.auth.session");
    if (!sessionRaw) return 1;

    const parsed = JSON.parse(sessionRaw) as
      | {
          user?: { companyId?: string | number | null };
          companiaId?: string | number | null;
        }
      | null;

    const companyIdRaw =
      parsed?.user?.companyId ??
      parsed?.companiaId ??
      window.localStorage.getItem("companiaId");

    const companyIdNum = Number(companyIdRaw);
    return Number.isFinite(companyIdNum) && companyIdNum > 0 ? companyIdNum : 1;
  } catch {
    return 1;
  }
};

const mapDelimitedRow = (chunk: string, index: number): BoletaSummaryDocument => {
  const parts = chunk.split("|");
  const at = (idx: number) => normalizeText(parts[idx], "");

  const docuId = toPositiveInt(at(0), 0);
  const companiaId = toPositiveInt(at(1), 0);
  const notaId = toPositiveInt(at(2), 0);

  return {
    id: docuId || index + 1,
    docuId,
    companiaId,
    notaId,
    fechaEmision: at(3),
    docuDocumento: at(4),
    serieNumero: at(5),
    cliente: at(6),
    clienteDni: at(7),
    subTotal: at(8) || "0.00",
    igv: at(9) || "0.00",
    icbper: at(10) || "0.00",
    total: at(11) || "0.00",
    usuario: at(12),
    estadoSunat: at(13),
  };
};

const parseDelimitedDocuments = (rawValue: string): BoletaSummaryDocument[] => {
  const raw = normalizeText(rawValue);
  if (!raw || raw === "~" || raw.toUpperCase() === "FORMATO_INVALIDO") {
    return [];
  }

  // Formato esperado: "dd/MM/yyyy§row1¬row2..." (a veces llega mojibake "Â§")
  const separator = raw.includes("§") ? "§" : raw.includes("Â§") ? "Â§" : "";
  const detailPayload = separator ? raw.split(separator).slice(1).join(separator) : raw;
  const normalizedDetail = normalizeText(detailPayload);
  if (!normalizedDetail || normalizedDetail === "~") return [];

  return normalizedDetail
    .split("¬")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk, index) => mapDelimitedRow(chunk, index));
};

const parseDocumentsResponse = (payload: unknown): BoletaSummaryDocument[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => {
        const row = item as Record<string, unknown>;
        const docuId = toPositiveInt(row.docuId ?? row.DocuId, 0);
        if (!docuId) return null;

        return {
          id: docuId || index + 1,
          docuId,
          companiaId: toPositiveInt(row.companiaId ?? row.CompaniaId, 0),
          notaId: toPositiveInt(row.notaId ?? row.NotaId, 0),
          fechaEmision: normalizeText(row.docuEmision ?? row.DocuEmision),
          docuDocumento: normalizeText(row.docuDocumento ?? row.DocuDocumento),
          serieNumero:
            normalizeText(row.serieNumero) ||
            normalizeText(
              `${normalizeText(row.docuSerie ?? row.DocuSerie)}-${normalizeText(row.docuNumero ?? row.DocuNumero)}`,
            ),
          cliente: normalizeText(row.clienteRazon ?? row.ClienteRazon),
          clienteDni: normalizeText(row.clienteDni ?? row.ClienteDni),
          subTotal: normalizeText(row.docuSubTotal ?? row.DocuSubTotal, "0.00"),
          igv: normalizeText(row.docuIgv ?? row.DocuIgv, "0.00"),
          icbper: normalizeText(row.icbper ?? row.ICBPER, "0.00"),
          total: normalizeText(row.docuTotal ?? row.DocuTotal, "0.00"),
          usuario: normalizeText(row.docuUsuario ?? row.DocuUsuario),
          estadoSunat: normalizeText(row.estadoSunat ?? row.EstadoSunat),
        } satisfies BoletaSummaryDocument;
      })
      .filter((item): item is BoletaSummaryDocument => Boolean(item));
  }

  if (typeof payload === "string") {
    return parseDelimitedDocuments(payload);
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const stringCandidate =
      (typeof record.resultado === "string" && record.resultado) ||
      (typeof record.Resultado === "string" && record.Resultado) ||
      Object.values(record).find((value) => typeof value === "string");

    if (typeof stringCandidate === "string") {
      const parsedFromString = parseDelimitedDocuments(stringCandidate);
      if (parsedFromString.length > 0) return parsedFromString;
    }

    const arrayCandidate = Object.values(record).find(Array.isArray);
    if (Array.isArray(arrayCandidate)) {
      return parseDocumentsResponse(arrayCandidate);
    }
  }

  return [];
};

const toIsoDate = (value: unknown): string => {
  const raw = normalizeText(value, "");
  if (!raw) return "";

  const [datePart = ""] = raw.split(" ");
  const slashMatch = datePart.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, dd, mm, yyyy] = slashMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const isoMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return datePart;

  return "";
};

const mapDelimitedSentSummaryRow = (
  chunk: string,
  index: number,
): BoletaSummarySentRecord => {
  const parts = chunk.split("|");
  const at = (idx: number) => normalizeText(parts[idx], "");
  const resumenId = toPositiveInt(at(0), 0);

  return {
    id: resumenId || index + 1,
    resumenId,
    companiaId: toPositiveInt(at(1), 0),
    fechaEmision: at(2),
    fechaEnvio: at(3),
    serie: at(4),
    rangoNumeros: at(5),
    subTotal: at(6) || "0.00",
    igv: at(7) || "0.00",
    icbper: at(8) || "0.00",
    total: at(9) || "0.00",
    ticket: at(10),
    codigoSunat: at(11),
    hashCdr: at(12),
    mensaje: at(13),
    usuario: at(14),
    estado: at(18),
  };
};

const parseDelimitedSentSummaries = (
  rawValue: string,
): BoletaSummarySentRecord[] => {
  const raw = normalizeText(rawValue, "");
  if (!raw || raw === "~" || raw.toUpperCase() === "FORMATO_INVALIDO") {
    return [];
  }

  const normalizedRaw = raw.replaceAll("Â¬", "¬");
  const chunks = normalizedRaw
    .split("¬")
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  if (!chunks.length) return [];

  const hasSchemaPrefix = chunks[0].includes("Id|Compania|FechaEmision|FechaEnvio");
  const detailRows = (hasSchemaPrefix ? chunks.slice(3) : chunks).filter(
    (chunk) => chunk && chunk !== "~",
  );

  return detailRows.map((chunk, index) => mapDelimitedSentSummaryRow(chunk, index));
};

const parseSentSummariesResponse = (payload: unknown): BoletaSummarySentRecord[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => {
        const row = item as Record<string, unknown>;
        const resumenId = toPositiveInt(
          row.resumenId ?? row.ResumenId ?? row.id ?? row.Id,
          0,
        );

        return {
          id: resumenId || index + 1,
          resumenId,
          companiaId: toPositiveInt(row.companiaId ?? row.CompaniaId, 0),
          fechaEmision: normalizeText(
            row.fechaEmision ?? row.FechaEmision ?? row.fechaReferencia,
          ),
          fechaEnvio: normalizeText(row.fechaEnvio ?? row.FechaEnvio),
          serie: normalizeText(row.serie ?? row.Serie ?? row.resumenSerie),
          rangoNumeros: normalizeText(
            row.rangoNumeros ?? row.RangoNumeros ?? row.rangoNumero,
          ),
          subTotal: normalizeText(row.subTotal ?? row.SubTotal, "0.00"),
          igv: normalizeText(row.igv ?? row.IGV, "0.00"),
          icbper: normalizeText(row.icbper ?? row.ICBPER, "0.00"),
          total: normalizeText(row.total ?? row.Total, "0.00"),
          ticket: normalizeText(
            row.ticket ?? row.Ticket ?? row.resumenTiket ?? row.ResumenTiket,
          ),
          codigoSunat: normalizeText(row.codigoSunat ?? row.CodigoSunat),
          hashCdr: normalizeText(row.hashCdr ?? row.HASHCDR ?? row.hashcdr),
          mensaje: normalizeText(row.mensaje ?? row.Mensaje ?? row.mensajeSunat),
          usuario: normalizeText(row.usuario ?? row.Usuario),
          estado: normalizeText(row.estado ?? row.Estado),
        } satisfies BoletaSummarySentRecord;
      })
      .filter((row) => row.serie || row.ticket || row.fechaEmision || row.fechaEnvio);
  }

  if (typeof payload === "string") {
    return parseDelimitedSentSummaries(payload);
  }

  const record = asRecord(payload);
  if (!record) return [];

  const stringCandidate =
    (typeof record.resultado === "string" && record.resultado) ||
    (typeof record.Resultado === "string" && record.Resultado) ||
    (typeof record.data === "string" && record.data) ||
    Object.values(record).find((value) => typeof value === "string");

  if (typeof stringCandidate === "string") {
    const fromString = parseDelimitedSentSummaries(stringCandidate);
    if (fromString.length > 0 || normalizeText(stringCandidate, "") === "~") {
      return fromString;
    }
  }

  const arrayCandidate = Object.values(record).find(Array.isArray);
  if (Array.isArray(arrayCandidate)) {
    return parseSentSummariesResponse(arrayCandidate);
  }

  return [];
};

const sentSummaryOrderKey = (row: BoletaSummarySentRecord) => {
  const rawDateTime = normalizeText(row.fechaEnvio || row.fechaEmision, "");
  const [datePart = "", timePart = ""] = rawDateTime.split(" ");
  const safeDate = toIsoDate(datePart) || "0000-00-00";
  const safeTime = /^\d{2}:\d{2}:\d{2}$/.test(timePart)
    ? timePart
    : "00:00:00";
  return `${safeDate} ${safeTime}`;
};

const isSentSummaryInRange = (
  row: BoletaSummarySentRecord,
  startIso: string,
  endIso: string,
) => {
  const emisionIso = toIsoDate(row.fechaEmision);
  const envioIso = toIsoDate(row.fechaEnvio);
  const currentIso = emisionIso || envioIso;

  if (!currentIso || !startIso || !endIso) return true;
  return currentIso >= startIso && currentIso <= endIso;
};

const parseSummarySequenceResponse = (payload: unknown): string | null => {
  if (!payload) return null;

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const fromJson = normalizeText(
        parsed.secuencia ?? parsed.Secuencia ?? "",
        "",
      );
      return fromJson || trimmed;
    } catch {
      return trimmed;
    }
  }

  if (typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const sequence = normalizeText(row.secuencia ?? row.Secuencia ?? "", "");
    if (sequence) return sequence;
  }

  return null;
};

const parseRegistroBdResponse = (
  payload: unknown,
): BoletaSummarySendResponse["registro_bd"] => {
  const fallback: BoletaSummarySendResponse["registro_bd"] = {
    ok: false,
    mensaje: "",
    resultado: "",
  };

  if (!payload) return fallback;

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return fallback;

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parseRegistroBdResponse(parsed);
    } catch {
      return {
        ...fallback,
        resultado: trimmed,
      };
    }
  }

  const record = asRecord(payload);
  if (!record) return fallback;

  return {
    ok: toBoolean(record.ok ?? record.Ok ?? false),
    mensaje: normalizeText(record.mensaje ?? record.message ?? "", ""),
    resultado: normalizeText(record.resultado ?? record.Resultado ?? "", ""),
  };
};

const emptySendSummaryResponse: BoletaSummarySendResponse = {
  ok: false,
  flg_rta: "0",
  mensaje: "",
  cod_sunat: "",
  msj_sunat: "",
  hash_cpe: "",
  hash_cdr: "",
  ticket: "",
  entorno_usado: "",
  tipo_proceso_usado: null,
  registro_bd: {
    ok: false,
    mensaje: "",
    resultado: "",
  },
};

const parseSendSummaryResponse = (payload: unknown): BoletaSummarySendResponse => {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) {
      return {
        ...emptySendSummaryResponse,
        mensaje: "No se pudo enviar el resumen.",
      };
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parseSendSummaryResponse(parsed);
    } catch {
      return {
        ...emptySendSummaryResponse,
        mensaje: trimmed,
        msj_sunat: trimmed,
      };
    }
  }

  const record = asRecord(payload);
  if (!record) {
    return {
      ...emptySendSummaryResponse,
      mensaje: "No se pudo enviar el resumen.",
    };
  }

  const axiosResponse = asRecord(record.response);
  if (axiosResponse) {
    const status = toPositiveInt(axiosResponse.status, 0);
    const apiMessage =
      extractApiMessage(axiosResponse.data) || normalizeText(record.message, "");

    return {
      ...emptySendSummaryResponse,
      mensaje: apiMessage || "No se pudo enviar el resumen.",
      cod_sunat: status > 0 ? String(status) : "",
      msj_sunat: apiMessage,
    };
  }

  const flag = normalizeText(
    record.flg_rta ?? record.flgRta ?? record.FlgRta ?? "",
    "",
  );
  const okValue = toBoolean(record.ok ?? record.Ok ?? null);
  const normalizedFlag = flag || (okValue ? "1" : "0");
  const normalizedOk = okValue || normalizedFlag === "1";

  const message =
    extractApiMessage(record) || normalizeText(record.mensaje ?? record.message, "");
  const msjSunat = normalizeText(
    record.msj_sunat ?? record.msjSunat ?? record.MsjSunat ?? "",
    "",
  );
  const ticket =
    normalizeText(record.ticket ?? record.Ticket ?? "", "") || msjSunat;
  const tipoProceso = toPositiveInt(
    record.tipo_proceso_usado ??
      record.tipoProcesoUsado ??
      record.TipoProcesoUsado,
    0,
  );
  const registroBd = parseRegistroBdResponse(
    record.registro_bd ?? record.registroBd ?? record.RegistroBd,
  );

  return {
    ok: normalizedOk,
    flg_rta: normalizedFlag,
    mensaje:
      message ||
      (normalizedOk
        ? "Resumen enviado correctamente."
        : "No se pudo enviar el resumen."),
    cod_sunat: normalizeText(
      record.cod_sunat ?? record.codSunat ?? record.CodSunat,
      "",
    ),
    msj_sunat: msjSunat,
    hash_cpe: normalizeText(
      record.hash_cpe ?? record.hashCpe ?? record.HashCpe,
      "",
    ),
    hash_cdr: normalizeText(
      record.hash_cdr ?? record.hashCdr ?? record.HashCdr,
      "",
    ),
    ticket,
    entorno_usado: normalizeText(
      record.entorno_usado ?? record.entornoUsado ?? record.EntornoUsado,
      "",
    ),
    tipo_proceso_usado: tipoProceso > 0 ? tipoProceso : null,
    registro_bd: registroBd,
  };
};

export const useBoletasSummaryStore = create<BoletasSummaryState>((set) => ({
  documents: [],
  sentSummaries: [],
  loading: false,
  sentSummariesLoading: false,
  sequenceLoading: false,
  sendingSummary: false,
  fetchDocuments: async (dataOverride) => {
    const fallbackCompanyId = resolveCompanyId();
    const payloadData =
      dataOverride !== undefined && dataOverride !== null
        ? String(dataOverride).trim()
        : String(fallbackCompanyId);
    const safeData = payloadData || String(fallbackCompanyId);

    set({ loading: true });
    try {
      const response = await apiRequest<unknown>({
        url: `${API_BASE_URL}/Nota/lista-documentos`,
        method: "POST",
        data: { data: safeData },
        config: {
          headers: {
            "Content-Type": "application/json",
          },
        },
        fallback: [],
      });

      set({
        documents: parseDocumentsResponse(response),
        loading: false,
      });
    } catch (error) {
      console.error("Error al listar boletas", error);
      set({ loading: false });
    }
  },
  fetchSentSummaries: async ({ fechaInicio, fechaFin }) => {
    const startIso = toIsoDate(fechaInicio);
    const endIso = toIsoDate(fechaFin);

    if (!startIso || !endIso || startIso > endIso) {
      set({ sentSummaries: [] });
      return;
    }

    set({ sentSummariesLoading: true });
    try {
      const query = new URLSearchParams({
        fechaInicio: startIso,
        fechaFin: endIso,
      });
      const response = await apiRequest<unknown>({
        url: `${API_BASE_URL}/Nota/resumen/fecha?${query.toString()}`,
        method: "GET",
        fallback: null,
      });
      const mergedRows = parseSentSummariesResponse(response);

      const dedupMap = new Map<string, BoletaSummarySentRecord>();
      mergedRows.forEach((row) => {
        const dedupKey = [
          row.resumenId || 0,
          row.companiaId || 0,
          normalizeText(row.serie, ""),
          normalizeText(row.ticket, ""),
          normalizeText(row.fechaEnvio, ""),
        ].join("|");
        if (!dedupMap.has(dedupKey)) {
          dedupMap.set(dedupKey, row);
        }
      });

      const rows = Array.from(dedupMap.values())
        .filter((row) => isSentSummaryInRange(row, startIso, endIso))
        .sort((a, b) => sentSummaryOrderKey(b).localeCompare(sentSummaryOrderKey(a)));

      set({ sentSummaries: rows, sentSummariesLoading: false });
    } catch (error) {
      console.error("Error al listar resúmenes enviados", error);
      set({ sentSummaries: [], sentSummariesLoading: false });
    }
  },
  fetchNextSummarySequence: async (companyIdOverride) => {
    const fallbackCompanyId = resolveCompanyId();
    const companyIdNum = toPositiveInt(companyIdOverride, fallbackCompanyId);
    const safeCompanyId = companyIdNum > 0 ? companyIdNum : fallbackCompanyId;

    set({ sequenceLoading: true });
    try {
      const response = await apiRequest<unknown>({
        url: `${API_BASE_URL}/Nota/resumen/secuencia/${safeCompanyId}`,
        method: "GET",
        fallback: null,
      });

      return parseSummarySequenceResponse(response);
    } catch (error) {
      console.error("Error al obtener secuencia del resumen", error);
      return null;
    } finally {
      set({ sequenceLoading: false });
    }
  },
  sendSummary: async (payload) => {
    set({ sendingSummary: true });
    try {
      const response = await apiRequest<unknown>({
        url: `${API_BASE_URL}/Nota/resumen/enviar`,
        method: "POST",
        data: payload,
        config: {
          headers: {
            "Content-Type": "application/json",
          },
        },
        fallback: null,
      });

      return parseSendSummaryResponse(response);
    } catch (error) {
      console.error("Error al enviar resumen de boletas", error);
      return {
        ...emptySendSummaryResponse,
        mensaje: "No se pudo enviar el resumen.",
      };
    } finally {
      set({ sendingSummary: false });
    }
  },
}));

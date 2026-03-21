import { create } from "zustand";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import type { BoletaSummaryDocument } from "@/types/boletasSummary";

interface BoletasSummaryState {
  documents: BoletaSummaryDocument[];
  loading: boolean;
  fetchDocuments: (dataOverride?: string | number) => Promise<void>;
}

const toPositiveInt = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const normalizeText = (value: unknown, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
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

export const useBoletasSummaryStore = create<BoletasSummaryState>((set) => ({
  documents: [],
  loading: false,
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
}));

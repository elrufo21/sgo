import { create } from "zustand";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import type { OrderNote, OrderNoteApiItem } from "@/types/orderNote";
import type { SendNote, SendNoteItem } from "@/types/sendNote";

interface FetchOrderNotesParams {
  page?: number;
  pageSize?: number;
}

interface OrderNoteState {
  notes: OrderNote[];
  loading: boolean;
  page: number;
  pageSize: number;
  fetchNotes: (params?: FetchOrderNotesParams) => Promise<void>;
  fetchNoteDetail: (noteId: number | string) => Promise<SendNote | null>;
  updateNoteDetail: (
    noteId: number,
    formData: Omit<SendNote, "id">,
    current: SendNote
  ) => Promise<boolean>;
}

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : Math.floor(fallback);
};

const normalizeText = (value: unknown, fallback = "-") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const normalizeLower = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapDocTypeToCode = (docValue: string) => {
  const normalized = normalizeLower(docValue);
  if (normalized.includes("boleta")) return "03";
  if (normalized.includes("factura")) return "01";
  return "101";
};

const mapConceptToOption = (conceptValue: string) => {
  const normalized = normalizeLower(conceptValue);
  if (normalized.includes("serv")) return "servicio";
  if (normalized.includes("merc")) return "mercaderia";
  return normalized || "mercaderia";
};

const mapFormaPagoToOption = (formaPagoValue: string) => {
  const normalized = normalizeLower(formaPagoValue);
  if (normalized.includes("efect")) return "efectivo";
  if (normalized.includes("contado")) return "efectivo";
  if (normalized.includes("depo")) return "deposito";
  if (normalized.includes("trans")) return "transferencia";
  return normalized || "efectivo";
};

const mapFormDocTypeToNotaDocu = (
  tipoDocumentoValue: string,
  current?: SendNote
) => {
  const normalized = normalizeLower(tipoDocumentoValue);
  if (normalized === "03" || normalized.includes("boleta")) return "BOLETA";
  if (normalized === "01" || normalized.includes("factura")) return "FACTURA";
  if (normalized === "101" || normalized.includes("proforma"))
    return "PROFORMA V";
  return current?.notaDocu ?? "BOLETA";
};

const mapFormFormaPagoToNotaFormaPago = (formaPagoValue: string) => {
  const normalized = normalizeLower(formaPagoValue);
  if (normalized.includes("efect")) return "CONTADO";
  if (normalized.includes("depo")) return "DEPOSITO";
  if (normalized.includes("trans")) return "TRANSFERENCIA";
  return String(formaPagoValue ?? "").trim().toUpperCase() || "CONTADO";
};

const resolveSessionUsername = () => {
  if (typeof window === "undefined") return "USUARIO";
  try {
    const rawSession = window.localStorage.getItem("sgo.auth.session");
    if (!rawSession) return "USUARIO";
    const parsed = JSON.parse(rawSession) as {
      user?: { displayName?: string; username?: string };
    } | null;
    return (
      String(parsed?.user?.displayName ?? "").trim() ||
      String(parsed?.user?.username ?? "").trim() ||
      "USUARIO"
    );
  } catch {
    return "USUARIO";
  }
};

const mapApiToOrderNote = (item: OrderNoteApiItem, index: number): OrderNote => {
  const notaId = normalizeText(item?.notaId, "0");
  const parsedId = Number(notaId);

  return {
    id: Number.isFinite(parsedId) && parsedId > 0 ? parsedId : index + 1,
    notaId,
    documento: normalizeText(item?.documento),
    fecha: normalizeText(item?.fecha),
    cliente: normalizeText(item?.cliente),
    formaPago: normalizeText(item?.formaPago),
    total: normalizeText(item?.total, "0.00"),
    acuenta: normalizeText(item?.acuenta, "0.00"),
    saldo: normalizeText(item?.saldo, "0.00"),
    usuario: normalizeText(item?.usuario),
    estado: normalizeText(item?.estado, "PENDIENTE"),
  };
};

const parseResultStringToSendNote = (resultString: string): SendNote | null => {
  const raw = String(resultString ?? "").trim();
  if (!raw || raw === "~" || raw === "FORMATO_INVALIDO") {
    return null;
  }

  const separatorIndex = raw.indexOf("[");
  const headerRaw = separatorIndex >= 0 ? raw.slice(0, separatorIndex) : raw;
  const detailsRaw = separatorIndex >= 0 ? raw.slice(separatorIndex + 1) : "";
  const headerParts = headerRaw.split("|");
  const at = (idx: number) => String(headerParts[idx] ?? "").trim();

  const noteId = toNumber(at(0), 0);
  const documentValue = at(1);
  const clienteId = toNumber(at(2), 0);
  const userValue = at(4);
  const condicionValue = at(6);
  const estadoValue = at(19);

  const parsedItems: SendNoteItem[] = detailsRaw
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): SendNoteItem | null => {
      const parts = chunk.split("|");
      if (parts[0] !== "DET") return null;

      const productId = toNumber(parts[3], 0);
      return {
        productId: productId > 0 ? productId : null,
        codigo: String(parts[3] ?? "").trim(),
        nombre: String(parts[6] ?? "").trim(),
        descripcion: String(parts[6] ?? "").trim(),
        unidadMedida: String(parts[5] ?? "").trim(),
        cantidad: toNumber(parts[4], 0),
        preCosto: toNumber(parts[7], 0),
        descuento: 0,
        importe: toNumber(parts[9], 0),
      };
    })
    .filter((item): item is SendNoteItem => Boolean(item));

  return {
    id: noteId,
    clienteId: clienteId > 0 ? clienteId : undefined,
    formaPago: mapFormaPagoToOption(at(5)),
    entidad: at(30),
    opr: at(31),
    cliente: at(33),
    ruc: at(34),
    dni: at(35),
    direccionFiscal: at(36) || at(8),
    direccionDespacho: at(40) || at(8) || at(36),
    telefono: at(37) || at(9),
    concepto: mapConceptToOption(at(24)),
    tipoDocumento: mapDocTypeToCode(documentValue),
    buscarCodigo: "",
    radioOpcion: "opcion1",
    items: parsedItems,
    usuarioResponsable: userValue,
    atendidoPor: userValue || at(22),
    estado: estadoValue,
    fechaEmitido: at(3),
    fechaPago: at(7) || at(3),
    notaCondicion: condicionValue || "NORMAL",
    notaDocu: documentValue || "BOLETA",
  };
};

export const useOrderNoteStore = create<OrderNoteState>((set, get) => ({
  notes: [],
  loading: false,
  page: 1,
  pageSize: 50,
  fetchNotes: async (params) => {
    const currentState = get();
    const nextPage = toPositiveInt(params?.page, currentState.page);
    const nextPageSize = toPositiveInt(params?.pageSize, currentState.pageSize);

    set({ loading: true });
    try {
      const response = await apiRequest<unknown>({
        url: `${API_BASE_URL}/Nota/list?page=${nextPage}&pageSize=${nextPageSize}`,
        method: "GET",
        fallback: [],
      });

      const rows = Array.isArray(response) ? response : [];
      set({
        notes: rows.map((item, index) =>
          mapApiToOrderNote(item as OrderNoteApiItem, index)
        ),
        loading: false,
        page: nextPage,
        pageSize: nextPageSize,
      });
    } catch (error) {
      console.error("Error al listar notas de pedido", error);
      set({ loading: false });
    }
  },
  fetchNoteDetail: async (noteId) => {
    const parsedId = toPositiveInt(noteId, 0);
    if (!parsedId) return null;

    try {
      const response = await apiRequest<unknown>({
        url: `${API_BASE_URL}/Nota/sp/${parsedId}`,
        method: "GET",
        fallback: null,
      });

      const resultString =
        typeof response === "string"
          ? response
          : (response as { resultado?: unknown } | null)?.resultado;

      if (typeof resultString !== "string") return null;
      return parseResultStringToSendNote(resultString);
    } catch (error) {
      console.error("Error al cargar detalle de nota de pedido", error);
      return null;
    }
  },
  updateNoteDetail: async (noteId, formData, current) => {
    const safeNoteId = toPositiveInt(noteId, 0);
    if (!safeNoteId) return false;

    const nowDate = new Date().toISOString().slice(0, 10);
    const clienteId = toPositiveInt(
      formData.clienteId ?? current.clienteId ?? 0,
      0
    );
    const notaFecha =
      String(current.fechaEmitido ?? "").trim() ||
      String(formData.fechaPago ?? "").trim() ||
      nowDate;

    const notaPayload = {
      notaId: safeNoteId,
      notaDocu: mapFormDocTypeToNotaDocu(formData.tipoDocumento, current),
      clienteId,
      notaFecha,
      notaUsuario:
        String(current.usuarioResponsable ?? "").trim() ||
        String(current.atendidoPor ?? "").trim() ||
        resolveSessionUsername(),
      notaFormaPago: mapFormFormaPagoToNotaFormaPago(formData.formaPago),
      notaCondicion:
        String(current.notaCondicion ?? "").trim().toUpperCase() || "NORMAL",
    };

    const detallesPayload = (formData.items ?? [])
      .filter((item) => toPositiveInt(item.productId, 0) > 0)
      .map((item) => {
        const detalleCantidad = toNumber(item.cantidad, 0);
        const detalleCosto = toNumber(item.preCosto, 0);
        const detalleImporte = toNumber(item.importe, 0);
        const detallePrecio =
          detalleCantidad > 0
            ? Number((detalleImporte / detalleCantidad).toFixed(2))
            : detalleCosto;

        return {
          idProducto: toPositiveInt(item.productId, 0),
          detalleCantidad,
          detalleUm: String(item.unidadMedida ?? "").trim() || "UND",
          detalleDescripcion:
            String(item.nombre ?? "").trim() ||
            String(item.descripcion ?? "").trim(),
          detalleCosto,
          detallePrecio,
          detalleImporte,
          detalleEstado: "ACTIVO",
        };
      })
      .filter((item) => item.idProducto > 0);

    if (!clienteId) return false;
    if (!detallesPayload.length) return false;

    const response = await apiRequest<unknown>({
      url: `${API_BASE_URL}/Nota/editarOrden`,
      method: "PUT",
      data: {
        nota: notaPayload,
        detalles: detallesPayload,
      },
      config: {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      },
      fallback: null,
    });

    if (!response) return false;

    if (typeof response === "object" && response !== null) {
      const maybeError = response as {
        isAxiosError?: boolean;
        response?: { status?: number };
      };
      if (maybeError.isAxiosError) return false;
      if ((maybeError.response?.status ?? 200) >= 400) return false;
    }

    return true;
  },
}));

import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import type { Holiday } from "@/types/maintenance";

export const holidaysQueryKey = ["holidays"] as const;

type HolidayApiResponse = {
  idFeriado?: number;
  feriadoId?: number;
  id?: number;
  fecha?: string;
  feriadoFecha?: string;
  motivo?: string;
  feriadoMotivo?: string;
};

const ENDPOINT = `${API_BASE_URL}/Feriados`;

const formatDateOnly = (value?: string) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  try {
    return value.substring(0, 10);
  } catch {
    return "";
  }
};

const mapHoliday = (item: HolidayApiResponse): Holiday => {
  const id =
    Number(
      item?.idFeriado ??
        item?.feriadoId ??
        item?.id ??
        (item as any)?.feriadoID ??
        0
    ) || 0;

  return {
    id,
    fecha: formatDateOnly(item?.fecha ?? item?.feriadoFecha ?? ""),
    motivo: String(item?.motivo ?? item?.feriadoMotivo ?? ""),
  };
};

export const fetchHolidaysApi = async (): Promise<Holiday[]> => {
  const response = await apiRequest<HolidayApiResponse[]>({
    url: `${ENDPOINT}/list`,
    method: "GET",
    fallback: [],
  });

  return (
    response
      ?.map(mapHoliday)
      .filter(
        (h) =>
          Boolean(h.id) ||
          Boolean(h.fecha) ||
          Boolean(h.motivo)
      ) ?? []
  );
};

export const fetchHolidayByIdApi = async (
  id: number
): Promise<Holiday | null> => {
  if (!id) return null;
  const response = await apiRequest<HolidayApiResponse>({
    url: `${ENDPOINT}/${id}`,
    method: "GET",
    fallback: null,
  });
  return response ? mapHoliday(response) : null;
};

type HolidayConflict =
  | { error: "EXISTE_FECHA" }
  | { error: string };

export const saveHolidayApi = async (
  payload: Omit<Holiday, "id"> & { id?: number }
): Promise<Holiday | HolidayConflict> => {
  const body = {
    idFeriado: payload.id ?? 0,
    fecha: payload.fecha,
    motivo: payload.motivo,
  };

  const response = await apiRequest<HolidayApiResponse | string>({
    url: `${ENDPOINT}/register`,
    method: "POST",
    data: body,
    config: {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    },
    fallback: body as any,
  });

  if (typeof response === "string") {
    const upper = response.toUpperCase();
    if (upper.includes("EXISTE_FECHA") || upper.includes("EXISTE FERIADO")) {
      return { error: "EXISTE_FERIADO" };
    }
    return mapHoliday({ ...body, idFeriado: payload.id ?? 0 });
  }

  return mapHoliday(response ?? { ...body, idFeriado: payload.id ?? 0 });
};

export const deleteHolidayApi = async (id: number) => {
  if (!id) return false;
  const response = await apiRequest({
    url: `${ENDPOINT}/${id}`,
    method: "DELETE",
    config: {
      headers: {
        Accept: "*/*",
      },
    },
    fallback: null,
  });

  return Boolean(response);
};

import type { Holiday } from "@/types/maintenance";
import { apiRequest } from "@/shared/helpers/apiRequest";

export const holidaysQueryKey = ["holidays"] as const;

type HolidayApiResponse = {
  feriadoId?: number;
  feriadoFecha?: string;
  feriadoMotivo?: string;
} & Record<string, unknown>;

export const fetchHolidaysApi = async (): Promise<Holiday[]> => {
  const response = await apiRequest<HolidayApiResponse[]>({
    url: "http://localhost:5000/api/v1/Feriado/list",
    method: "GET",
    fallback: [],
  });

  return (
    response?.map((item) => ({
      id: Number(item.feriadoId ?? (item as any).id ?? 0),
      fecha: String(item.feriadoFecha ?? (item as any).fecha ?? ""),
      motivo: String(item.feriadoMotivo ?? (item as any).motivo ?? ""),
    })) ?? []
  );
};

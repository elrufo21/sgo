import type { Category } from "@/types/maintenance";
import { apiRequest } from "@/shared/helpers/apiRequest";

export const categoriesQueryKey = ["categories"] as const;

export const fetchCategoriesApi = async (): Promise<Category[]> => {
  const response = await apiRequest<Category[]>({
    url: "http://localhost:5000/api/v1/Linea/list",
    method: "GET",
    fallback: [],
  });
  return response ?? [];
};

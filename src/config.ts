export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const ENDPOINTS = {
  personal: "/Personal",
  personalList: "/Personal/list",
  personalRegister: "/Personal/registerpersonal",

  categoriaRegister: "/Linea/registerlinea",
  categoriaById: (id: number | string) => `/Linea/${id}`,

  areaRegister: "/Area/registerarea",
  areaById: (id: number | string) => `/Area/${id}`,

  maquinaRegister: "/Maquina/registermaquina",
  maquinaById: (id: number | string) => `/Maquina/${id}`,
} as const;

export const FEATURE_FLAGS = {
  richToasts: true,
};

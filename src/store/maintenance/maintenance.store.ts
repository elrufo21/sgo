import { create } from "zustand";
import type { Category, Area, Computer } from "@/types/maintenance";
import { apiRequest } from "@/shared/helpers/apiRequest";

interface MaintenanceState {
  categories: Category[];
  areas: Area[];
  computers: Computer[];
  loading: boolean;

  fetchCategories: () => Promise<void>;
  fetchAreas: () => Promise<void>;
  fetchComputers: () => Promise<void>;

  addCategory: (data: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: number, data: Partial<Category>) => Promise<void>;
  deleteCategory: (idSubLinea: number) => Promise<void>;

  addArea: (data: Omit<Area, "id">) => void;
  updateArea: (id: number, data: Partial<Area>) => void;
  deleteArea: (id: number) => void;

  addComputer: (data: Omit<Computer, "id">) => void;
  updateComputer: (id: number, data: Partial<Computer>) => void;
  deleteComputer: (id: number) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  categories: [],
  areas: [],
  computers: [],
  loading: false,

  fetchCategories: async () => {
    if (get().categories.length > 0) return;

    set({ loading: true });

    try {
      const response = await apiRequest<Category[]>({
        url: "http://localhost:5000/api/v1/Linea/list",
        method: "GET",
        fallback: [],
      });
      set({
        categories: response ?? [],
        loading: false,
      });
    } catch (err) {
      console.error("❌ Error al obtener categorías", err);
      set({ loading: false });
    }
  },

  fetchAreas: async () => {
    if (get().areas.length > 0) return;
    set({ loading: true });
    try {
      const response: Area[] = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              { id: 1, area: "Sistemas" },
              { id: 2, area: "Administración" },
            ]),
          600
        )
      );
      set({ areas: response, loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },

  fetchComputers: async () => {
    if (get().computers.length > 0) return;
    set({ loading: true });
    try {
      const response: Computer[] = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              {
                id: 1,
                maquina: "PC-01",
                registro: "2025-12-05",
                serieFactura: "F001-123",
                serieNc: "NC001-001",
                serieBoleta: "B001-001",
                ticketera: "TKT01",
                areaId: 1,
              },
            ]),
          600
        )
      );
      set({ computers: response, loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },

  // CRUD
  addCategory: async (data) => {
    const payload = {
      idSubLinea: 0,
      nombreSublinea: data.nombreSublinea,
      codigoSunat: data.codigoSunat,
    };

    const created = await apiRequest<Category>({
      url: "http://localhost:5000/api/v1/Linea/registerlinea",
      method: "POST",
      data: payload,
      config: {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      },
      fallback: { ...data, id: Date.now() },
    });

    set((state) => ({
      categories: [
        ...state.categories,
        created?.id
          ? created
          : { ...data, id: Date.now(), nombreSublinea: data.nombreSublinea },
      ],
    }));
  },

  updateCategory: async (id, data) => {
    const payload = {
      idSubLinea: id,
      nombreSublinea: data.nombreSublinea ?? data.nombre ?? "",
      codigoSunat: data.codigoSunat ?? "",
    };

    const updated = await apiRequest<Category>({
      url: "http://localhost:5000/api/v1/Linea/registerlinea",
      method: "POST",
      data: payload,
      config: {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      },
      fallback: { ...data, id },
    });

    set((state) => ({
      categories: state.categories.map((c) =>
        String(c.id) === String(id)
          ? updated?.id
            ? updated
            : { ...c, ...data, id }
          : c
      ),
    }));
  },
  deleteCategory: async (idSubLinea) => {
    await apiRequest({
      url: `http://localhost:5000/api/v1/Linea/${idSubLinea}`,
      method: "DELETE",
      config: {
        headers: {
          Accept: "*/*",
        },
      },
      fallback: null,
    });

    set((state) => ({
      categories: state.categories.filter(
        (c) => String(c.id) !== String(idSubLinea)
      ),
    }));
  },

  addArea: (data) =>
    set((state) => {
      const newId = state.areas.length
        ? Math.max(...state.areas.map((a) => a.id)) + 1
        : 1;
      return { areas: [...state.areas, { ...data, id: newId }] };
    }),
  updateArea: (id, data) =>
    set((state) => ({
      areas: state.areas.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  deleteArea: (id) =>
    set((state) => ({ areas: state.areas.filter((a) => a.id !== id) })),

  addComputer: (data) =>
    set((state) => {
      const newId = state.computers.length
        ? Math.max(...state.computers.map((c) => c.id)) + 1
        : 1;
      return { computers: [...state.computers, { ...data, id: newId }] };
    }),
  updateComputer: (id, data) =>
    set((state) => ({
      computers: state.computers.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),
  deleteComputer: async (id) => {
    await apiRequest({
      url: `http://localhost:5000/api/v1/Linea/${id}`,
      method: "DELETE",
      config: {
        headers: {
          Accept: "*/*",
        },
      },
      fallback: null,
    });

    set((state) => ({
      computers: state.computers.filter((c) => c.id !== id),
    }));
  },
}));

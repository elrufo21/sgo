import { create } from "zustand";
import type { Category, Area, Computer } from "@/types/maintenance";

interface MaintenanceState {
  // DATA --------------------------
  categories: Category[];
  areas: Area[];
  computers: Computer[];
  loading: boolean;

  // FETCH -------------------------
  fetchCategories: () => Promise<void>;
  fetchAreas: () => Promise<void>;
  fetchComputers: () => Promise<void>;

  // CATEGORY CRUD -----------------
  addCategory: (data: Omit<Category, "id">) => void;
  updateCategory: (id: number, data: Partial<Category>) => void;
  deleteCategory: (id: number) => void;

  // AREA CRUD ---------------------
  addArea: (data: Omit<Area, "id">) => void;
  updateArea: (id: number, data: Partial<Area>) => void;
  deleteArea: (id: number) => void;

  // COMPUTER CRUD -----------------
  addComputer: (data: Omit<Computer, "id">) => void;
  updateComputer: (id: number, data: Partial<Computer>) => void;
  deleteComputer: (id: number) => void;
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
      const response: Category[] = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              { id: 1, category: "Laptop", sunatCode: "1001" },
              { id: 2, category: "Impresora", sunatCode: "2001" },
            ]),
          600
        )
      );

      set({ categories: response, loading: false });
    } catch (err) {
      console.error("Error loading categories", err);
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
      console.error("Error loading areas", err);
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
                brand: "Dell",
                model: "Inspiron 3500",
                serialNumber: "SN123456",
                areaId: 1,
              },
            ]),
          600
        )
      );

      set({ computers: response, loading: false });
    } catch (err) {
      console.error("Error loading computers", err);
      set({ loading: false });
    }
  },

  addCategory: (data) =>
    set((state) => {
      const newId =
        state.categories.length > 0
          ? Math.max(...state.categories.map((c) => c.id)) + 1
          : 1;

      return { categories: [...state.categories, { ...data, id: newId }] };
    }),

  updateCategory: (id, data) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),

  addArea: (data) =>
    set((state) => {
      const newId =
        state.areas.length > 0
          ? Math.max(...state.areas.map((a) => a.id)) + 1
          : 1;

      return { areas: [...state.areas, { ...data, id: newId }] };
    }),

  updateArea: (id, data) =>
    set((state) => ({
      areas: state.areas.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),

  deleteArea: (id) =>
    set((state) => ({
      areas: state.areas.filter((a) => a.id !== id),
    })),

  addComputer: (data) =>
    set((state) => {
      const newId =
        state.computers.length > 0
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

  deleteComputer: (id) =>
    set((state) => ({
      computers: state.computers.filter((c) => c.id !== id),
    })),
}));

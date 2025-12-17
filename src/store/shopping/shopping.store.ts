import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Shopping, ShoppingFormData, ShoppingItem } from "@/types/shopping";

interface ShoppingState {
  shoppings: Shopping[];
  draftItems: ShoppingItem[];
  loading: boolean;
  fetchShoppings: () => Promise<void>;
  addShopping: (data: ShoppingFormData) => Promise<Shopping>;
  updateShopping: (id: number, data: ShoppingFormData) => Promise<Shopping>;
  deleteShopping: (id: number) => Promise<boolean>;
  setDraftItems: (items: ShoppingItem[]) => void;
  clearDraftItems: () => void;
}

const mockData: Shopping[] = [
  {
    id: 1,
    concepto: "Compra local",
    proveedor: "Proveedor A",
    descripcion: "Compra de insumos varios",
    ruc: "20123456789",
    fechaEmision: "2024-12-01",
    documento: "Factura",
    serie: "F001",
    numero: "000123",
    condicion: "Crédito",
    moneda: "PEN",
    diasPlazo: 30,
    fechaPago: "2024-12-31",
    tipoIgv: "Gravado",
    tipoCambio: 3.78,
    items: [],
  },
  {
    id: 2,
    concepto: "Servicio técnico",
    proveedor: "Servicios SRL",
    descripcion: "Mantenimiento de equipos",
    ruc: "20654321987",
    fechaEmision: "2024-12-05",
    documento: "Boleta",
    serie: "B002",
    numero: "000567",
    condicion: "Contado",
    moneda: "USD",
    diasPlazo: 0,
    fechaPago: "2024-12-05",
    tipoIgv: "Exonerado",
    tipoCambio: 3.82,
    items: [],
  },
];

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set, get) => ({
      shoppings: [],
      draftItems: [],
      loading: false,

      fetchShoppings: async () => {
        if (get().shoppings.length > 0) return;
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 350));
        set({ shoppings: mockData, loading: false });
      },

      addShopping: async (data) => {
        const nextId =
          get().shoppings.length > 0
            ? Math.max(...get().shoppings.map((s) => s.id)) + 1
            : 1;
        const newItem: Shopping = { ...data, id: nextId };
        set((state) => ({ shoppings: [...state.shoppings, newItem] }));
        return newItem;
      },

      updateShopping: async (id, data) => {
        const updated: Shopping = { ...data, id };
        set((state) => ({
          shoppings: state.shoppings.map((s) => (s.id === id ? updated : s)),
        }));
        return updated;
      },

      deleteShopping: async (id) => {
        set((state) => ({
          shoppings: state.shoppings.filter((s) => s.id !== id),
        }));
        return true;
      },

      setDraftItems: (items) => set({ draftItems: items }),
      clearDraftItems: () => set({ draftItems: [] }),
    }),
    {
      name: "shopping-store",
      partialize: (state) => ({ draftItems: state.draftItems }),
    }
  )
);

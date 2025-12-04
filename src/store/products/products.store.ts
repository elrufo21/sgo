import { create } from "zustand";
import type { Product } from "@/types/product";

interface ProductsState {
  products: Product[];
  loading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (id: number, data: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  loading: false,

  fetchProducts: async () => {
    if (get().products.length > 0) return;

    set({ loading: true });

    try {
      const response: Product[] = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              {
                id: 1,
                categoria: "Periféricos",
                codigo: "MGR-001",
                nombre: "Mouse Gamer RGB",
                unidadMedida: "Unidad",
                valorCritico: 5,
                preCosto: 70,
                preVenta: 89.9,
                aplicaINV: "bien",
                cantidad: 20,
                usuario: "admin",
                estado: "activo",
              },
              {
                id: 2,
                categoria: "Periféricos",
                codigo: "TMC-002",
                nombre: "Teclado Mecánico Red Switch",
                unidadMedida: "Unidad",
                valorCritico: 5,
                preCosto: 120,
                preVenta: 159.99,
                aplicaINV: "bien",
                cantidad: 15,
                usuario: "admin",
                estado: "activo",
              },
            ]),
          600
        )
      );

      set({ products: response, loading: false });
    } catch (error) {
      console.error("Error loading products", error);
      set({ loading: false });
    }
  },

  addProduct: (product) =>
    set((state) => {
      const newId =
        state.products.length > 0
          ? Math.max(...state.products.map((p) => p.id)) + 1
          : 1;

      return { products: [...state.products, { ...product, id: newId }] };
    }),

  updateProduct: (id, data) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),

  deleteProduct: (id) =>
    set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";
import type { PosCartItem, PosTotals } from "@/types/pos";

const calculateTotals = (items: PosCartItem[]): PosTotals => {
  const subTotal = items.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  return {
    subTotal,
    total: subTotal,
    itemCount: items.reduce((acc, item) => acc + item.cantidad, 0),
  };
};

interface PosState {
  items: PosCartItem[];
  totals: PosTotals;
  addProduct: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updatePrice: (productId: number, price: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      items: [],
      totals: { subTotal: 0, total: 0, itemCount: 0 },

      addProduct: (product, quantity = 1) =>
        set((state) => {
          const price =
            Number(product.preVenta ?? 0) ||
            Number((product as any).preVentaB ?? 0) ||
            0;
          const existing = state.items.find(
            (item) => item.productId === product.id
          );
          const currentQty = existing?.cantidad ?? 0;
          const desiredQty = currentQty + quantity;
          const nextQty = Math.max(desiredQty, 1);

          if (nextQty <= 0) return state;

          const nextItems = existing
            ? state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, cantidad: nextQty, precio: price }
                  : item
              )
            : [
                ...state.items,
                {
                  productId: product.id,
                  codigo: product.codigo,
                  nombre: product.nombre,
                  unidadMedida: product.unidadMedida,
                  precio: price,
                  cantidad: nextQty,
                  stock: product.cantidad,
                },
              ];

          return { items: nextItems, totals: calculateTotals(nextItems) };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          const nextItems = state.items
            .map((item) => {
              if (item.productId !== productId) return item;
              const rawQty = Number.isFinite(quantity) ? quantity : 0;
              const cappedQty = Math.max(rawQty, 0);

              return { ...item, cantidad: cappedQty };
            })
            .filter((item) => item.cantidad > 0);

          return { items: nextItems, totals: calculateTotals(nextItems) };
        }),

      updatePrice: (productId, price) =>
        set((state) => {
          const safePrice = Number.isFinite(price) ? Math.max(price, 0) : 0;
          const nextItems = state.items.map((item) =>
            item.productId === productId
              ? { ...item, precio: safePrice }
              : item
          );
          return { items: nextItems, totals: calculateTotals(nextItems) };
        }),

      removeItem: (productId) =>
        set((state) => {
          const nextItems = state.items.filter(
            (item) => item.productId !== productId
          );
          return { items: nextItems, totals: calculateTotals(nextItems) };
        }),

      clearCart: () => set({ items: [], totals: { subTotal: 0, total: 0, itemCount: 0 } }),
    }),
    {
      name: "pos-cart",
      partialize: (state) => ({ items: state.items, totals: state.totals }),
    }
  )
);

export const selectTotals = (state: PosState) => state.totals;

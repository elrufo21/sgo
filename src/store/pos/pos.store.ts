import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";
import type { PosCartItem, PosTotals } from "@/types/pos";

const toNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toNonNegative = (value: unknown): number => Math.max(toNumber(value, 0), 0);

const calculateTotals = (items: PosCartItem[]): PosTotals => {
  let subTotal = 0;
  let itemCount = 0;

  for (const item of items) {
    const cantidad = toNonNegative(item.cantidad);
    const precio = toNonNegative(item.precio);
    subTotal += precio * cantidad;
    itemCount += cantidad;
  }

  return {
    subTotal,
    total: subTotal,
    itemCount,
  };
};

interface PosState {
  items: PosCartItem[];
  totals: PosTotals;
  editingNotaId: number | null;
  serverItemsFromNota: PosCartItem[];
  isEditingMode: boolean;
  addProduct: (product: Product, quantity?: number) => void;
  setItems: (items: PosCartItem[]) => void;
  setEditingNota: (notaId: number | null) => void;
  setEditingMode: (isEditing: boolean) => void;
  setServerItemsFromNota: (items: PosCartItem[]) => void;
  clearEditingNota: () => void;
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
      editingNotaId: null,
      serverItemsFromNota: [],
      isEditingMode: false,

      setItems: (items) =>
        set((state) => {
          if (state.items === items) return state;
          return { items, totals: calculateTotals(items) };
        }),

      setEditingNota: (notaId) =>
        set((state) => {
          if (state.editingNotaId === notaId) return state;
          return { editingNotaId: notaId };
        }),

      setEditingMode: (isEditing) =>
        set((state) => {
          if (state.isEditingMode === isEditing) return state;
          return { isEditingMode: isEditing };
        }),

      setServerItemsFromNota: (items) =>
        set((state) => {
          if (state.serverItemsFromNota === items) return state;
          return { serverItemsFromNota: items };
        }),

      clearEditingNota: () =>
        set((state) => {
          if (
            state.editingNotaId === null &&
            state.serverItemsFromNota.length === 0 &&
            state.isEditingMode === false
          ) {
            return state;
          }

          return {
            editingNotaId: null,
            serverItemsFromNota: [],
            isEditingMode: false,
          };
        }),

      addProduct: (product, quantity = 1) =>
        set((state) => {
          const price =
            toNumber((product as any).preVenta ?? 0) ||
            toNumber((product as any).preVentaB ?? 0) ||
            0;
          const existing = state.items.find(
            (item) => item.productId === product.id
          );
          const currentQty = toNonNegative(existing?.cantidad ?? 0);
          const desiredQty = currentQty + quantity;
          const nextQty = Math.max(desiredQty, 1);

          if (nextQty <= 0) return state;

          if (existing && nextQty === existing.cantidad && existing.precio === price) {
            return state;
          }

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
                  stock: toNumber(
                    (product as any).cantidad ?? (product as any).stock ?? 0
                  ),
                },
              ];

          return { items: nextItems, totals: calculateTotals(nextItems) };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          let changed = false;
          const nextItems = state.items.map((item) => {
            if (item.productId !== productId) return item;
            const cappedQty = toNonNegative(quantity);
            if (cappedQty === item.cantidad) return item;
            changed = true;
            return { ...item, cantidad: cappedQty };
          });

          if (!changed) return state;
          return { items: nextItems, totals: calculateTotals(nextItems) };
        }),

      updatePrice: (productId, price) =>
        set((state) => {
          const safePrice = toNonNegative(price);
          let changed = false;
          const nextItems = state.items.map((item) => {
            if (item.productId !== productId) return item;
            if (item.precio === safePrice) return item;
            changed = true;
            return { ...item, precio: safePrice };
          });

          if (!changed) return state;
          return { items: nextItems, totals: calculateTotals(nextItems) };
        }),

      removeItem: (productId) =>
        set((state) => {
          const nextItems = state.items.filter(
            (item) => item.productId !== productId
          );
          if (nextItems.length === state.items.length) return state;
          return { items: nextItems, totals: calculateTotals(nextItems) };
        }),

      clearCart: () =>
        set((state) => {
          if (state.items.length === 0 && state.totals.itemCount === 0) {
            return state;
          }
          return {
            items: [],
            totals: { subTotal: 0, total: 0, itemCount: 0 },
          };
        }),
    }),
    {
      name: "pos-cart",
      partialize: (state) => ({
        items: state.items,
        totals: state.totals,
        editingNotaId: state.editingNotaId,
        serverItemsFromNota: state.serverItemsFromNota,
        isEditingMode: state.isEditingMode,
      }),
    }
  )
);

export const selectTotals = (state: PosState) => state.totals;

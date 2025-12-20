import { create } from "zustand";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import type { Product } from "@/types/product";

interface ApiProduct {
  idProducto?: number;
  idSubLinea?: number | null;
  productoCodigo?: string | null;
  productoNombre?: string | null;
  productoTipoCambio?: number | null;
  productoCostoDolar?: number | null;
  productoUM?: string | null;
  productoCosto?: number | null;
  productoVenta?: number | null;
  productoVentaB?: number | null;
  productoCantidad?: number | null;
  productoObs?: string | null;
  productoEstado?: string | null;
  productoUsuario?: string | null;
  productoFecha?: string | null;
  productoImagen?: string | null;
  valorCritico?: number | null;
  aplicaTC?: string | null;
  fechaVencimiento?: string | null;
  aplicaFechaV?: boolean | null;
  aplicaINV?: string | null;
  cantidadANT?: number | null;
  fechaModCant?: string | null;
}

interface ProductsState {
  products: Product[];
  loading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (
    product: Omit<Product, "id"> & {
      imageFile?: File | null;
      imageRemoved?: boolean;
    }
  ) => Promise<boolean>;
  updateProduct: (
    id: number,
    data: Omit<Product, "id"> & { imageFile?: File | null; imageRemoved?: boolean }
  ) => Promise<boolean>;
  deleteProduct: (id: number) => Promise<boolean>;
}

const mapApiToProduct = (item: ApiProduct): Product => ({
  id: item.idProducto ?? 0,
  codigo: item.productoCodigo ?? "",
  nombre: item.productoNombre ?? "",
  unidadMedida: item.productoUM ?? "",
  valorCritico: Number(item.valorCritico ?? 0),
  preCosto: Number(item.productoCosto ?? 0),
  preVenta: Number(item.productoVenta ?? 0),
  aplicaINV: ((item.aplicaINV as string) === "S"
    ? "servicio"
    : "bien") as Product["aplicaINV"],
  cantidad: Number(item.productoCantidad ?? 0),
  usuario: item.productoUsuario ?? "",
  estado:
    (item.productoEstado as Product["estado"]) ??
    ("activo" as Product["estado"]),
  images: item.productoImagen ? [item.productoImagen] : [],
  idSubLinea: item.idSubLinea,
  preVentaB: item.productoVentaB,
});

const mapProductToApi = (
  product: Partial<Product>,
  idOverride?: number
): ApiProduct => ({
  idProducto: idOverride ?? product.id ?? 0,
  idSubLinea:
    product.idSubLinea === undefined || product.idSubLinea === null
      ? 0
      : Number(product.idSubLinea),
  productoCodigo: product.codigo ?? "",
  productoNombre: product.nombre ?? "",
  productoUM: product.unidadMedida ?? "",
  valorCritico: product.valorCritico ?? 0,
  productoCosto: product.preCosto ?? 0,
  productoVenta: product.preVenta ?? 0,
  productoVentaB: product.preVentaB ?? 0,
  productoCantidad: product.cantidad ?? 0,
  productoObs: "",
  productoEstado: product.estado ?? "BUENO",
  productoUsuario: product.usuario ?? "",
  productoFecha: new Date().toISOString(),
  productoImagen: product.images?.[0] ?? "",
  productoTipoCambio: 0,
  productoCostoDolar: 0,
  aplicaTC: null,
  fechaVencimiento: null,
  aplicaFechaV: false,
  aplicaINV: "S",
  cantidadANT: product.cantidad ?? 0,
  fechaModCant: null,
});

const baseUrl = `${API_BASE_URL}/Productos`;

const buildProductFormData = (
  product: Partial<Product> & {
    imageFile?: File | null;
    imageRemoved?: boolean;
  },
  idOverride?: number
) => {
  const payload = mapProductToApi(product, idOverride);
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    // El backend asigna la imagen; no enviar productoImagen.
    if (key === "productoImagen") return;
    const normalized =
      value === undefined || value === null ? "" : (value as any).toString();
    formData.append(key, normalized);
  });

  if (product.imageFile instanceof File) {
    formData.append("imagen", product.imageFile);
  }
  if (product.imageRemoved) {
    formData.append("eliminarImagen", "true");
  }

  return { formData, payload };
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  loading: false,

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const response = await apiRequest<ApiProduct[]>({
        url: `${baseUrl}/list`,
        method: "GET",
        fallback: [],
      });
      const data = Array.isArray(response) ? response : [];
      set({ products: data.map(mapApiToProduct), loading: false });
    } catch (error) {
      console.error("Error loading products", error);
      set({ loading: false });
    }
  },

  addProduct: async (product) => {
    try {
      set({ loading: true });
      const { formData, payload } = buildProductFormData(product, 0);
      const created = await apiRequest<ApiProduct>({
        url: `${baseUrl}/register`,
        method: "POST",
        data: formData,
        fallback: payload,
      });

      if (
        typeof created === "string" &&
        created.toLowerCase().includes("existe")
      ) {
        return false;
      }

      const newItem = mapApiToProduct(created ?? payload);
      set((state) => ({ products: [...state.products, newItem] }));
      return true;
    } catch (error) {
      console.error("Error creating product", error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateProduct: async (id, data) => {
    try {
      set({ loading: true });
      const { formData, payload } = buildProductFormData(data, id);
      const updated = await apiRequest<ApiProduct>({
        url: `${baseUrl}/register`,
        method: "POST",
        data: formData,
        fallback: payload,
      });

      if (
        typeof updated === "string" &&
        updated.toLowerCase().includes("existe")
      ) {
        return false;
      }

      const updatedItem = mapApiToProduct(updated ?? payload);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updatedItem : p)),
      }));
      return true;
    } catch (error) {
      console.error("Error updating product", error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteProduct: async (id) => {
    try {
      const result = await apiRequest({
        url: `${baseUrl}/${id}`,
        method: "DELETE",
        config: { headers: { Accept: "*/*" } },
        fallback: true,
      });

      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));

      return result !== false;
    } catch (error) {
      console.error("Error deleting product", error);
      return false;
    }
  },
}));

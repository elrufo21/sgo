import { create } from "zustand";
import type { Category, Area, Computer, Provider } from "@/types/maintenance";
import { apiRequest } from "@/shared/helpers/apiRequest";
import { toast } from "sonner";
import { queryClient } from "@/shared/queryClient";
import {
  categoriesQueryKey,
  fetchCategoriesApi,
} from "@/features/maintenance/categories/categories.api";
import {
  areasQueryKey,
  fetchAreasApi,
} from "@/features/maintenance/areas/areas.api";
import {
  computersQueryKey,
  fetchComputersApi,
} from "@/features/maintenance/computers/computers.api";
import {
  providersQueryKey,
  fetchProvidersApi,
} from "@/features/maintenance/providers/providers.api";

interface MaintenanceState {
  categories: Category[];
  areas: Area[];
  computers: Computer[];
  providers: Provider[];
  loading: boolean;
  setCategories: (items: Category[]) => void;
  setAreas: (items: Area[]) => void;
  setComputers: (items: Computer[]) => void;
  setProviders: (items: Provider[]) => void;

  fetchCategories: () => Promise<void>;
  fetchAreas: () => Promise<void>;
  fetchComputers: () => Promise<void>;
  fetchProviders: () => Promise<void>;

  addCategory: (data: Omit<Category, "id">) => Promise<boolean>;
  updateCategory: (id: number, data: Partial<Category>) => Promise<boolean>;
  deleteCategory: (idSubLinea: number) => Promise<boolean>;

  addArea: (data: Omit<Area, "id">) => Promise<boolean>;
  updateArea: (id: number, data: Partial<Area>) => Promise<void>;
  deleteArea: (id: number) => Promise<boolean>;

  addComputer: (data: Omit<Computer, "id">) => Promise<void>;
  updateComputer: (id: number, data: Partial<Computer>) => Promise<void>;
  deleteComputer: (id: number) => Promise<boolean>;

  addProvider: (data: Omit<Provider, "id">) => Promise<void>;
  updateProvider: (id: number, data: Partial<Provider>) => Promise<void>;
  deleteProvider: (id: number) => Promise<boolean>;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  categories: [],
  areas: [],
  computers: [],
  providers: [],
  loading: false,
  setCategories: (items) => set({ categories: items }),
  setAreas: (items) => set({ areas: items }),
  setComputers: (items) => set({ computers: items }),
  setProviders: (items) => set({ providers: items }),

  fetchCategories: async () => {
    set({ loading: true });

    try {
      const response = await queryClient.fetchQuery({
        queryKey: categoriesQueryKey,
        queryFn: fetchCategoriesApi,
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
    set({ loading: true });
    try {
      const response = await queryClient.fetchQuery({
        queryKey: areasQueryKey,
        queryFn: fetchAreasApi,
      });
      set({ areas: response ?? [], loading: false });
    } catch (err) {
      console.error("Error al obtener áreas", err);
      set({ loading: false });
    }
  },

  fetchComputers: async () => {
    set({ loading: true });
    try {
      const response = await queryClient.fetchQuery({
        queryKey: computersQueryKey,
        queryFn: fetchComputersApi,
      });
      set({ computers: response ?? [], loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },
  fetchProviders: async () => {
    set({ loading: true });
    try {
      const response = await queryClient.fetchQuery({
        queryKey: providersQueryKey,
        queryFn: fetchProvidersApi,
      });
      set({ providers: response ?? [], loading: false });
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

    const created = await apiRequest<Category | string>({
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

    if (
      typeof created === "string" &&
      created.toLowerCase().includes("existe")
    ) {
      toast.error("Ya existe esa categoria");
      return false;
    }

    set((state) => ({
      categories: [
        ...state.categories,
        created?.id
          ? created
          : { ...data, id: Date.now(), nombreSublinea: data.nombreSublinea },
      ],
    }));

    await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    return true;
  },

  updateCategory: async (id, data) => {
    const payload = {
      idSubLinea: id,
      nombreSublinea: data.nombreSublinea ?? data.nombre ?? "",
      codigoSunat: data.codigoSunat ?? "",
    };

    const updated = await apiRequest<Category | string>({
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

    if (
      typeof updated === "string" &&
      updated.toLowerCase().includes("existe")
    ) {
      toast.error("Ya existe esa categoria");
      return false;
    }

    set((state) => ({
      categories: state.categories.map((c) =>
        String(c.id) === String(id)
          ? updated?.id
            ? updated
            : { ...c, ...data, id }
          : c
      ),
    }));

    await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    return true;
  },

  deleteCategory: async (idSubLinea) => {
    const result = await apiRequest({
      url: `http://localhost:5000/api/v1/Linea/${idSubLinea}`,
      method: "DELETE",
      config: {
        headers: {
          Accept: "*/*",
        },
      },
      fallback: null,
    });
    if (!result) {
      return false;
    } else {
      set((state) => ({
        categories: state.categories.filter(
          (c) => String(c.id) !== String(idSubLinea)
        ),
      }));

      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      return true;
    }
  },

  addArea: async (data) => {
    const payload = {
      areaId: 0,
      areaNombre: data.area,
    };

    const created = await apiRequest<{
      areaId?: number;
      areaNombre?: string;
    }>({
      url: "http://localhost:5000/api/v1/Area/registerarea",
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

    if (
      typeof created === "string" &&
      created.toLowerCase().includes("existe")
    ) {
      toast.error("Ya existe esta area");
      return false;
    }

    const hasCreatedId =
      created &&
      typeof created === "object" &&
      ("areaId" in (created as any) || "id" in (created as any));

    if (hasCreatedId) {
      const idValue = (created as any).id ?? (created as any).areaId;
      const areaValue =
        (created as any).nombre ?? (created as any).areaNombre ?? data.area;
      set((state) => ({
        areas: [...state.areas, { id: idValue, area: areaValue }],
      }));
    } else {
      set((state) => ({
        areas: [...state.areas, { ...data, id: Date.now() }],
      }));
    }
    await queryClient.invalidateQueries({ queryKey: areasQueryKey });
    return true;
  },
  updateArea: async (id, data) => {
    const payload = {
      areaId: id,
      areaNombre: data.area ?? "",
    };

    const updated = await apiRequest<{
      areaId?: number;
      areaNombre?: string;
    }>({
      url: `http://localhost:5000/api/v1/Area/${id}`,
      method: "PUT",
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
      areas: state.areas.map((a) => {
        if (a.id !== id) return a;
        const hasUpdatedId =
          updated &&
          typeof updated === "object" &&
          ("areaId" in (updated as any) || "id" in (updated as any));
        if (hasUpdatedId) {
          return {
            id: (updated as any).id ?? (updated as any).areaId ?? id,
            area:
              (updated as any).nombre ??
              (updated as any).areaNombre ??
              data.area ??
              a.area,
          };
        }
        return { ...a, ...data };
      }),
    }));

    await queryClient.invalidateQueries({ queryKey: areasQueryKey });
  },
  deleteArea: async (id) => {
    const result = await apiRequest({
      url: `http://localhost:5000/api/v1/Area/${id}`,
      method: "DELETE",
      config: {
        headers: {
          Accept: "*/*",
        },
      },
      fallback: null,
    });

    if (!result) {
      return false;
    }

    set((state) => ({ areas: state.areas.filter((a) => a.id !== id) }));
    await queryClient.invalidateQueries({ queryKey: areasQueryKey });
    return true;
  },

  addComputer: async (data) => {
    const payload = {
      idMaquina: 0,
      nombreMaquina: data.maquina,
      registro: data.registro,
      serieFactura: data.serieFactura,
      serieNC: data.serieNc,
      serieBoleta: data.serieBoleta,
      tiketera: data.ticketera,
    };

    const created = await apiRequest<{
      idMaquina?: number;
      nombreMaquina?: string;
      registro?: string;
      serieFactura?: string;
      serieNC?: string;
      serieBoleta?: string;
      tiketera?: string;
    }>({
      url: "http://localhost:5000/api/v1/Maquina/registermaquina",
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

    if (
      typeof created === "string" &&
      created.toLowerCase().includes("existe")
    ) {
      toast.error("Ya existe esta maquina registrada");
      return false;
    }

    if (
      created &&
      typeof created === "object" &&
      ("idMaquina" in created || "id" in created)
    ) {
      set((state) => ({
        computers: [
          ...state.computers,
          {
            id: (created as any).id ?? (created as any).idMaquina,
            maquina: (created as any).nombreMaquina ?? data.maquina,
            registro: (created as any).registro ?? data.registro,
            serieFactura: (created as any).serieFactura ?? data.serieFactura,
            serieNc: (created as any).serieNC ?? data.serieNc,
            serieBoleta: (created as any).serieBoleta ?? data.serieBoleta,
            ticketera: (created as any).tiketera ?? data.ticketera,
            areaId: data.areaId ?? 0,
          },
        ],
      }));
    } else {
      set((state) => ({
        computers: [...state.computers, { ...data, id: Date.now() }],
      }));
    }

    await queryClient.invalidateQueries({ queryKey: computersQueryKey });
    return true;
  },
  updateComputer: async (id, data) => {
    const payload = {
      idMaquina: id,
      nombreMaquina: data.maquina ?? "",
      registro: data.registro ?? "",
      serieFactura: data.serieFactura ?? "",
      serieNC: data.serieNc ?? "",
      serieBoleta: data.serieBoleta ?? "",
      tiketera: data.ticketera ?? "",
    };

    const updated = await apiRequest<{
      idMaquina?: number;
      nombreMaquina?: string;
      registro?: string;
      serieFactura?: string;
      serieNC?: string;
      serieBoleta?: string;
      tiketera?: string;
    }>({
      url: "http://localhost:5000/api/v1/Maquina/registermaquina",
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

    if (
      typeof updated === "string" &&
      updated.toLowerCase().includes("existe")
    ) {
      toast.error("Ya existe un registro con ese nombre");
      return false;
    }

    set((state) => ({
      computers: state.computers.map((c) => {
        if (c.id !== id) return c;
        if (
          updated &&
          typeof updated === "object" &&
          ("idMaquina" in (updated as any) || "id" in (updated as any))
        ) {
          return {
            id: (updated as any).id ?? (updated as any).idMaquina ?? id,
            maquina:
              (updated as any).nombreMaquina ?? data.maquina ?? c.maquina,
            registro: (updated as any).registro ?? data.registro ?? c.registro,
            serieFactura:
              (updated as any).serieFactura ??
              data.serieFactura ??
              c.serieFactura,
            serieNc: (updated as any).serieNC ?? data.serieNc ?? c.serieNc,
            serieBoleta:
              (updated as any).serieBoleta ?? data.serieBoleta ?? c.serieBoleta,
            ticketera:
              (updated as any).tiketera ?? data.ticketera ?? c.ticketera,
            areaId: c.areaId,
          };
        }
        return { ...c, ...data };
      }),
    }));

    await queryClient.invalidateQueries({ queryKey: computersQueryKey });
    return true;
  },
  deleteComputer: async (id) => {
    const result = await apiRequest({
      url: `http://localhost:5000/api/v1/Maquina/${id}`,
      method: "DELETE",
      config: {
        headers: {
          Accept: "*/*",
        },
      },
      fallback: null,
    });

    if (!result) {
      return false;
    }

    set((state) => ({
      computers: state.computers.filter((c) => c.id !== id),
    }));
    await queryClient.invalidateQueries({ queryKey: computersQueryKey });
    return true;
  },

  addProvider: async (data) => {
    const payload = {
      proveedorId: 0,
      proveedorRazon: data.razon,
      proveedorRuc: data.ruc,
      proveedorContacto: data.contacto,
      proveedorCelular: data.celular,
      proveedorTelefono: data.telefono,
      proveedorCorreo: data.correo,
      proveedorDireccion: data.direccion,
      proveedorEstado: data.estado,
    };

    const created = await apiRequest<any>({
      url: "http://localhost:5000/api/v1/Proveedor/register",
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

    const hasCreatedId =
      created &&
      typeof created === "object" &&
      ("proveedorId" in (created as any) || "id" in (created as any));

    set((state) => ({
      providers: [
        ...state.providers,
        hasCreatedId
          ? {
              id: (created as any).id ?? (created as any).proveedorId,
              razon:
                (created as any).proveedorRazon ??
                (created as any).razon ??
                data.razon,
              ruc: (created as any).proveedorRuc ?? data.ruc,
              contacto: (created as any).proveedorContacto ?? data.contacto,
              celular: (created as any).proveedorCelular ?? data.celular,
              telefono: (created as any).proveedorTelefono ?? data.telefono,
              correo: (created as any).proveedorCorreo ?? data.correo,
              direccion: (created as any).proveedorDireccion ?? data.direccion,
              estado: (created as any).proveedorEstado ?? data.estado,
            }
          : { ...data, id: Date.now() },
      ],
    }));

    await queryClient.invalidateQueries({ queryKey: providersQueryKey });
  },

  updateProvider: async (id, data) => {
    const payload = {
      proveedorId: id,
      proveedorRazon: data.razon ?? "",
      proveedorRuc: data.ruc ?? "",
      proveedorContacto: data.contacto ?? "",
      proveedorCelular: data.celular ?? "",
      proveedorTelefono: data.telefono ?? "",
      proveedorCorreo: data.correo ?? "",
      proveedorDireccion: data.direccion ?? "",
      proveedorEstado: data.estado ?? "",
    };

    const updated = await apiRequest<any>({
      url: `http://localhost:5000/api/v1/Proveedor/${id}`,
      method: "PUT",
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
      providers: state.providers.map((p) => {
        if (p.id !== id) return p;
        const hasUpdatedId =
          updated &&
          typeof updated === "object" &&
          ("proveedorId" in (updated as any) || "id" in (updated as any));
        if (hasUpdatedId) {
          return {
            id: (updated as any).id ?? (updated as any).proveedorId ?? id,
            razon:
              (updated as any).proveedorRazon ??
              (updated as any).razon ??
              data.razon ??
              p.razon,
            ruc: (updated as any).proveedorRuc ?? data.ruc ?? p.ruc,
            contacto:
              (updated as any).proveedorContacto ?? data.contacto ?? p.contacto,
            celular:
              (updated as any).proveedorCelular ?? data.celular ?? p.celular,
            telefono:
              (updated as any).proveedorTelefono ?? data.telefono ?? p.telefono,
            correo: (updated as any).proveedorCorreo ?? data.correo ?? p.correo,
            direccion:
              (updated as any).proveedorDireccion ??
              data.direccion ??
              p.direccion,
            estado: (updated as any).proveedorEstado ?? data.estado ?? p.estado,
          };
        }
        return { ...p, ...data };
      }),
    }));

    await queryClient.invalidateQueries({ queryKey: providersQueryKey });
  },

  deleteProvider: async (id) => {
    const result = await apiRequest({
      url: `http://localhost:5000/api/v1/Proveedor/${id}`,
      method: "DELETE",
      config: {
        headers: {
          Accept: "*/*",
        },
      },
      fallback: null,
    });

    if (!result) {
      return false;
    }

    set((state) => ({
      providers: state.providers.filter((p) => p.id !== id),
    }));
    await queryClient.invalidateQueries({ queryKey: providersQueryKey });
    return true;
  },
}));

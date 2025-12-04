import type { Client } from "@/types/customer";
import { create } from "zustand";

interface ClientsState {
  clients: Client[];
  loading: boolean;
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, "id">) => void;
  updateClient: (id: number, data: Partial<Client>) => void;
  deleteClient: (id: number) => void;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  loading: false,

  fetchClients: async () => {
    if (get().clients.length > 0) return;

    set({ loading: true });

    try {
      const response: Client[] = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              {
                id: 1,
                nombreRazon: "Empresa XYZ",
                ruc: "20123456789",
                dni: "12345678",
                direccionFiscal: "Av. Principal 123",
                direccionDespacho: "Av. Secundaria 456",
                telefonoMovil: "987654321",
                email: "contacto@xyz.com",
                registradoPor: "admin",
                estado: "activo",
              },
              {
                id: 2,
                nombreRazon: "Juan Pérez",
                ruc: "",
                dni: "87654321",
                direccionFiscal: "Calle Falsa 123",
                direccionDespacho: "Calle Verdadera 456",
                telefonoMovil: "912345678",
                email: "juan@gmail.com",
                registradoPor: "admin",
                estado: "activo",
              },
            ]),
          600
        )
      );

      set({ clients: response, loading: false });
    } catch (error) {
      console.error("Error loading clients", error);
      set({ loading: false });
    }
  },

  addClient: (client) =>
    set((state) => {
      const newId =
        state.clients.length > 0
          ? Math.max(...state.clients.map((c) => c.id)) + 1
          : 1;
      return { clients: [...state.clients, { ...client, id: newId }] };
    }),

  updateClient: (id, data) =>
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),

  deleteClient: (id) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    })),
}));

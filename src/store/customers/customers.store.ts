import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import type { ApiClient, Client } from "@/types/customer";
import { create } from "zustand";

interface ClientsState {
  clients: Client[];
  loading: boolean;
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, "id">) => Promise<void>;
  updateClient: (id: number, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: number) => Promise<boolean>;
}

const mapApiToClient = (item: any): Client => ({
  id: item?.clienteId ?? item?.ClienteId ?? item?.id ?? 0,
  nombreRazon: item?.clienteRazon ?? item?.ClienteRazon ?? "",
  ruc: item?.clienteRuc ?? item?.ClienteRuc ?? "",
  dni: item?.clienteDni ?? item?.ClienteDni ?? "",
  direccionFiscal: item?.clienteDireccion ?? item?.ClienteDireccion ?? "",
  direccionDespacho: item?.clienteDespacho ?? item?.ClienteDespacho ?? "",
  telefonoMovil: item?.clienteTelefono ?? item?.ClienteTelefono ?? "",
  email: item?.clienteCorreo ?? item?.ClienteCorreo ?? "",
  registradoPor: item?.clienteUsuario ?? item?.ClienteUsuario ?? "",
  estado: item?.clienteEstado ?? item?.ClienteEstado ?? "activo",
  fecha: item?.clienteFecha ?? item?.ClienteFecha ?? null,
});

const mapClientToApi = (client: Partial<Client>): ApiClient => ({
  clienteId: client.id ?? 0,
  clienteRazon: client.nombreRazon ?? "",
  clienteRuc: client.ruc ?? "",
  clienteDni: client.dni ?? "",
  clienteDireccion: client.direccionFiscal ?? "",
  clienteTelefono: client.telefonoMovil ?? "",
  clienteCorreo: client.email ?? "",
  clienteEstado: client.estado ?? "activo",
  clienteDespacho: client.direccionDespacho ?? "",
  clienteUsuario: client.registradoPor ?? "",
  clienteFecha: client.fecha ?? null,
});

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  loading: false,

  fetchClients: async () => {
    set({ loading: true });
    try {
      const response = await apiRequest<ApiClient[]>({
        url: `${API_BASE_URL}/Cliente/list`,
        method: "GET",
        fallback: [],
      });
      const data = Array.isArray(response) ? response : [];
      set({ clients: data.map(mapApiToClient), loading: false });
    } catch (error) {
      console.error("Error loading clients", error);
      set({ loading: false });
    }
  },

  addClient: async (client) => {
    const payload = mapClientToApi(client);
    const created = await apiRequest<ApiClient>({
      url: `${API_BASE_URL}/Cliente/register`,
      method: "POST",
      data: payload,
      config: {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      },
      fallback: payload,
    });

    set((state) => ({
      clients: [
        ...state.clients,
        mapApiToClient(created ?? { ...payload, clienteId: Date.now() }),
      ],
    }));
  },

  updateClient: async (id, data) => {
    const payload = mapClientToApi({ ...data, id });
    const updated = await apiRequest<ApiClient>({
      // Backend usa mismo endpoint para crear/editar: id=0 crea, >0 actualiza
      url: `${API_BASE_URL}/Cliente/register`,
      method: "POST",
      data: payload,
      config: {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      },
      fallback: payload,
    });

    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? mapApiToClient(updated ?? payload) : c
      ),
    }));
  },

  deleteClient: async (id) => {
    const result = await apiRequest({
      url: `${API_BASE_URL}/Cliente/${id}`,
      method: "DELETE",
      config: { headers: { Accept: "*/*" } },
      fallback: true,
    });

    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    }));

    return result !== false;
  },
}));

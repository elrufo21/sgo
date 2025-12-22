import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import type { ApiClient, Client } from "@/types/customer";
import { create } from "zustand";

interface ClientsState {
  clients: Client[];
  loading: boolean;
  fetchClients: () => Promise<void>;
  addClient: (
    client: Omit<Client, "id">
  ) => Promise<{ ok: boolean; error?: string }>;
  updateClient: (
    id: number,
    data: Partial<Client>
  ) => Promise<{ ok: boolean; error?: string }>;
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

const parseExistsMessage = (payload: any): string | null => {
  if (typeof payload !== "string") return null;
  const lower = payload.toLowerCase();
  if (lower.includes("dni")) return "Ese DNI ya existe.";
  if (lower.includes("ruc")) return "Ese RUC ya existe.";
  if (lower.includes("existe")) return "El cliente ya existe.";
  return null;
};

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
    try {
      set({ loading: true });
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

      if (
        typeof created === "string" &&
        created.toLowerCase().includes("existe")
      ) {
        return { ok: false, error: parseExistsMessage(created) ?? undefined };
      }

      set((state) => ({
        clients: [
          ...state.clients,
          mapApiToClient(created ?? { ...payload, clienteId: Date.now() }),
        ],
      }));
      return { ok: true };
    } catch (error) {
      console.error("Error creating client", error);
      return { ok: false, error: "No se pudo crear el cliente." };
    } finally {
      set({ loading: false });
    }
  },

  updateClient: async (id, data) => {
    try {
      set({ loading: true });
      const payload = mapClientToApi({ ...data, id });
      const updated = await apiRequest<ApiClient>({
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

      if (
        typeof updated === "string" &&
        updated.toLowerCase().includes("existe")
      ) {
        return { ok: false, error: parseExistsMessage(updated) ?? undefined };
      }

      set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? mapApiToClient(updated ?? payload) : c
        ),
      }));
      return { ok: true };
    } catch (error) {
      console.error("Error updating client", error);
      return { ok: false, error: "No se pudo actualizar el cliente." };
    } finally {
      set({ loading: false });
    }
  },

  deleteClient: async (id) => {
    const result = await apiRequest({
      url: `${API_BASE_URL}/Cliente/${id}`,
      method: "DELETE",
      config: { headers: { Accept: "*/*" } },
      fallback: true,
    });

    if (result === false) {
      return false;
    }

    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    }));

    return result !== false;
  },
}));

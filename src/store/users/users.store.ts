import { create } from "zustand";

import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import type { User } from "../employees/employees.store";
import { toast } from "sonner";
export type { User } from "../employees/employees.store";

interface UsersState {
  users: User[];
  loading: boolean;

  fetchUsers: (estado?: "ACTIVO" | "INACTIVO" | "") => Promise<void>;
  addUser: (user: Omit<User, "UsuarioID">) => Promise<boolean>;
  updateUser: (id: number, data: Partial<User>) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
}

const mapApiToUser = (item: any): User => ({
  UsuarioID: item?.usuarioID ?? item?.UsuarioID ?? item?.id ?? 0,
  PersonalId: item?.personalId ?? item?.PersonalId ?? item?.personalID ?? 0,
  UsuarioAlias: item?.usuarioAlias ?? item?.UsuarioAlias ?? "",
  UsuarioClave: item?.usuarioClave ?? item?.UsuarioClave ?? "",
  UsuarioFechaReg: item?.usuarioFechaReg ?? item?.UsuarioFechaReg ?? "",
  UsuarioEstado: item?.usuarioEstado ?? item?.UsuarioEstado ?? "",
  UsuarioSerie: item?.usuarioSerie ?? item?.UsuarioSerie ?? "B001",
  EnviaBoleta: item?.enviaBoleta ?? item?.EnviaBoleta ?? 0,
  EnviarFactura: item?.enviarFactura ?? item?.EnviarFactura ?? 0,
  EnviaNC: item?.enviaNC ?? item?.EnviaNC ?? 0,
  EnviaND: item?.enviaND ?? item?.EnviaND ?? 0,
  Administrador: item?.administrador ?? item?.Administrador ?? 0,
  area: item?.area ?? item?.Area ?? "",
});

const isAliasDuplicateResponse = (result: unknown) => {
  const status =
    (result as any)?.status ?? (result as any)?.response?.status ?? null;

  if (status === 409) return true;

  const message =
    typeof result === "string"
      ? result
      : (result as any)?.message ?? (result as any)?.response?.data ?? "";

  return (
    typeof message === "string" &&
    message.toLowerCase().includes("alias de usuario ya existe")
  );
};

const mapUserToApiPayload = (user: Partial<User>) => ({
  usuarioID: user.UsuarioID ?? 0,
  personalId: user.PersonalId ?? 0,
  usuarioAlias: user.UsuarioAlias ?? "",
  usuarioClave: user.UsuarioClave ?? "",
  usuarioFechaReg: user.UsuarioFechaReg ?? new Date().toISOString(),
  usuarioEstado: user.UsuarioEstado ?? "ACTIVO",
});

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,

  fetchUsers: async (estado = "ACTIVO") => {
    set({ loading: true });

    try {
      const query =
        estado && estado.trim() !== ""
          ? `?estado=${encodeURIComponent(estado)}`
          : "";
      const response = await apiRequest<any[]>({
        url: `${API_BASE_URL}/UsuariosCrud/list${query}`,
        method: "GET",
        fallback: [],
      });

      const parsed = Array.isArray(response) ? response : [];
      set({ users: parsed.map(mapApiToUser) });
    } catch (err) {
      console.error("Error loading users", err);
    } finally {
      set({ loading: false });
    }
  },

  addUser: async (newUser) => {
    try {
      const payload = mapUserToApiPayload({ ...newUser, UsuarioID: 0 });

      const created = await apiRequest<any>({
        url: `${API_BASE_URL}/UsuariosCrud/register`,
        method: "POST",
        data: payload,
        config: {
          headers: {
            Accept: "text/plain",
            "Content-Type": "application/json",
          },
        },
        fallback: null,
      });

      if (isAliasDuplicateResponse(created)) {
        toast.error("El alias de usuario ya existe.");
        return false;
      }

      if (created === null || created === false) {
        return false;
      }

      await get().fetchUsers();
      return true;
    } catch (err) {
      console.error("Error creating user", err);
      return false;
    }
  },

  updateUser: async (id, data) => {
    try {
      const payload = mapUserToApiPayload({ ...data, UsuarioID: id });

      const updated = await apiRequest<any>({
        url: `${API_BASE_URL}/UsuariosCrud/${id}`,
        method: "PUT",
        data: payload,
        config: {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
          },
        },
        fallback: null,
      });

      if (isAliasDuplicateResponse(updated)) {
        toast.error("El alias de usuario ya existe.");
        return false;
      }

      if (updated === null || updated === false) {
        return false;
      }

      await get().fetchUsers();
      return true;
    } catch (err) {
      console.error("Error updating user", err);
      return false;
    }
  },

  deleteUser: async (id) => {
    try {
      const result = await apiRequest({
        url: `${API_BASE_URL}/UsuariosCrud/${id}`,
        method: "DELETE",
        config: {
          headers: {
            Accept: "*/*",
          },
        },
        fallback: null,
      });

      if (result === false) {
        return false;
      }

      set((state) => ({
        users: state.users.filter((u) => String(u.UsuarioID) !== String(id)),
      }));

      return true;
    } catch (err) {
      console.error("Error deleting user", err);
      return false;
    }
  },
}));

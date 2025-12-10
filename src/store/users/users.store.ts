import { create } from "zustand";
import type { User } from "../employees/employees.store";
import { apiRequest } from "@/shared/helpers/apiRequest";

interface UsersState {
  users: User[];
  loading: boolean;

  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, "UsuarioID">) => void;
  updateUser: (id: number, data: Partial<User>) => void;
  deleteUser: (id: number) => void;
}

const LOCAL_MOCK_USERS: User[] = [
  {
    UsuarioID: 1,
    PersonalId: 1,
    UsuarioAlias: "andre",
    UsuarioClave: "HASH123...",
    UsuarioFechaReg: "2021-08-01 12:49:45.833",
    UsuarioEstado: "ACTIVO",
    UsuarioSerie: "B001",
    EnviaBoleta: 1,
    EnviarFactura: 1,
    EnviaNC: 0,
    EnviaND: 0,
    Administrador: 1,
  },
  {
    UsuarioID: 2,
    PersonalId: 2,
    UsuarioAlias: "joaquin",
    UsuarioClave: "HASH456...",
    UsuarioFechaReg: "2022-07-15 13:52:09.447",
    UsuarioEstado: "ACTIVO",
    UsuarioSerie: "B001",
    EnviaBoleta: 1,
    EnviarFactura: 1,
    EnviaNC: 0,
    EnviaND: 0,
    Administrador: 0,
  },
];

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });

    try {
      const response = await apiRequest<User[]>({
        url: "/users",
        method: "GET",
        fallback: LOCAL_MOCK_USERS,
      });

      console.log("Users loaded:", response);

      set({ users: response.data, loading: false });
    } catch (err) {
      console.warn("⚠️ Error inesperado → fallback", err);

      set({ users: LOCAL_MOCK_USERS, loading: false });
    }
  },

  addUser: (newUser) =>
    set((state) => {
      const newId =
        state.users.length > 0
          ? Math.max(...state.users.map((u) => u.UsuarioID)) + 1
          : 1;

      return {
        users: [...state.users, { ...newUser, UsuarioID: newId }],
      };
    }),

  updateUser: (id, data) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.UsuarioID === id ? { ...u, ...data } : u
      ),
    })),

  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.UsuarioID !== id),
    })),
}));

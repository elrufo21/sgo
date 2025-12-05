import { create } from "zustand";
import type { User } from "../employees/employees.store";

interface UsersState {
  users: User[];
  loading: boolean;

  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: number, data: Partial<User>) => void;
  deleteUser: (id: number) => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    if (get().users.length > 0) return;

    set({ loading: true });

    try {
      const response: User[] = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              {
                id: 1,
                staff: "Jose Migue",
                area: "Human Resources",
                username: "jdoe",
                password: "123456",
                status: "activo",
              },
              {
                id: 2,
                staff: "Gustavo Cerati",
                area: "Logistics",
                username: "asmith",
                password: "qwerty",
                status: "inactivo",
              },
            ]),
          500
        )
      );

      set({ users: response, loading: false });
    } catch (error) {
      console.error("Error loading users", error);
      set({ loading: false });
    }
  },

  addUser: (user) =>
    set((state) => {
      const newId =
        state.users.length > 0
          ? Math.max(...state.users.map((u) => u.id)) + 1
          : 1;

      return { users: [...state.users, { ...user, id: newId }] };
    }),

  updateUser: (id, data) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    })),

  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),
}));

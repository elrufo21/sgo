import type { Employee } from "@/types/employees";
import { create } from "zustand";

interface EmployeesState {
  employees: Employee[];
  loading: boolean;

  fetchEmployees: () => Promise<void>;
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (id: number, data: Partial<Employee>) => void;
  deleteEmployee: (id: number) => void;
}

export const useEmployeesStore = create<EmployeesState>((set, get) => ({
  employees: [],
  loading: false,

  fetchEmployees: async () => {
    if (get().employees.length > 0) return;

    set({ loading: true });

    try {
      const response: Employee[] = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              {
                id: 1,
                company: "Empresa A",
                area: "Administración",
                code: "EMP001",
                password: "123456",

                nombres: "Carlos",
                apellidos: "Ramírez",

                ruc: "20123456789",
                dni: "87654321",

                direccion: "Av. Arequipa 123",
                fechaNacimiento: "1990-05-12",

                telefonoMovil: "987654321",
                telefonoAsignado: "912345678",

                correo: "carlos@empresa.com",

                fechaIngreso: "2024-01-01",
                fechaBaja: "",

                estado: "activo",

                foto: "",
              },
            ]),
          600
        )
      );

      set({ employees: response, loading: false });
    } catch (error) {
      console.error("Error loading employees", error);
      set({ loading: false });
    }
  },

  addEmployee: (employee) =>
    set((state) => {
      const newId =
        state.employees.length > 0
          ? Math.max(...state.employees.map((e) => e.id)) + 1
          : 1;

      return {
        employees: [...state.employees, { ...employee, id: newId }],
      };
    }),

  updateEmployee: (id, data) =>
    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === id ? { ...e, ...data } : e
      ),
    })),

  deleteEmployee: (id) =>
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    })),
}));

export interface User {
  id: number;
  staff: string;
  area: string;
  username: string;
  password: string;
  confirmPassword?: string;
  status: "activo" | "inactivo";
}

import { useEmployeesStore } from "@/store/employees/employees.store";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useCategoriesQuery } from "@/features/maintenance/categories/useCategoriesQuery";
import { useAreasQuery } from "@/features/maintenance/areas/useAreasQuery";
import { useProvidersQuery } from "@/features/maintenance/providers/useProvidersQuery";
import { useHolidaysQuery } from "@/features/maintenance/holidays/useHolidaysQuery";
import { useClientsStore } from "@/store/customers/customers.store";
import { employeeListConfig } from "@/features/maintenance/employees/employee.list.config";
import { categoryListConfig } from "@/features/maintenance/categories/categories.list.config";
import { areaListConfig } from "@/features/maintenance/areas/area.list.config";
import { providerListConfig } from "@/features/maintenance/providers/provider.list.config";
import { holidaysListConfig } from "@/features/maintenance/holidays/holidays.list.config";
import { customerListConfig } from "@/features/customers/customer.list.config";
import type { ModuleListConfig } from "@/shared/config/listConfig";

type ListDeps<T> = {
  data: T[];
  fetchData: () => Promise<void> | void;
  deleteItem: (id: number) => Promise<boolean | void> | void;
};

type ListModuleEntry<T> = {
  config: ModuleListConfig<T>;
  useDeps: () => ListDeps<T>;
};

export const listRegistry = {
  employees: {
    config: employeeListConfig,
    useDeps: () => {
      const { employees, fetchEmployees, deleteEmployee } =
        useEmployeesStore();
      return {
        data: employees,
        fetchData: fetchEmployees,
        deleteItem: deleteEmployee,
      };
    },
  } satisfies ListModuleEntry<any>,

  categories: {
    config: categoryListConfig,
    useDeps: () => {
      const { deleteCategory } = useMaintenanceStore();
      const { data = [], refetch } = useCategoriesQuery();
      return {
        data,
        fetchData: refetch,
        deleteItem: deleteCategory,
      };
    },
  } satisfies ListModuleEntry<any>,

  areas: {
    config: areaListConfig,
    useDeps: () => {
      const { deleteArea } = useMaintenanceStore();
      const { data = [], refetch } = useAreasQuery();
      return {
        data,
        fetchData: refetch,
        deleteItem: deleteArea,
      };
    },
  } satisfies ListModuleEntry<any>,

  providers: {
    config: providerListConfig,
    useDeps: () => {
      const { deleteProvider } = useMaintenanceStore();
      const { data = [], refetch } = useProvidersQuery();
      return {
        data,
        fetchData: refetch,
        deleteItem: deleteProvider,
      };
    },
  } satisfies ListModuleEntry<any>,

  holidays: {
    config: holidaysListConfig,
    useDeps: () => {
      const { deleteHoliday } = useMaintenanceStore();
      const { data = [], refetch } = useHolidaysQuery();
      return {
        data,
        fetchData: refetch,
        deleteItem: deleteHoliday,
      };
    },
  } satisfies ListModuleEntry<any>,

  customers: {
    config: customerListConfig,
    useDeps: () => {
      const { clients, fetchClients, deleteClient } = useClientsStore();
      return {
        data: clients,
        fetchData: fetchClients,
        deleteItem: deleteClient,
      };
    },
  } satisfies ListModuleEntry<any>,
} as const;

export type ListModuleKey = keyof typeof listRegistry;

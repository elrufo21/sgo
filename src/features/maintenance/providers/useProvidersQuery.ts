import { useQuery } from "@tanstack/react-query";
import { providersQueryKey, fetchProvidersApi } from "./providers.api";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

export function useProvidersQuery() {
  const setProviders = useMaintenanceStore((s) => s.setProviders);

  return useQuery({
    queryKey: providersQueryKey,
    queryFn: fetchProvidersApi,
    staleTime: 1000 * 60,
    onSuccess: (data) => setProviders(data ?? []),
  });
}

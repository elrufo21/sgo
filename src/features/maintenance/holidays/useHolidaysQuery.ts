import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

export function useHolidaysQuery() {
  const holidays = useMaintenanceStore((s) => s.holidays);

  const refetch = async () => {
    // Local-only: no remote fetch.
    return holidays;
  };

  return {
    data: holidays,
    refetch,
  };
}

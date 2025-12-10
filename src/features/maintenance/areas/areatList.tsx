import { CrudList } from "@/components/ListView";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

const AreaList = () => {
  const { areas, fetchAreas, deleteArea } = useMaintenanceStore();

  return (
    <CrudList
      data={areas}
      fetchData={fetchAreas}
      deleteItem={deleteArea}
      columns={[{ key: "area", header: "Área" }]}
      basePath="/maintenance/areas"
    />
  );
};

export default AreaList;

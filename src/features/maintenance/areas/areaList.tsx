import { CrudList } from "@/components/ListView";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useAreasQuery } from "./useAreasQuery";

const AreaList = () => {
  const { deleteArea } = useMaintenanceStore();
  const { data = [], refetch } = useAreasQuery();
  console.log("data", data);
  return (
    <CrudList
      data={data}
      fetchData={refetch}
      deleteItem={deleteArea}
      columns={[{ key: "area", header: "Área" }]}
      basePath="/maintenance/areas"
    />
  );
};

export default AreaList;

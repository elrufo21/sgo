import { CrudList } from "@/components/ListView";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useCategoriesQuery } from "./useCategoriesQuery";

const CategoryList = () => {
  const { deleteCategory } = useMaintenanceStore();
  const { data = [], refetch } = useCategoriesQuery();

  const categoryColumns = [
    { key: "nombreSublinea", header: "Nombre sublínea" },
    { key: "codigoSunat", header: "Código SUNAT" },
  ];

  return (
    <CrudList
      data={data}
      fetchData={refetch}
      deleteItem={deleteCategory}
      columns={categoryColumns}
      basePath="/maintenance/categories"
      idKey="id"
      createLabel="+ Añadir categoría"
      deleteMessage="¿Seguro deseas eliminar esta categoría?"
    />
  );
};

export default CategoryList;

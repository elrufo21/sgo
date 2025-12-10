import { CrudList } from "@/components/ListView";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

const CategoryList = () => {
  const { categories, fetchCategories, deleteCategory } = useMaintenanceStore();

  const categoryColumns = [
    { key: "nombreSublinea", header: "Nombre sublínea" },
    { key: "codigoSunat", header: "Código SUNAT" },
  ];

  return (
    <CrudList
      data={categories}
      fetchData={fetchCategories}
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

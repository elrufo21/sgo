import { CrudList } from "@/components/ListView";
import { useProductsStore } from "@/store/products/products.store";
import type { Product } from "@/types/product";

const ProductList = () => {
  const { products, fetchProducts, deleteProduct } = useProductsStore();

  const productColumns = [
    { key: "codigo", header: "Código" },
    { key: "nombre", header: "Nombre" },
    { key: "cantidad", header: "Stock" },
    {
      key: "preVenta",
      header: "Precio",
      render: (row: Product) => `S/ ${Number(row.preVenta).toFixed(2)}`,
    },
  ];

  return (
    <CrudList
      data={products}
      fetchData={fetchProducts}
      deleteItem={deleteProduct}
      columns={productColumns}
      basePath="/products"
      createLabel="+ Añadir producto"
      deleteMessage="¿Estás seguro de eliminar este producto?"
    />
  );
};

export default ProductList;

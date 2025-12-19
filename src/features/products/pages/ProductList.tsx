import { CrudList } from "@/components/ListView";
import { useProductsStore } from "@/store/products/products.store";
import type { Product } from "@/types/product";

const ProductList = () => {
  const { products, fetchProducts, deleteProduct } = useProductsStore();

  const productColumns = [
    { key: "codigo", header: "Código" },
    { key: "nombre", header: "Nombre" },
    {
      key: "cantidad",
      header: "Stock",

      render: (row: Product) => {
        const stock = Number(row.cantidad ?? 0);
        const critico = Number(row.valorCritico ?? 0);
        const color =
          stock <= 0
            ? "text-red-600 font-bold"
            : stock <= critico
            ? "text-blue-600 font-bold"
            : "";
        return <span className={`${color} text-right w-full`}>{stock}</span>;
      },
      tdClassName: "text-right",
    },
    { key: "unidadMedida", header: "Unidad. M" },
    {
      key: "preVenta",
      header: "Precio",
      render: (row: Product) => `S/ ${Number(row.preVenta).toFixed(2)}`,
      tdClassName: "text-right",
    },
    {
      key: "preCosto",
      header: "Costo",
      render: (row: Product) => `S/ ${Number(row.preCosto).toFixed(2)}`,
      tdClassName: "text-right",
    },
  ];
  console.log("products", products);
  return (
    <CrudList
      data={products}
      fetchData={fetchProducts}
      deleteItem={deleteProduct}
      columns={productColumns}
      filterKeys={["codigo", "nombre", "cantidad", "preVenta"]}
      basePath="/products"
      createLabel="+ Añadir producto"
      deleteMessage="¿Estás seguro de eliminar este producto?"
    />
  );
};

export default ProductList;

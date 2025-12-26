import { useEffect, useState, useCallback } from "react";
import { CrudList } from "@/components/ListView";
import { useProductsStore } from "@/store/products/products.store";
import type { Product } from "@/types/product";

const ProductList = () => {
  const { products, fetchProducts, deleteProduct } = useProductsStore();
  const [estadoFilter, setEstadoFilter] = useState<"ACTIVO" | "INACTIVO">(
    "ACTIVO"
  );

  const fetchFiltered = useCallback(
    () => fetchProducts(estadoFilter),
    [fetchProducts, estadoFilter]
  );

  useEffect(() => {
    fetchFiltered();
  }, [fetchFiltered]);

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
      fetchData={fetchFiltered}
      deleteItem={deleteProduct}
      columns={productColumns}
      filterKeys={["codigo", "nombre", "cantidad", "preVenta"]}
      basePath="/products"
      createLabel="Añadir producto"
      deleteMessage="¿Estás seguro de eliminar este producto?"
      renderFilters={
        <div className="flex items-center gap-2">
          <select
            value={estadoFilter}
            onChange={(e) =>
              setEstadoFilter(e.target.value as "ACTIVO" | "INACTIVO")
            }
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>
      }
    />
  );
};

export default ProductList;

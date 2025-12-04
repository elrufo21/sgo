import { createColumnHelper } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router";
import DataTable from "../../../components/DataTable";
import { useProductsStore } from "@/store/products/products.store";
import { useEffect } from "react";
import { Pencil, RecycleIcon, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ProductList = () => {
  const navigate = useNavigate();
  const { products, fetchProducts, deleteProduct } = useProductsStore();
  useEffect(() => {
    fetchProducts();
  }, []);
  const columnHelper = createColumnHelper();

  const productColumns = [
    columnHelper.accessor("codigo", {
      header: "Código",
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor("nombre", {
      header: "Nombre",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("cantidad", {
      header: "Stock",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("preVenta", {
      header: "Precio",
      cell: (info) => `S/ ${Number(info.getValue()).toFixed(2)}`,
    }),
    columnHelper.accessor("id", {
      header: "Acciones",
      cell: (info) => {
        const id = info.getValue();
        return (
          <div className="flex gap-2">
            <Link
              to={`/products/${id}/edit`}
              className="text-blue-600 hover:underline"
            >
              <Pencil color="green" />
            </Link>

            {/* Eliminar */}
            <button
              onClick={() => {
                if (confirm("¿Estás seguro de eliminar este producto?")) {
                  deleteProduct(id);
                  toast.success("Producto eliminado correctamente.");
                }
              }}
              className="text-red-600 hover:text-red-800 cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        );
      },
    }),
  ];

  return (
    <div>
      <div className=" w-full h-16 flex mb-5">
        <button
          className="bg-slate-600 text-white px-4 py-2 rounded cursor-pointer"
          onClick={() => {
            navigate(`/products/create`);
          }}
        >
          Añadir producto
        </button>
      </div>
      <DataTable
        data={products}
        columns={productColumns}
        // onRowClick={(row) => navigate(`/products/${row.id}/edit`)}
      />
    </div>
  );
};

export default ProductList;

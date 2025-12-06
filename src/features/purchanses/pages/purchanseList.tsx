import DataTable from "@/components/DataTable";
import { usePurchasesStore } from "@/store/purchanses/purchase.store";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

const PurchanseList = () => {
  const { purchases, fetchPurchases, deletePurchase } = usePurchasesStore();
  useEffect(() => {
    fetchPurchases();
  }, []);
  const navigate = useNavigate();
  const columnHelper = createColumnHelper();
  const columns = [
    columnHelper.accessor("id", {
      header: "Id",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("nombreRazon", {
      header: "Nombre o Razon social",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("celular", {
      header: "Telefono",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("id", {
      header: "Acciones",
      cell: (info) => {
        const id = info.getValue();
        return (
          <div className="flex gap-2">
            <Link
              to={`/purchases/${id}/edit`}
              className="text-blue-600 hover:underline"
            >
              <Pencil color="green" />
            </Link>

            <button
              onClick={() => {
                if (confirm("¿Estás seguro de eliminar este producto?")) {
                  deletePurchase(id);
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
            navigate(`/purchases/create`);
          }}
        >
          Añadir
        </button>{" "}
      </div>{" "}
      <DataTable columns={columns} data={purchases} />
    </div>
  );
};

export default PurchanseList;

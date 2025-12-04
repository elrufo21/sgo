import DataTable from "@/components/DataTable";
import { useClientsStore } from "@/store/customers/customers.store";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

const CustomerList = () => {
  const { clients, fetchClients, deleteClient } = useClientsStore();
  useEffect(() => {
    fetchClients();
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
    columnHelper.accessor("telefonoMovil", {
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
              to={`/customers/${id}/edit`}
              className="text-blue-600 hover:underline"
            >
              <Pencil color="green" />
            </Link>

            <button
              onClick={() => {
                if (confirm("¿Estás seguro de eliminar este producto?")) {
                  deleteClient(id);
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
            navigate(`/customers/create`);
          }}
        >
          Añadir cliente
        </button>{" "}
      </div>{" "}
      <DataTable columns={columns} data={clients} />
    </div>
  );
};

export default CustomerList;

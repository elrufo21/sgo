import DataTable from "@/components/DataTable";
import { useEmployeesStore } from "@/store/employees/employees.store";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

const EmployeeList = () => {
  const { employees, fetchEmployees, deleteEmployee } = useEmployeesStore();
  useEffect(() => {
    fetchEmployees();
  }, []);
  const navigate = useNavigate();
  const columnHelper = createColumnHelper();
  const columns = [
    columnHelper.accessor("id", {
      header: "Id",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor((row) => `${row.nombres} ${row.apellidos}`, {
      id: "nombreCompleto",
      header: "Nombres",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("telefonoMovil", {
      header: "Telefono",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("correo", {
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
              to={`/employees/${id}/edit`}
              className="text-blue-600 hover:underline"
            >
              <Pencil color="green" />
            </Link>

            <button
              onClick={() => {
                if (confirm("¿Estás seguro de eliminar este producto?")) {
                  deleteEmployee(id);
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
            navigate(`/employees/create`);
          }}
        >
          Añadir empleado
        </button>{" "}
      </div>{" "}
      <DataTable columns={columns} data={employees} />
    </div>
  );
};

export default EmployeeList;

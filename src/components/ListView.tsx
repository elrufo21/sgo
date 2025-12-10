import { type ReactNode, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import DataTable from "@/components/DataTable";
import { Pencil, PlusIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createColumnHelper } from "@tanstack/react-table";
import ButtonComponent from "./inputs/addButton";

interface ColumnConfig<T> {
  key?: keyof T;
  header: string;
  id?: string;
  render?: (row: T) => ReactNode;
}

interface CrudListProps<T> {
  data: T[];
  fetchData: () => Promise<void> | void;
  deleteItem: (id: number) => Promise<void> | void;
  basePath: string;
  columns: ColumnConfig<T>[];
  idKey?: keyof T & string;
  createLabel?: string;
  deleteMessage?: string;
}

export function CrudList<T>({
  data,
  fetchData,
  deleteItem,
  basePath,
  columns,
  idKey = "id",
  createLabel = "+ Nuevo",
  deleteMessage = "¿Seguro que deseas eliminar este elemento?",
}: CrudListProps<T>) {
  const navigate = useNavigate();
  const columnHelper = createColumnHelper<T>();

  useEffect(() => {
    fetchData();
  }, []);

  const tableColumns = [
    ...columns.map((col) => {
      if (col.render) {
        return columnHelper.display({
          id: col.id ?? col.header,
          header: col.header,
          cell: ({ row }) => col.render!(row.original),
        });
      }

      if (col.key) {
        return columnHelper.accessor(col.key as any, {
          header: col.header,
          cell: (info) => info.getValue(),
        });
      }

      return columnHelper.display({
        id: col.id ?? col.header,
        header: col.header,
        cell: () => null,
      });
    }),

    columnHelper.display({
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const rowData = row.original as Record<string, unknown>;
        const rawId = rowData[idKey];
        const id =
          typeof rawId === "number"
            ? rawId
            : typeof rawId === "string"
            ? Number(rawId)
            : undefined;
        if (typeof id !== "number" || Number.isNaN(id)) return null;

        return (
          <div className="flex gap-3">
            <Link to={`${basePath}/${id}/edit`}>
              <Pencil className="text-green-600" />
            </Link>

            <button
              onClick={() => {
                if (confirm(deleteMessage)) {
                  deleteItem(id);
                  toast.success("Elemento eliminado.");
                }
              }}
            >
              <Trash2 className="text-red-600 hover:text-red-800" />
            </button>
          </div>
        );
      },
    }),
  ];

  return (
    <div>
      <div className="w-full  flex mb-5">
        <ButtonComponent
          icon={<PlusIcon />}
          onClick={() => navigate(`${basePath}/create`)}
          variant="outlined"
          color="success"
        >
          Nuevo
        </ButtonComponent>
      </div>

      <DataTable data={data} columns={tableColumns} />
    </div>
  );
}

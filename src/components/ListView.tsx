import { type ReactNode, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import DataTable from "@/components/DataTable";
import { Pencil, PlusIcon, Trash2 } from "lucide-react";
import { toast } from "@/shared/ui/toast";
import { createColumnHelper } from "@tanstack/react-table";
import { useDialogStore } from "@/store/app/dialog.store";
import { BackArrowButton } from "@/components/common/BackArrowButton";

interface ColumnConfig<T> {
  key?: keyof T;
  header: string;
  id?: string;
  render?: (row: T) => ReactNode;
  tdClassName?: string | ((row: T) => string | undefined);
}

export interface CrudListConfig<T> {
  basePath: string;
  columns: ColumnConfig<T>[];
  idKey?: keyof T & string;
  createLabel?: string;
  deleteMessage?: string;
  filterKeys?: (keyof T & string)[];
  renderFilters?: React.ReactNode;
  onCreate?: () => void;
  onEdit?: (row: T, id: number) => void;
}

interface CrudListProps<T> {
  data: T[];
  fetchData: () => Promise<unknown> | void;
  deleteItem: (id: number) => Promise<boolean | void> | boolean | void;
  basePath: string;
  columns: ColumnConfig<T>[];
  idKey?: keyof T & string;
  createLabel?: string;
  deleteMessage?: string;
  filterKeys?: (keyof T & string)[];
  renderFilters?: React.ReactNode;
  onCreate?: () => void;
  onEdit?: (row: T, id: number) => void;
}

export function CrudList<T>(props: CrudListProps<T>) {
  const {
    data,
    fetchData,
    deleteItem,
    basePath,
    columns,
    idKey = "id",
    createLabel = "Nuevo",
    deleteMessage = "¿Seguro que deseas eliminar este elemento?",
    filterKeys,
    renderFilters,
    onCreate,
    onEdit,
  } = props;

  const openDialog = useDialogStore((s) => s.openDialog);
  const navigate = useNavigate();
  const columnHelper = createColumnHelper<T>();
  const isMaintenanceList = basePath.startsWith("/maintenance/");
  const maintenanceSegment = basePath.split("/").filter(Boolean)[1] ?? "";
  const maintenanceTitleBySegment: Record<string, string> = {
    categories: "Categorías",
    areas: "Áreas",
    providers: "Proveedores",
    holidays: "Feriados",
    computers: "Computadoras",
    employees: "Empleados",
    users: "Usuarios",
  };
  const maintenanceTitle =
    maintenanceTitleBySegment[maintenanceSegment] ?? "Mantenimiento";
  const maintenanceFallbackTo = basePath.startsWith("/maintenance")
    ? "/maintenance"
    : undefined;

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tableColumns = [
    ...columns.map((col) => {
      if (col.render) {
        return columnHelper.display({
          id: col.id ?? col.header,
          header: col.header,
          cell: ({ row }) => col.render!(row.original),
          meta: { tdClassName: col.tdClassName },
        });
      }

      if (col.key) {
        return columnHelper.accessor(col.key as any, {
          header: col.header,
          cell: (info) => info.getValue(),
          meta: { tdClassName: col.tdClassName },
        });
      }

      return columnHelper.display({
        id: col.id ?? col.header,
        header: col.header,
        cell: () => null,
        meta: { tdClassName: col.tdClassName },
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

        const askDelete = () =>
          openDialog({
            title: "Eliminar",
            content: <p>{deleteMessage}</p>,
            onConfirm: async () => {
              try {
                const result = await deleteItem(id);
                if (result === false) {
                  toast.error("No se pudo eliminar el registro.");
                  return;
                }
                toast.success("Elemento eliminado.");
              } catch (error) {
                console.error("Error deleting item", error);
                toast.error("Ocurrió un error al eliminar.");
              }
            },
          });

        return (
          <div className="flex gap-3">
            {onEdit ? (
              <button type="button" onClick={() => onEdit(row.original, id)}>
                <Pencil className="text-green-600" />
              </button>
            ) : (
              <Link to={`${basePath}/${id}/edit`}>
                <Pencil className="text-green-600" />
              </Link>
            )}

            <button onClick={askDelete}>
              <Trash2 className="text-red-600 hover:text-red-800" />
            </button>
          </div>
        );
      },
    }),
  ];

  return (
    <div>
      {isMaintenanceList ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <BackArrowButton
              fallbackTo={maintenanceFallbackTo}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            />
            <div className="leading-tight">
              <p className="text-xs font-semibold tracking-wide uppercase text-[#B23636]">
                Mantenimiento
              </p>
              <div className="flex items-end gap-2">
                <h1 className="text-2xl sm:text-4xl font-semibold text-[#0f2748]">
                  {maintenanceTitle}
                </h1>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-1" />
      )}

      <DataTable
        data={data}
        columns={tableColumns}
        filterKeys={filterKeys}
        toolbarLeading={
          !isMaintenanceList ? (
            <BackArrowButton
              fallbackTo={maintenanceFallbackTo}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            />
          ) : undefined
        }
        renderFilters={renderFilters}
        toolbarAction={
          <button
            type="button"
            onClick={() =>
              onCreate ? onCreate() : navigate(`${basePath}/create`)
            }
            title={createLabel}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#B23636] text-white hover:bg-[#96312a] transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        }
      />
    </div>
  );
}

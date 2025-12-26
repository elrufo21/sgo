import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDialogStore } from "@/store/app/dialog.store";

interface DataTableProps<T> {
  columns: any[];
  data: T[];
  onRowClick?: (row: T) => void;
  filterKeys?: (keyof T & string)[];
  tdClassName?: string | ((cell: any) => string | undefined);
  renderFilters?: ReactNode;
}

export default function DataTable<T>({
  columns,
  data,
  onRowClick,
  filterKeys,
  tdClassName,
  renderFilters,
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const previousDataLength = useRef(data?.length ?? 0);
  const dialogOpen = useDialogStore((s) => s.open);
  const previousDialogOpen = useRef(dialogOpen);

  const focusSearch = () => {
    const input = searchRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    const length = input.value?.length ?? 0;
    try {
      input.setSelectionRange(length, length);
    } catch {
      // ignore selection issues on non-text inputs
    }
  };

  useEffect(() => {
    focusSearch();
  }, []);

  const dataLength = data?.length ?? 0;
  useEffect(() => {
    if (dataLength < previousDataLength.current) {
      focusSearch();
    }
    previousDataLength.current = dataLength;
  }, [dataLength]);

  useEffect(() => {
    if (previousDialogOpen.current && !dialogOpen) {
      focusSearch();
    }
    previousDialogOpen.current = dialogOpen;
  }, [dialogOpen]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: (row, _columnId, filterValue) => {
      const term = String(filterValue ?? "")
        .toLowerCase()
        .trim();
      if (!term) return true;
      const keysToSearch =
        filterKeys && filterKeys.length > 0
          ? filterKeys
          : (Object.keys(row.original) as (keyof T & string)[]);
      return keysToSearch.some((key) => {
        const value = (row.original as Record<string, unknown>)[key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const totalCount = filteredRows.length;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  const goNext = () => {
    if (table.getCanNextPage()) {
      table.nextPage();
    } else {
      table.setPageIndex(0); // volver al inicio cuando no hay más páginas
    }
  };

  const goPrev = () => {
    if (table.getCanPreviousPage()) {
      table.previousPage();
    } else {
      const lastPage = Math.max(Math.ceil(totalCount / pageSize) - 1, 0);
      table.setPageIndex(lastPage);
    }
  };

  return (
    <div className="w-full border rounded-xl bg-white shadow p-4">
      {/* Filtros y buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <input
          ref={searchRef}
          placeholder="Buscar..."
          className="border px-3 py-2 rounded-lg w-full sm:flex-1"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
        {renderFilters && (
          <div className="flex-shrink-0 sm:w-auto w-full sm:max-w-[220px]">
            {renderFilters}
          </div>
        )}
      </div>

      {/* Tabla */}
      <table className="w-full border-collapse">
        <thead className="bg-gray-100 text-gray-700">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-3 text-left select-none cursor-pointer"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc" && "▲"}
                    {header.column.getIsSorted() === "desc" && "▼"}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b hover:bg-gray-50 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => {
                  const metaClass = cell.column.columnDef.meta?.tdClassName;
                  const colClass =
                    typeof metaClass === "function"
                      ? metaClass(row.original)
                      : metaClass ?? "";
                  const extraClass =
                    typeof tdClassName === "function"
                      ? tdClassName(cell) ?? ""
                      : tdClassName ?? "";
                  return (
                    <td
                      key={cell.id}
                      className={`p-3 ${colClass} ${extraClass}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="p-4 text-center text-gray-500"
              >
                No hay datos
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={goPrev}
          disabled={totalCount === 0}
        >
          Anterior
        </button>

        <span className="text-center flex-1">
          <strong>
            {end}/{totalCount}
          </strong>
        </span>

        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={goNext}
          disabled={totalCount === 0}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

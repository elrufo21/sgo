import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";

interface DataTableProps<T> {
  columns: any[];
  data: T[];
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  columns,
  data,
  onRowClick,
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = searchRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    const length = input.value?.length ?? 0;
    try {
      input.setSelectionRange(length, length);
    } catch {
      // ignore selection issues on non-text inputs
    }
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="w-full border rounded-xl bg-white shadow p-4">
      {/* Buscador */}
      <input
        ref={searchRef}
        placeholder="Buscar..."
        className="border px-3 py-2 rounded-lg mb-4 w-full"
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
      />

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
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
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
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </button>

        {/* 👇 SOLO TOTAL */}
        <span>
          <strong>{totalCount}</strong> registros
        </span>

        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

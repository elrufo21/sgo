import {
  type Cell,
  type ColumnDef,
  type RowData,
  useReactTable,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useDialogStore } from "@/store/app/dialog.store";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    tdClassName?: string | ((row: TData) => string | undefined);
    thClassName?: string;
    align?: "left" | "center" | "right";
  }
}

interface DataTableProps<T extends RowData> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  onRowClick?: (row: T) => void;
  filterKeys?: (keyof T & string)[];
  tdClassName?: string | ((cell: Cell<T, unknown>) => string | undefined);
  toolbarLeading?: ReactNode;
  renderFilters?: ReactNode;
  toolbarAction?: ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  stickyHeader?: boolean;
  tableMaxHeight?: string;
  globalFilterValue?: string;
  onGlobalFilterValueChange?: (value: string) => void;
  footerContent?: ReactNode;
  onFilteredDataChange?: (rows: T[]) => void;
}

const alignmentClass: Record<"left" | "center" | "right", string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const resolveAlignmentClass = (align?: "left" | "center" | "right") =>
  alignmentClass[align ?? "left"];

const resolveHeaderLabel = (header: unknown, fallback: string) => {
  if (typeof header === "string") return header;
  if (typeof header === "number") return String(header);
  return fallback;
};

const normalizeSearchText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getSearchableText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return normalizeSearchText(value);
  }
  if (Array.isArray(value)) {
    return value.map(getSearchableText).filter(Boolean).join(" ");
  }
  if (value instanceof Date) {
    return normalizeSearchText(value.toISOString());
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(getSearchableText)
      .filter(Boolean)
      .join(" ");
  }
  return normalizeSearchText(value);
};

const PAGE_SIZE_STORAGE_PREFIX = "sgo:datatable:pageSize:";

const toValidPageSize = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : null;
};

export default function DataTable<T extends RowData>({
  columns,
  data,
  onRowClick,
  filterKeys,
  tdClassName,
  toolbarLeading,
  renderFilters,
  toolbarAction,
  isLoading = false,
  emptyMessage = "No hay datos para mostrar.",
  searchPlaceholder = "Buscar en la tabla...",
  showSearch = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  stickyHeader = true,
  tableMaxHeight = "65vh",
  globalFilterValue,
  onGlobalFilterValueChange,
  footerContent,
  onFilteredDataChange,
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState(() =>
    String(globalFilterValue ?? ""),
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const previousDataLength = useRef(data?.length ?? 0);
  const previousFilteredRowsRef = useRef<T[] | null>(null);
  const dialogOpen = useDialogStore((s) => s.open);
  const previousDialogOpen = useRef(dialogOpen);
  const isGlobalFilterControlled = globalFilterValue !== undefined;

  const handleGlobalFilterChange = (value: string) => {
    setGlobalFilter(value);
    onGlobalFilterValueChange?.(value);
  };

  const handleSearchInput = (event: FormEvent<HTMLInputElement>) => {
    handleGlobalFilterChange(event.currentTarget.value);
  };

  useEffect(() => {
    if (!isGlobalFilterControlled) return;
    const nextValue = String(globalFilterValue ?? "");
    setGlobalFilter((previous) =>
      previous === nextValue ? previous : nextValue,
    );
  }, [globalFilterValue, isGlobalFilterControlled]);

  const filteredData = useMemo(() => {
    const term = normalizeSearchText(globalFilter);
    if (!term) return data;

    return data.filter((rowItem) => {
      const original = rowItem as Record<string, unknown>;
      const keysToSearch =
        filterKeys && filterKeys.length > 0
          ? filterKeys
          : (Object.keys(original) as (keyof T & string)[]);

      return keysToSearch.some((key) =>
        getSearchableText(original[key]).includes(term),
      );
    });
  }, [data, filterKeys, globalFilter]);

  useEffect(() => {
    if (!onFilteredDataChange) return;

    const previousRows = previousFilteredRowsRef.current;
    const sameRows =
      previousRows !== null &&
      previousRows.length === filteredData.length &&
      previousRows.every((row, index) => Object.is(row, filteredData[index]));

    if (sameRows) return;

    previousFilteredRowsRef.current = filteredData;
    onFilteredDataChange(filteredData);
  }, [filteredData, onFilteredDataChange]);

  const normalizedPageSizeOptions = Array.from(
    new Set(
      pageSizeOptions
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  ).sort((a, b) => a - b);

  const pageSizeStorageKey = `${PAGE_SIZE_STORAGE_PREFIX}${location.pathname}`;
  const persistedPageSize = useMemo(() => {
    if (typeof window === "undefined") return null;

    try {
      const stored = window.localStorage.getItem(pageSizeStorageKey);
      return toValidPageSize(stored);
    } catch {
      return null;
    }
  }, [pageSizeStorageKey]);

  const safeInitialPageSize = Math.max(1, Math.floor(initialPageSize));
  const fallbackPageSize = normalizedPageSizeOptions.includes(
    safeInitialPageSize,
  )
    ? safeInitialPageSize
    : (normalizedPageSizeOptions[0] ?? safeInitialPageSize);
  const safePageSize =
    persistedPageSize !== null &&
    normalizedPageSizeOptions.includes(persistedPageSize)
      ? persistedPageSize
      : fallbackPageSize;

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

  useEffect(() => {
    focusSearch();
  }, [location.pathname]);

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
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: safePageSize,
      },
    },
  });

  const totalCount = filteredData.length;
  const visibleRows = table.getRowModel().rows;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = Math.max(table.getPageCount(), 1);
  const pageSize = table.getState().pagination.pageSize;
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(pageSizeStorageKey, String(pageSize));
    } catch {
      // ignore storage errors
    }
  }, [pageSize, pageSizeStorageKey]);

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {toolbarLeading ? (
              <div className="shrink-0">{toolbarLeading}</div>
            ) : null}
            {showSearch ? (
              <div className="relative w-full xl:w-[34rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  autoFocus
                  placeholder={searchPlaceholder}
                  data-no-uppercase="true"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-9 text-sm text-slate-800 outline-none transition focus:border-[#B23636] focus:ring-2 focus:ring-[#B23636]/20"
                  value={globalFilter}
                  onChange={(e) => handleGlobalFilterChange(e.target.value)}
                  onInput={handleSearchInput}
                />
                {globalFilter ? (
                  <button
                    type="button"
                    onClick={() => handleGlobalFilterChange("")}
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
            {toolbarAction ? (
              <div className="shrink-0">{toolbarAction}</div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 xl:justify-end">
            {renderFilters ? <div className="">{renderFilters}</div> : null}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-600">
          <span className=""></span>
          {globalFilter ? <span></span> : <></>}
        </div>
      </div>

      <div className="space-y-3 px-3 py-3 md:hidden">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Cargando registros...
          </div>
        ) : visibleRows.length ? (
          visibleRows.map((row, rowIndex) => (
            <article
              key={row.id}
              className={`rounded-xl border border-slate-200 p-3 shadow-sm transition ${
                rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/55"
              } ${onRowClick ? "cursor-pointer active:bg-rose-50/45" : ""}`}
              onClick={() => onRowClick?.(row.original)}
              onKeyDown={(event) => {
                if (!onRowClick) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(row.original);
                }
              }}
              tabIndex={onRowClick ? 0 : -1}
            >
              <div className="space-y-2.5">
                {row.getVisibleCells().map((cell) => {
                  const metaClass = cell.column.columnDef.meta?.tdClassName;
                  const colClass =
                    typeof metaClass === "function"
                      ? metaClass(row.original)
                      : (metaClass ?? "");
                  const extraClass =
                    typeof tdClassName === "function"
                      ? (tdClassName(cell) ?? "")
                      : (tdClassName ?? "");
                  const align = cell.column.columnDef.meta?.align;
                  const label = resolveHeaderLabel(
                    cell.column.columnDef.header,
                    String(cell.column.id ?? "Campo"),
                  );

                  return (
                    <div
                      key={cell.id}
                      className="grid grid-cols-[minmax(6.5rem,38%)_1fr] items-start gap-2"
                    >
                      <span className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </span>
                      <div
                        className={`text-sm text-slate-700 ${resolveAlignmentClass(
                          align,
                        )} ${colClass} ${extraClass}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>

      <div
        className="hidden overflow-auto md:block"
        style={{ maxHeight: tableMaxHeight }}
      >
        <table className="w-full min-w-[44rem] border-collapse">
          <thead
            className={`bg-slate-50 text-xs uppercase tracking-wide text-slate-600 ${
              stickyHeader ? "sticky top-0 z-10" : ""
            }`}
          >
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-slate-200">
                {hg.headers.map((header) => {
                  const align = header.column.columnDef.meta?.align;
                  const thClass =
                    header.column.columnDef.meta?.thClassName ?? "";

                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 font-semibold ${resolveAlignmentClass(align)} ${thClass}`}
                      scope="col"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={Math.max(table.getAllLeafColumns().length, 1)}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  Cargando registros...
                </td>
              </tr>
            ) : visibleRows.length ? (
              visibleRows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-200 transition ${
                    rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/45"
                  } ${onRowClick ? "cursor-pointer hover:bg-rose-50/45" : ""}`}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={(event) => {
                    if (!onRowClick) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(row.original);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : -1}
                >
                  {row.getVisibleCells().map((cell) => {
                    const metaClass = cell.column.columnDef.meta?.tdClassName;
                    const colClass =
                      typeof metaClass === "function"
                        ? metaClass(row.original)
                        : (metaClass ?? "");
                    const extraClass =
                      typeof tdClassName === "function"
                        ? (tdClassName(cell) ?? "")
                        : (tdClassName ?? "");
                    const align = cell.column.columnDef.meta?.align;

                    return (
                      <td
                        key={cell.id}
                        className={`px-4 py-3 text-sm text-slate-700 ${resolveAlignmentClass(
                          align,
                        )} ${colClass} ${extraClass}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span>Filas por página:</span>
            <select
              className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none transition focus:border-[#B23636] focus:ring-2 focus:ring-[#B23636]/20"
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {normalizedPageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-slate-500">
              {start}-{end} de {totalCount}
            </span>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
            <span className="min-w-[7.5rem] text-center text-slate-700">
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="Primera página"
            >
              <ChevronFirst className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Siguiente página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() =>
                table.setPageIndex(Math.max(table.getPageCount() - 1, 0))
              }
              disabled={!table.getCanNextPage()}
              aria-label="Última página"
            >
              <ChevronLast className="h-4 w-4" />
            </button>
          </div>
        </div>

        {footerContent ? (
          <div className="mt-3 border-t border-slate-200 pt-3">
            {footerContent}
          </div>
        ) : null}
      </footer>
    </section>
  );
}

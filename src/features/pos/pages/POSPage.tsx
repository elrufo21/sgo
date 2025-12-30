import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import {
  CheckCircle2,
  LayoutGrid,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  ShoppingCart,
  TableProperties,
  Trash2,
} from "lucide-react";
import DataTable from "@/components/DataTable";
import { useProductsStore } from "@/store/products/products.store";
import { usePosStore, selectTotals } from "@/store/pos/pos.store";
import { useDialogStore } from "@/store/app/dialog.store";
import type { Product } from "@/types/product";
import type { PosCartItem } from "@/types/pos";
import { toast } from "sonner";

const columnHelper = createColumnHelper<Product>();
const PAGE_SIZE = 24;

const priceLabel = (product: Product) =>
  Number(product.preVenta ?? product.preVentaB ?? 0).toFixed(2);

const POSPage = () => {
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { products, fetchProducts, loading } = useProductsStore();
  const items = usePosStore((state) => state.items);
  const totals = usePosStore(selectTotals);
  const addProduct = usePosStore((state) => state.addProduct);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const updatePrice = usePosStore((state) => state.updatePrice);
  const removeItem = usePosStore((state) => state.removeItem);
  const clearCart = usePosStore((state) => state.clearCart);
  const openDialog = useDialogStore((state) => state.openDialog);
  const isCardsView = viewMode === "cards";
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!products.length) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  const getOutOfStockItems = () =>
    items.filter((item) => {
      const stock =
        typeof item.stock === "number" ? Math.max(item.stock, 0) : undefined;
      if (stock === undefined) return false;
      return (item.cantidad ?? 0) > stock || stock <= 0;
    });

  const goToPayment = () => {
    if (!items.length) {
      toast.error("Agrega productos antes de procesar");
      return;
    }

    const outOfStockItems = getOutOfStockItems();
    if (outOfStockItems.length) {
      openDialog({
        title: "Stock insuficiente",
        content: (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              Estás añadiendo productos sin stock suficiente:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-800 max-h-40 overflow-auto">
              {outOfStockItems.map((item) => (
                <li key={item.productId}>
                  {item.nombre} — stock: {Math.max(item.stock ?? 0, 0)},
                  carrito: {item.cantidad}
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-700">
              ¿Deseas continuar de todos modos?
            </p>
          </div>
        ),
        confirmText: "Continuar",
        cancelText: "Cancelar",
        onConfirm: () => navigate("/pos/payment"),
      });
      return;
    }

    navigate("/pos/payment");
  };

  const handleAddProduct = (product: Product) => {
    const available = Number(product.cantidad ?? 0);
    if (!Number.isFinite(available) || available <= 0) {
      openDialog({
        title: "Sin stock",
        content: (
          <p className="text-sm text-slate-700">
            {product.nombre} no tiene stock disponible. ¿Deseas agregarlo de
            todos modos?
          </p>
        ),
        confirmText: "Agregar",
        cancelText: "Cancelar",
        onConfirm: () => {
          addProduct(product, 1);
          toast.success(`${product.nombre} agregado al carrito`, {
            duration: 1200,
          });
        },
      });
      return;
    }

    addProduct(product, 1);
    toast.success(`${product.nombre} agregado al carrito`, {
      duration: 1200,
    });
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (term.length < 2) return products;
    return products.filter(
      (p) =>
        p.codigo?.toLowerCase().includes(term) ||
        p.nombre?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const visibleProducts = useMemo(() => {
    if (viewMode !== "cards") return filteredProducts;
    return filteredProducts.slice(0, page * PAGE_SIZE);
  }, [filteredProducts, page, viewMode]);

  const hasMoreProducts =
    viewMode === "cards" && visibleProducts.length < filteredProducts.length;

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!isCardsView || !hasMoreProducts) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { root: null, rootMargin: "200px 0px 200px 0px", threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreProducts, isCardsView]);

  const handleQuantityChange = (item: PosCartItem, delta: number) => {
    const desired = Math.max(1, (item.cantidad ?? 0) + delta);
    updateQuantity(item.productId, desired);
  };

  const handleManualQuantity = (item: PosCartItem, value: string) => {
    if (value === "") {
      updateQuantity(item.productId, 0);
      return;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const next = Math.max(1, parsed);
    updateQuantity(item.productId, next);
  };

  const handlePriceChange = (item: PosCartItem, value: string) => {
    setPriceDrafts((prev) => ({ ...prev, [item.productId]: value }));

    if (value.trim() === "") {
      updatePrice(item.productId, 0);
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) return;

    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    updatePrice(item.productId, Math.max(0, parsed));
  };

  useEffect(() => {
    setPriceDrafts((prev) => {
      const next: Record<number, string> = {};
      items.forEach((item) => {
        next[item.productId] =
          prev[item.productId] ?? (item.precio?.toString() ?? "");
      });
      return next;
    });
  }, [items]);

  const confirmClear = () =>
    openDialog({
      title: "Vaciar carrito",
      content: <p>¿Seguro que deseas eliminar todos los ítems del carrito?</p>,
      onConfirm: () => {
        clearCart();
        toast.success("Carrito limpiado");
      },
      confirmText: "Vaciar",
      cancelText: "Cancelar",
    });

  const productColumns = [
    columnHelper.accessor("codigo", {
      header: "Código",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("nombre", {
      header: "Nombre",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "precio",
      header: "P. Venta",
      cell: ({ row }) => (
        <span className="font-semibold text-right block">
          S/ {priceLabel(row.original)}
        </span>
      ),
      meta: { tdClassName: "text-right" },
    }),
    columnHelper.display({
      id: "stock",
      header: "Stock",
      cell: ({ row }) => (
        <span className="text-right block">
          {Number(row.original.cantidad ?? 0)}
        </span>
      ),
      meta: { tdClassName: "text-right" },
    }),
    columnHelper.display({
      id: "action",
      header: "",
      cell: ({ row }) => (
        <button
          className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors text-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleAddProduct(row.original);
          }}
        >
          <Plus className="w-4 h-4" />
          Añadir
        </button>
      ),
      meta: { tdClassName: "text-right" },
    }),
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div></div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border bg-gray-50 overflow-hidden">
                <button
                  className={`flex items-center gap-1 px-3 py-1 text-sm ${
                    viewMode === "cards"
                      ? "bg-slate-700 text-white"
                      : "text-slate-700"
                  }`}
                  onClick={() => setViewMode("cards")}
                  title="Ver como cards"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Cards
                </button>
                <button
                  className={`flex items-center gap-1 px-3 py-1 text-sm ${
                    viewMode === "table"
                      ? "bg-slate-700 text-white"
                      : "text-slate-700"
                  }`}
                  onClick={() => setViewMode("table")}
                  title="Ver como tabla"
                >
                  <TableProperties className="w-4 h-4" />
                  Tabla
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700 bg-white px-3 py-2 rounded-lg shadow-sm">
              <ShoppingCart className="w-4 h-4" />
              <span>{totals.itemCount} ítems</span>
              <span className="text-gray-300">|</span>
              <span className="font-semibold">
                S/ {totals.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div
            className={`bg-white rounded-xl shadow p-3 space-y-3 flex flex-col ${
              isCardsView ? "h-[74vh] min-h-[400px]" : ""
            }`}
          >
            {isCardsView && (
              <div className="flex items-center justify-between gap-3">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código o nombre"
                  className="w-full border px-3 py-2 rounded-lg focus:ring focus:ring-slate-200 text-sm"
                />
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {filteredProducts.length} resultados
                </span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-slate-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Cargando productos...</span>
              </div>
            ) : (
              <div
                className={`flex-1 min-h-0 pr-1 ${
                  isCardsView ? "overflow-y-auto" : "overflow-visible"
                }`}
              >
                {isCardsView ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {visibleProducts.map((product) => {
                      const image = product.images?.[0];
                      return (
                        <article
                          key={product.id}
                          className="border rounded-xl p-3 bg-gray-50 hover:border-slate-300 transition-colors flex flex-col"
                        >
                          <div className="aspect-video rounded-lg overflow-hidden bg-white border flex items-center justify-center">
                            {image ? (
                              <img
                                src={image}
                                alt={product.nombre}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-sm text-gray-500">
                                Sin imagen
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex-1 flex flex-col gap-1">
                            <p className="text-xs text-gray-500">
                              {product.codigo}
                            </p>
                            <h3 className="text-sm font-semibold text-slate-800 line-clamp-2">
                              {product.nombre}
                            </h3>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>
                                Stock: {Number(product.cantidad ?? 0)}
                              </span>
                              <span className="font-semibold text-slate-800">
                                S/ {priceLabel(product)}
                              </span>
                            </div>
                          </div>

                          <button
                            className="mt-3 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors text-sm"
                            onClick={() => handleAddProduct(product)}
                          >
                            <Plus className="w-4 h-4" />
                            Añadir
                          </button>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <DataTable
                    data={filteredProducts}
                    columns={productColumns}
                    filterKeys={["codigo", "nombre"]}
                    onRowClick={handleAddProduct}
                  />
                )}
                {hasMoreProducts && (
                  <div
                    ref={loadMoreRef}
                    className="mt-3 h-10 flex items-center justify-center text-xs text-gray-500"
                  >
                    Cargando más productos...
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Carrito
                </h3>
                <p className="text-xs text-gray-500">
                  Actualización en tiempo real
                </p>
              </div>
              <button
                className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
                onClick={confirmClear}
                disabled={!items.length}
              >
                <RotateCcw className="w-4 h-4" />
                Vaciar
              </button>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {items.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-6">
                  No hay productos en el carrito.
                </div>
              )}

              {items.map((item) => (
                <article
                  key={item.productId}
                  className="border rounded-lg p-3 hover:border-slate-300 transition-colors bg-gray-50"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.codigo} · {item.unidadMedida ?? "UND"}
                      </p>
                      {item.stock !== undefined && (
                        <p className="text-xs text-gray-500">
                          Stock: {item.stock}
                        </p>
                      )}
                    </div>

                    <div className="text-right w-32">
                      <label className="text-xs text-gray-500 block text-left">
                        P. Unitario
                      </label>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-sm text-gray-500">S/</span>
                        <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={priceDrafts[item.productId] ?? item.precio}
                        onChange={(e) =>
                          handlePriceChange(item, e.target.value)
                        }
                        onFocus={(e) => e.target.select()}
                        className="w-full text-right border rounded-md px-2 py-1 text-sm"
                      />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 rounded bg-white border hover:bg-slate-50"
                        onClick={() => handleQuantityChange(item, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={item.cantidad === 0 ? "" : item.cantidad}
                        onChange={(e) =>
                          handleManualQuantity(item, e.target.value)
                        }
                        onFocus={(e) => e.target.select()}
                        className="w-16 text-center border rounded-md py-1"
                      />
                      <button
                        className="p-1 rounded bg-white border hover:bg-slate-50"
                        onClick={() => handleQuantityChange(item, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Subtotal</p>
                        <p className="text-base font-semibold text-slate-800">
                          S/ {(item.precio * item.cantidad).toFixed(2)}
                        </p>
                      </div>
                      <button
                        className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100"
                        onClick={() => removeItem(item.productId)}
                        title="Quitar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">
                  S/ {totals.subTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base text-slate-800 font-bold">
                <span>Total</span>
                <span>S/ {totals.total.toFixed(2)}</span>
              </div>
              <button
                className="w-full mt-3 inline-flex justify-center items-center gap-2 py-2.5 rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                disabled={!items.length}
                onClick={goToPayment}
              >
                <CheckCircle2 className="w-5 h-5" />
                Procesar venta
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default POSPage;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router";
import {
  CheckCircle2,
  ArrowLeft,
  Printer,
  Receipt,
  MessageCircle,
  UserPlus,
  Trash2,
} from "lucide-react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { useForm, useWatch } from "react-hook-form";
import { usePosStore, selectTotals } from "@/store/pos/pos.store";
import { toast } from "@/shared/ui/toast";
import { getLocalDateISO } from "@/shared/helpers/localDate";
import TicketDocument from "@/components/Ticket";
import { apiRequest } from "@/shared/helpers/apiRequest";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormAutocomplete } from "@/components/forms/HookFormAutocomplete";
import CustomerFormBase from "@/components/CustomerFormBase";
import { useClientsStore } from "@/store/customers/customers.store";
import { useProductsStore } from "@/store/products/products.store";
import { useDialogStore } from "@/store/app/dialog.store";
import type { PosCartItem } from "@/types/pos";
import type { Client } from "@/types/customer";
import { buildApiUrl } from "@/config";

type NotaDetallePayload = {
  detalleId?: number;
  idProducto: number;
  detalleCantidad: number;
  detalleUm?: string;
  detalleDescripcion: string;
  detalleCosto: number;
  detallePrecio: number;
  detalleImporte: number;
  detalleEstado?: string;
  valorUM?: number;
};

const PaymentPage = () => {
  const { notaId: notaIdParam } = useParams<{ notaId?: string }>();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const items = usePosStore((s) => s.items);
  const totals = usePosStore(selectTotals);
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const updatePrice = usePosStore((s) => s.updatePrice);
  const removeItem = usePosStore((s) => s.removeItem);
  const setStoreItems = usePosStore((s) => s.setItems);
  const editingNotaIdFromStore = usePosStore((s) => s.editingNotaId);
  const serverItemsFromStore = usePosStore((s) => s.serverItemsFromNota);
  const isEditingMode = usePosStore((s) => s.isEditingMode);
  const setEditingNotaInStore = usePosStore((s) => s.setEditingNota);
  const setEditingModeInStore = usePosStore((s) => s.setEditingMode);
  const setServerItemsInStore = usePosStore((s) => s.setServerItemsFromNota);
  const clearEditingNota = usePosStore((s) => s.clearEditingNota);
  const clearCart = usePosStore((s) => s.clearCart);
  const openDialog = useDialogStore((s) => s.openDialog);
  const { clients, fetchClients, addClient } = useClientsStore();
  const { fetchProducts: refetchProducts } = useProductsStore();
  const safeTrim = (value: unknown) => String(value ?? "").trim();
  const routeNotaId = useMemo(() => {
    const parsed = Number(notaIdParam ?? 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [notaIdParam]);
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const queryMode = useMemo(() => {
    const raw = String(searchParams.get("mode") ?? "")
      .trim()
      .toLowerCase();
    if (raw === "view" || raw === "edit") return raw;
    return null;
  }, [searchParams]);
  const pathMode = useMemo(() => {
    const normalizedPath = pathname.toLowerCase();
    if (!normalizedPath.includes("/sales/order_notes/")) return null;
    if (normalizedPath.endsWith("/view")) return "view";
    if (normalizedPath.endsWith("/edit")) return "edit";
    return null;
  }, [pathname]);
  const forcedMode = pathMode ?? queryMode;
  const isOrderNotesFlow = useMemo(
    () =>
      pathname.toLowerCase().includes("/sales/order_notes/") ||
      String(searchParams.get("from") ?? "").toLowerCase() === "order_notes",
    [pathname, searchParams],
  );
  const isReadOnlyNoteView = isOrderNotesFlow && forcedMode === "view";
  const backRoute = "/sales/pos";
  const backLabel = "Volver al POS";
  const initialItems =
    serverItemsFromStore.length > 0 ? serverItemsFromStore : items;
  const [purchasedItems, setPurchasedItems] = useState(initialItems);
  const [serverItems, setServerItems] =
    useState<PosCartItem[]>(serverItemsFromStore);
  const [paidTotals, setPaidTotals] = useState(
    serverItemsFromStore.length
      ? computeTotalsFromItems(serverItemsFromStore)
      : totals,
  );
  const [canPreviewPdf, setCanPreviewPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [notaId, setNotaId] = useState<number | null>(
    routeNotaId ?? editingNotaIdFromStore ?? null,
  );
  const [notaNumero, setNotaNumero] = useState<string>("");
  const [notaSerieOverride, setNotaSerieOverride] = useState<string | null>(
    null,
  );
  const [hasLoadedNotaMeta, setHasLoadedNotaMeta] = useState(false);
  const [activeTab, setActiveTab] = useState<"items" | "pdf">("items");
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const prevApplyDiscountRef = useRef(false);
  const hasMountedApplyDiscountRef = useRef(false);
  const hasInvalidCustomerSelectionRef = useRef(false);

  const docTypeConfig: Record<
    "03" | "01" | "101",
    { docu: string; serie: string; label: string }
  > = {
    "03": { docu: "BOLETA", serie: "BA01", label: "Boleta" },
    "01": { docu: "FACTURA", serie: "FA01", label: "Factura" },
    "101": { docu: "PROFORMA V", serie: "0001", label: "Proforma V" },
  };

  const {
    companyId,
    usernameFromSession,
    discountMaxFromSession,
    companyNameFromSession,
    companyCommercialFromSession,
    companyRucFromSession,
    companyUbigeoNameFromSession,
    companyAddressSunatFromSession,
  } = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        companyId: 1,
        usernameFromSession: "USUARIO",
        discountMaxFromSession: 0,
        companyNameFromSession: "",
        companyCommercialFromSession: "",
        companyRucFromSession: "",
        companyUbigeoNameFromSession: "",
        companyAddressSunatFromSession: "",
      };
    }

    let parsedSession: any = null;
    const sessionRaw = localStorage.getItem("sgo.auth.session");
    if (sessionRaw) {
      try {
        parsedSession = JSON.parse(sessionRaw);
      } catch {
        parsedSession = null;
      }
    }

    const companyIdRaw =
      parsedSession?.user?.companyId ?? localStorage.getItem("companiaId");
    const companyIdNum = Number(companyIdRaw);
    const safeCompanyId =
      Number.isFinite(companyIdNum) && companyIdNum > 0 ? companyIdNum : 1;

    const username =
      safeTrim(parsedSession?.user?.displayName) ||
      safeTrim(parsedSession?.user?.username) ||
      "";
    const discountMaxRaw =
      parsedSession?.user?.maxDiscount ?? parsedSession?.descuentoMax ?? 0;
    const discountMaxNumeric = Number(discountMaxRaw);
    const safeDiscountMax =
      Number.isFinite(discountMaxNumeric) && discountMaxNumeric > 0
        ? discountMaxNumeric
        : 0;
    const companyName = safeTrim(
      parsedSession?.user?.companyName ?? parsedSession?.razonSocial ?? "",
    );
    const companyCommercial = safeTrim(
      parsedSession?.user?.companyCommercialName ??
        parsedSession?.companiaComercial ??
        "",
    );
    const companyRuc = safeTrim(
      parsedSession?.user?.companyRuc ?? parsedSession?.companiaRuc ?? "",
    );
    const companyUbigeoName = safeTrim(
      parsedSession?.user?.companyUbigeoName ??
        parsedSession?.companiaNomUbg ??
        "",
    );
    const companySunatAddress = safeTrim(
      parsedSession?.user?.companySunatAddress ??
        parsedSession?.companiaDirecSunat ??
        "",
    );

    return {
      companyId: safeCompanyId,
      usernameFromSession: username || "USUARIO",
      discountMaxFromSession: safeDiscountMax,
      companyNameFromSession: companyName,
      companyCommercialFromSession: companyCommercial,
      companyRucFromSession: companyRuc,
      companyUbigeoNameFromSession: companyUbigeoName,
      companyAddressSunatFromSession: companySunatAddress,
    };
  }, []);

  useEffect(() => {
    if (!routeNotaId) return;

    if (isOrderNotesFlow) {
      setPurchasedItems([]);
      setServerItems([]);
      setPaidTotals({ subTotal: 0, total: 0, itemCount: 0 });
    }

    setNotaId(routeNotaId);
    setHasLoadedNotaMeta(false);
    setEditingNotaInStore(routeNotaId);

    if (forcedMode === "view") {
      setEditingModeInStore(false);
      setIsConfirmed(true);
      return;
    }

    setEditingModeInStore(true);
    setIsConfirmed(false);
  }, [
    forcedMode,
    isOrderNotesFlow,
    routeNotaId,
    setEditingModeInStore,
    setEditingNotaInStore,
  ]);

  const hasLiveItems = !isOrderNotesFlow && items.length > 0;
  const itemsToRender = hasLiveItems ? items : purchasedItems;
  const totalsToRender = hasLiveItems ? totals : paidTotals;
  const canEditItems = !isReadOnlyNoteView && (hasLiveItems || isEditingMode);

  const focusVerticalInput = useCallback(
    (
      sourceElement: HTMLElement,
      column: "quantity" | "price",
      currentRowIndex: number,
      direction: "up" | "down",
    ) => {
      const nextRowIndex =
        direction === "up" ? currentRowIndex - 1 : currentRowIndex + 1;

      if (nextRowIndex < 0 || nextRowIndex >= itemsToRender.length) {
        return false;
      }

      const scope = sourceElement.closest('[data-payment-items-list="true"]');
      const queryRoot = scope ?? document;
      const target = queryRoot.querySelector<HTMLInputElement>(
        `[data-payment-column="${column}"][data-payment-row-index="${nextRowIndex}"]`,
      );

      if (!target || target.disabled) {
        return false;
      }

      target.focus({ preventScroll: true });
      target.select?.();
      return true;
    },
    [itemsToRender.length],
  );

  const handleColumnArrowNavigation = useCallback(
    (
      event: KeyboardEvent<HTMLInputElement>,
      column: "quantity" | "price",
      rowIndex: number,
    ) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowUp" ? "up" : "down";
      const moved = focusVerticalInput(
        event.currentTarget,
        column,
        rowIndex,
        direction,
      );
      if (!moved) {
        event.currentTarget.select?.();
      }
    },
    [focusVerticalInput],
  );

  const adjustLocalItems = (
    updater: (prev: PosCartItem[]) => PosCartItem[],
  ) => {
    setPurchasedItems((prev) => {
      const next = updater(prev);
      setPaidTotals(computeTotalsFromItems(next));
      return next;
    });
  };

  const handleQuantityChange = (item: PosCartItem, delta: number) => {
    if (!canEditItems) return;
    const desired = Math.max(0, (item.cantidad ?? 0) + delta);
    if (hasLiveItems) {
      updateQuantity(item.productId, desired);
      return;
    }
    adjustLocalItems((prev) =>
      prev.map((it) =>
        it.productId === item.productId ? { ...it, cantidad: desired } : it,
      ),
    );
  };

  const handleRemoveItem = (productId: number) => {
    if (!canEditItems) return;
    if (hasLiveItems) {
      removeItem(productId);
      return;
    }
    adjustLocalItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const applyPriceToItem = (item: PosCartItem, price: number) => {
    if (hasLiveItems) {
      updatePrice(item.productId, price);
      return;
    }
    adjustLocalItems((prev) =>
      prev.map((it) =>
        it.productId === item.productId ? { ...it, precio: price } : it,
      ),
    );
  };

  const handlePriceChange = (item: PosCartItem, value: string) => {
    if (!canEditItems) return;
    if (!/^\d*\.?\d*$/.test(value)) return;

    const minPrice = Math.max(0, Number(item.precioMinimo ?? 0) || 0);
    setPriceDrafts((prev) => ({ ...prev, [item.productId]: value }));

    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= minPrice) {
      applyPriceToItem(item, parsed);
    }
  };

  const handlePriceBlur = (
    item: PosCartItem,
    value: string,
    input?: HTMLInputElement | null,
  ) => {
    if (!canEditItems) return;
    const minPrice = Math.max(0, Number(item.precioMinimo ?? 0) || 0);
    const normalizedMinPrice = Number.isInteger(minPrice)
      ? String(minPrice)
      : minPrice.toFixed(2);

    if (value.trim() === "") {
      setPriceDrafts((prev) => ({
        ...prev,
        [item.productId]: normalizedMinPrice,
      }));
      applyPriceToItem(item, minPrice);
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      setPriceDrafts((prev) => ({
        ...prev,
        [item.productId]: String(item.precio ?? normalizedMinPrice),
      }));
      return;
    }

    if (parsed < minPrice) {
      toast.error(`El valor mínimo es ${normalizedMinPrice}.`);
      setPriceDrafts((prev) => ({
        ...prev,
        [item.productId]: normalizedMinPrice,
      }));
      applyPriceToItem(item, minPrice);
      window.requestAnimationFrame(() => {
        if (!input || input.disabled) return;
        input.focus();
        input.select?.();
      });
      return;
    }

    setPriceDrafts((prev) => ({ ...prev, [item.productId]: String(parsed) }));
    applyPriceToItem(item, parsed);
  };

  const formMethods = useForm({
    defaultValues: {
      docTypeCode: "03" as "03" | "01" | "101",
      paymentMethod: "EFECTIVO" as
        | "EFECTIVO"
        | "TARJETA"
        | "TRANSFERENCIA"
        | "YAPE",
      clienteId: null as number | null,
      customerName: "",
      customerId: "",
      bankEntity: "-",
      nroOperacion: "",
      notes: "",
      applyDiscount: false,
      discount: 0,
    },
  });

  const {
    watch,
    setValue,
    setFocus,
    getValues,
    register,
    control,
    formState: { isSubmitting, dirtyFields },
  } = formMethods;

  const docTypeCode = watch("docTypeCode");
  const paymentMethod = watch("paymentMethod");
  const clienteId = watch("clienteId");
  const customerName = watch("customerName");
  const customerId = watch("customerId");
  const bankEntity = watch("bankEntity");
  const nroOperacion = watch("nroOperacion");
  const notes = watch("notes");
  const applyDiscount = useWatch({
    control,
    name: "applyDiscount",
    defaultValue: false,
  }) as boolean;
  const discountInput = watch("discount");

  const docLabel = docTypeCode === "01" ? "RUC" : "DNI";
  const docConfig = docTypeConfig[docTypeCode];
  const notaSerie = (notaSerieOverride || docConfig?.serie || "BA01").trim();
  const paddedNotaNumero = useMemo(() => {
    const digitsOnly = (notaNumero || "").replace(/\D/g, "");
    if (!digitsOnly) return "";
    const padded = digitsOnly.padStart(8, "0");
    return /^0+$/.test(padded) ? "" : padded;
  }, [notaNumero]);
  const documentNumber = useMemo(() => {
    if (!paddedNotaNumero) return "";
    const serie = notaSerie || "BA01";
    return `${serie}-${paddedNotaNumero}`;
  }, [notaSerie, paddedNotaNumero]);
  const docTypeName = docConfig?.docu ?? "BOLETA";
  const docTypeForTicket: "boleta" | "factura" | "proforma" =
    docTypeCode === "01"
      ? "factura"
      : docTypeCode === "101"
        ? "proforma"
        : "boleta";
  const isProforma = docTypeCode === "101";
  const formLocked = isConfirmed || isReadOnlyNoteView;
  const totalAmount = totalsToRender?.total ?? 0;
  const maxDiscount = Math.max(0, Number(discountMaxFromSession) || 0);
  const clampDiscount = useCallback(
    (value: unknown) => {
      const numeric = Number(value ?? 0);
      if (!Number.isFinite(numeric)) return 0;
      return Math.min(maxDiscount, Math.max(0, numeric));
    },
    [maxDiscount],
  );
  const descuento = applyDiscount ? clampDiscount(discountInput) : 0;
  const discountedTotal = Math.max(0, totalAmount - descuento);
  const gravada = isProforma ? discountedTotal : discountedTotal / 1.18;
  const igvAmount = isProforma ? 0 : discountedTotal - gravada;

  const notaAdicional =
    paymentMethod === "TARJETA" ? discountedTotal * 0.05 : 0;
  const totalAPagar = discountedTotal + notaAdicional;
  const isCash = paymentMethod === "EFECTIVO";
  const isCard = paymentMethod === "TARJETA";
  const requiresBankSelection =
    paymentMethod === "TRANSFERENCIA" || paymentMethod === "YAPE";

  const resolvedNotaUsuario = useMemo(
    () => safeTrim(usernameFromSession) || "USUARIO",
    [usernameFromSession],
  );

  useEffect(() => {
    if (!hasMountedApplyDiscountRef.current) {
      hasMountedApplyDiscountRef.current = true;
      prevApplyDiscountRef.current = applyDiscount;
      return;
    }

    const wasChecked = prevApplyDiscountRef.current;
    if (applyDiscount && !wasChecked && !formLocked) {
      let attempts = 0;
      const maxAttempts = 8;

      const focusDiscountInput = () => {
        setFocus("discount");
        const input = document.querySelector<HTMLInputElement>(
          '[data-discount-input="true"]',
        );
        if (!input || input.disabled) {
          if (attempts >= maxAttempts) return;
          attempts += 1;
          window.setTimeout(focusDiscountInput, 30);
          return;
        }

        input.focus();

        if (document.activeElement === input) {
          input.select?.();
          return;
        }

        if (attempts >= maxAttempts) return;
        attempts += 1;
        window.setTimeout(focusDiscountInput, 30);
      };

      window.requestAnimationFrame(focusDiscountInput);
    }
    prevApplyDiscountRef.current = applyDiscount;
  }, [applyDiscount, formLocked, setFocus]);

  const mapApiDetalleToItem = (detalle: any): PosCartItem => {
    const detalleId = Number(
      detalle?.detalleId ??
        detalle?.idDetalle ??
        detalle?.DetalleId ??
        detalle?.id ??
        0,
    );
    const cantidad = Number(
      detalle?.detalleCantidad ?? detalle?.cantidad ?? detalle?.Cantidad ?? 0,
    );
    const precio = Number(
      detalle?.detallePrecio ??
        detalle?.detalleCosto ??
        detalle?.precio ??
        detalle?.Precio ??
        0,
    );
    const precioMinimo = Number(
      detalle?.precioMinimo ??
        detalle?.preVentaB ??
        detalle?.PrecioMinimo ??
        detalle?.PrecioB ??
        0,
    );
    const productId = Number(
      detalle?.idProducto ??
        detalle?.productoId ??
        detalle?.productId ??
        detalle?.ProductoId ??
        0,
    );

    return {
      productId: Number.isFinite(productId) ? productId : 0,
      codigo:
        safeTrim(
          detalle?.codigo ??
            detalle?.productoCodigo ??
            detalle?.codigoProducto ??
            "",
        ) || String(productId || ""),
      nombre:
        safeTrim(
          detalle?.detalleDescripcion ??
            detalle?.descripcion ??
            detalle?.productoNombre ??
            "",
        ) || "Producto",
      unidadMedida:
        safeTrim(detalle?.detalleUm ?? detalle?.unidadMedida ?? "") || "UND",
      precio: Math.max(
        Number.isFinite(precio) ? precio : 0,
        Number.isFinite(precioMinimo) ? Math.max(precioMinimo, 0) : 0,
      ),
      precioMinimo: Number.isFinite(precioMinimo)
        ? Math.max(precioMinimo, 0)
        : 0,
      cantidad: Number.isFinite(cantidad) ? cantidad : 0,
      stock: Number(detalle?.stock ?? detalle?.cantidadSaldo ?? 0) || undefined,
      detalleId:
        Number.isFinite(detalleId) && detalleId > 0 ? detalleId : undefined,
    };
  };

  function computeTotalsFromItems(itemsList: PosCartItem[]) {
    const subTotal = itemsList.reduce(
      (acc, item) =>
        acc + Number(item.precio ?? 0) * Number(item.cantidad ?? 0),
      0,
    );
    const itemCount = itemsList.reduce(
      (acc, item) => acc + Number(item.cantidad ?? 0),
      0,
    );
    return { subTotal, total: subTotal, itemCount };
  }

  const buildRequestDetalle = (
    currentDetails: NotaDetallePayload[],
    previousItems: PosCartItem[],
  ) => {
    const serverById = new Map<number, PosCartItem>();
    previousItems.forEach((item) => {
      if (item.detalleId && item.detalleId > 0) {
        serverById.set(item.detalleId, item);
      }
    });

    const requestDetalle: Array<Record<string, any>> = [];

    const isDifferent = (curr: NotaDetallePayload, prev: PosCartItem) => {
      return (
        Number(curr.detalleCantidad ?? 0) !== Number(prev.cantidad ?? 0) ||
        Number(curr.detallePrecio ?? 0) !== Number(prev.precio ?? 0) ||
        safeTrim(curr.detalleDescripcion) !== safeTrim(prev.nombre) ||
        safeTrim(curr.detalleUm) !== safeTrim(prev.unidadMedida ?? "UND")
      );
    };

    currentDetails.forEach((detalle) => {
      const detalleId = Number(detalle.detalleId ?? 0);
      const unidadUpper = safeTrim(detalle.detalleUm ?? "UND").toUpperCase();
      const payloadBase = {
        DetalleId: detalleId,
        productId: detalle.idProducto,
        cantidad: detalle.detalleCantidad,
        unidad: unidadUpper,
        producto: detalle.detalleDescripcion,
        costo: detalle.detalleCosto,
        precio: detalle.detallePrecio,
        importe: Number(
          (detalle.detalleImporte ?? 0).toFixed?.(2) ??
            detalle.detalleImporte ??
            0,
        ),
        valorUM: detalle.valorUM ?? 1,
        DetalleEstado: detalle.detalleEstado ?? "PENDIENTE",
      };

      if (detalleId && serverById.has(detalleId)) {
        const prev = serverById.get(detalleId)!;
        if (isDifferent(detalle, prev)) {
          requestDetalle.push({ ...payloadBase, action: "update" });
        }
        serverById.delete(detalleId);
      } else {
        // Item nuevo; sin action explícito para respetar el formato esperado
        requestDetalle.push(payloadBase);
      }
    });

    serverById.forEach((item) => {
      const importe = Number(
        ((item.precio ?? 0) * (item.cantidad ?? 0)).toFixed(2),
      );
      requestDetalle.push({
        DetalleId: item.detalleId ?? 0,
        productId: item.productId,
        cantidad: item.cantidad,
        unidad: safeTrim(item.unidadMedida ?? "UND").toUpperCase(),
        producto: item.nombre,
        costo: item.precio,
        precio: item.precio,
        importe,
        valorUM: 1,
        DetalleEstado: "PENDIENTE",
        action: "delete",
      });
    });

    return requestDetalle.length ? requestDetalle : null;
  };
  const fetchNotaFromServer = async (notaIdToLoad: number) => {
    if (!Number.isFinite(notaIdToLoad) || notaIdToLoad <= 0) return;

    try {
      const [notaResponse, detallesResponse] = await Promise.all([
        apiRequest({
          url: buildApiUrl(`/Nota/${notaIdToLoad}`),
          method: "GET",
          config: { headers: { Accept: "text/plain" } },
          fallback: null,
        }),
        apiRequest({
          url: buildApiUrl(`/Nota/${notaIdToLoad}/detalles`),
          method: "GET",
          config: { headers: { Accept: "text/plain" } },
          fallback: [],
        }),
      ]);

      if (!Array.isArray(detallesResponse)) {
        throw new Error("No se pudo obtener los detalles de la nota.");
      }

      const mappedItems = detallesResponse.map(mapApiDetalleToItem);
      setPurchasedItems(mappedItems);
      setPaidTotals(computeTotalsFromItems(mappedItems));
      setServerItems(mappedItems);
      setServerItemsInStore(mappedItems);
      setEditingNotaInStore(notaIdToLoad);

      const notaRaw =
        (notaResponse as any)?.nota ?? (notaResponse as any) ?? null;
      const notaData =
        notaRaw && typeof notaRaw === "object" && !(notaRaw instanceof Error)
          ? notaRaw
          : null;
      if (notaData) {
        const notaDocu = safeTrim(
          (notaData as any).notaDocu ??
            (notaData as any).docu ??
            (notaData as any).notaTipo ??
            "",
        );
        if (notaDocu) {
          const match = Object.entries(docTypeConfig).find(
            ([, cfg]) =>
              safeTrim(cfg.docu).toUpperCase() === notaDocu.toUpperCase(),
          );
          if (match) {
            setValue("docTypeCode", match[0] as any, { shouldDirty: false });
          }
        }

        const notaClienteId = Number(
          (notaData as any).clienteId ?? (notaData as any).ClienteId ?? 0,
        );
        if (Number.isFinite(notaClienteId) && notaClienteId > 0) {
          setValue("clienteId", notaClienteId, { shouldDirty: false });
        }

        const notaClienteNombre = safeTrim(
          (notaData as any).clienteNombre ??
            (notaData as any).clienteRazon ??
            (notaData as any).clienteRazonSocial ??
            "",
        );
        if (notaClienteNombre) {
          setValue("customerName", notaClienteNombre, { shouldDirty: false });
        }

        const notaDocValue =
          safeTrim(
            (notaData as any).clienteRuc ??
              (notaData as any).clienteDni ??
              (notaData as any).notaRuc ??
              (notaData as any).notaDni ??
              "",
          ) || "";
        if (notaDocValue) {
          setValue("customerId", notaDocValue, { shouldDirty: false });
        }

        const serieNota = safeTrim(
          (notaData as any).notaSerie ?? (notaData as any).serie ?? "",
        );
        if (serieNota) {
          setNotaSerieOverride(serieNota);
        }

        const notaNumeroRaw = safeTrim(
          (notaData as any).notaNumero ?? (notaData as any).numero ?? "",
        );
        const notaNumeroDigits = notaNumeroRaw.replace(/\D/g, "");
        if (notaNumeroDigits) {
          setNotaNumero(notaNumeroDigits.padStart(8, "0"));
        }

        const formaPago = safeTrim(
          (notaData as any).notaFormaPago ?? (notaData as any).formaPago ?? "",
        );
        if (formaPago) {
          setValue("paymentMethod", formaPago as any, { shouldDirty: false });
        }

        const banco = safeTrim(
          (notaData as any).entidadBancaria ?? (notaData as any).banco ?? "",
        );
        if (banco) {
          setValue("bankEntity", banco, { shouldDirty: false });
        }

        const nroOperacionNota = safeTrim(
          (notaData as any).nroOperacion ??
            (notaData as any).numeroOperacion ??
            "",
        );
        if (nroOperacionNota) {
          setValue("nroOperacion", nroOperacionNota, { shouldDirty: false });
        }

        const descuentoNota = Number(
          (notaData as any).notaDescuento ?? (notaData as any).descuento ?? 0,
        );
        if (Number.isFinite(descuentoNota) && descuentoNota > 0) {
          setValue("applyDiscount", true, { shouldDirty: false });
          setValue("discount", descuentoNota, { shouldDirty: false });
        }
      }
    } catch (error) {
      console.error("Error al cargar la nota por id", error);
      toast.error("No se pudo sincronizar la nota creada.");
    }
  };

  useEffect(() => {
    const currentBank = String(getValues("bankEntity") ?? "").trim();
    if (paymentMethod === "EFECTIVO") {
      if (currentBank !== "-") {
        setValue("bankEntity", "-", { shouldDirty: false });
      }
      setValue("nroOperacion", "", { shouldDirty: false });
    } else if (paymentMethod === "TARJETA") {
      if (!currentBank || currentBank === "-") {
        setValue("bankEntity", "BCP", { shouldDirty: false });
      }
      setValue("nroOperacion", "", { shouldDirty: false });
    } else {
      if (currentBank === "-") {
        setValue("bankEntity", "", { shouldDirty: false });
      }
    }
  }, [getValues, paymentMethod, setValue]);

  const lastDocTypeRef = useRef<string | null>(null);
  const defaultCustomerAppliedRef = useRef(false);

  useEffect(() => {
    if (!clients.length) {
      fetchClients();
    }
  }, [clients.length, fetchClients]);

  // En nuevo registro, preselecciona cliente ID 1 (sin afectar edici�n)
  useEffect(() => {
    if (notaId || isEditingMode || hasLoadedNotaMeta) return;
    if (defaultCustomerAppliedRef.current) return;
    const hasClientAlready =
      Number(clienteId) > 0 || safeTrim(customerName) || safeTrim(customerId);
    if (hasClientAlready) return;

    const defaultClient =
      clients.find((c) => Number(c.id) === 1) ??
      ({} as (typeof clients)[number]);

    const defaultId = Number(defaultClient?.id ?? 1);
    if (Number.isFinite(defaultId) && defaultId > 0) {
      setValue("clienteId", defaultId, { shouldDirty: false });
    }

    const defaultName = safeTrim((defaultClient as any)?.nombreRazon ?? "");
    if (defaultName) {
      setValue("customerName", defaultName, { shouldDirty: false });
    }

    const defaultDoc =
      docTypeCode === "01"
        ? safeTrim((defaultClient as any)?.ruc ?? "")
        : safeTrim((defaultClient as any)?.dni ?? "");
    if (defaultDoc) {
      setValue("customerId", defaultDoc, { shouldDirty: false });
    }

    defaultCustomerAppliedRef.current = true;
  }, [
    notaId,
    isEditingMode,
    hasLoadedNotaMeta,
    clienteId,
    customerName,
    customerId,
    clients,
    docTypeCode,
    setValue,
  ]);

  // Hidratamos nombre/documento del cliente al volver con datos de nota
  useEffect(() => {
    if (!hasLoadedNotaMeta) return;
    if (dirtyFields?.customerName || dirtyFields?.customerId) return;
    const clientIdNumeric = Number(clienteId);
    if (!Number.isFinite(clientIdNumeric) || clientIdNumeric <= 0) return;
    const client = clients.find((c) => Number(c.id) === clientIdNumeric);
    if (!client) return;

    const currentName = safeTrim(customerName);
    const currentDoc = safeTrim(customerId);
    const suggestedName = safeTrim(client.nombreRazon ?? "");
    const suggestedDoc =
      docTypeCode === "01"
        ? safeTrim((client as any).ruc ?? "")
        : safeTrim(client.dni ?? "");

    if (!currentName && suggestedName) {
      setValue("customerName", suggestedName, { shouldDirty: false });
    }
    if (!currentDoc && suggestedDoc) {
      setValue("customerId", suggestedDoc, { shouldDirty: false });
    }
  }, [
    hasLoadedNotaMeta,
    clienteId,
    clients,
    docTypeCode,
    dirtyFields?.customerName,
    dirtyFields?.customerId,
    setValue,
  ]);

  useEffect(() => {
    if (!applyDiscount) {
      if (Number(discountInput ?? 0) !== 0) {
        setValue("discount", 0, { shouldDirty: true, shouldValidate: true });
      }
      return;
    }

    const currentValue = Number(discountInput ?? 0);
    const clampedValue = clampDiscount(discountInput);
    if (!Number.isFinite(currentValue) || currentValue !== clampedValue) {
      setValue("discount", clampedValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [applyDiscount, discountInput, clampDiscount, setValue]);

  useEffect(() => {
    // Solo resetea en flujo nuevo; en edici�n o con cliente cargado no limpiar
    if (!dirtyFields?.docTypeCode) {
      lastDocTypeRef.current = docTypeCode;
      return;
    }

    const previousDocType = lastDocTypeRef.current;
    lastDocTypeRef.current = docTypeCode;

    // Solo limpiar al cambiar a Factura (RUC) para forzar nuevo documento
    if (docTypeCode !== "01" || previousDocType === docTypeCode) return;
    if (notaId || isEditingMode || hasLoadedNotaMeta) return;
    if (Number(clienteId) > 0) return;
    if (!safeTrim(customerId)) return;

    setValue("customerId", "", { shouldDirty: false });
  }, [
    docTypeCode,
    dirtyFields?.docTypeCode,
    clienteId,
    customerId,
    notaId,
    isEditingMode,
    hasLoadedNotaMeta,
    setValue,
  ]);

  // Asegura que el formulario siga editable mientras no se haya confirmado
  useEffect(() => {
    if (!notaId) {
      setIsConfirmed(false);
    }
  }, [notaId, items.length]);

  const setClienteIdFromOption = useCallback(
    (opt: any, options?: { shouldDirty?: boolean }) => {
      const shouldDirty = options?.shouldDirty ?? true;
      const candidate = opt?.id ?? opt?.clienteId ?? opt?.clientId;
      const numeric = Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) {
        setValue("clienteId", numeric, { shouldDirty });
        return;
      }

      setValue("clienteId", null, { shouldDirty });
    },
    [setValue],
  );

  // Si el usuario borra manualmente el DNI/RUC, se mantiene el nombre
  // y solo se desvincula clienteId para no rehidratar el documento anterior.
  useEffect(() => {
    if (!dirtyFields?.customerId) return;
    if (safeTrim(customerId)) return;
    if (Number(clienteId) <= 0) return;
    setClienteIdFromOption(null, { shouldDirty: true });
  }, [customerId, clienteId, dirtyFields?.customerId, setClienteIdFromOption]);

  const handleOpenCreateClientModal = useCallback(() => {
    if (formLocked) return;

    openDialog({
      title: "Registrar cliente",
      maxWidth: "lg",
      fullWidth: true,
      confirmText: "Guardar",
      cancelText: "Cancelar",
      content: (
        <CustomerFormBase
          mode="create"
          variant="modal"
          onSave={async () => false}
          onNew={() => {}}
        />
      ),
      onConfirm: async (rawData) => {
        const data = (rawData ?? {}) as Partial<Client>;
        const payload: Omit<Client, "id"> = {
          nombreRazon: safeTrim(data.nombreRazon).toUpperCase(),
          ruc: safeTrim(data.ruc),
          dni: safeTrim(data.dni),
          direccionFiscal: safeTrim(data.direccionFiscal),
          direccionDespacho: safeTrim(data.direccionDespacho),
          telefonoMovil: safeTrim(data.telefonoMovil),
          email: safeTrim(data.email),
          registradoPor: safeTrim(data.registradoPor) || resolvedNotaUsuario,
          estado: safeTrim(data.estado) || "ACTIVO",
          fecha: data.fecha ?? null,
        };

        if (!payload.nombreRazon) {
          toast.error("El nombre o razon social es obligatorio.");
          return false;
        }

        const result = await addClient(payload);
        if (!result.ok) {
          toast.error(result.error ?? "No se pudo crear el cliente.");
          return false;
        }

        await fetchClients();
        const refreshedClients = useClientsStore.getState().clients;
        const normalizedName = safeTrim(payload.nombreRazon).toLowerCase();
        const normalizedRuc = safeTrim(payload.ruc);
        const normalizedDni = safeTrim(payload.dni);

        const createdClient =
          refreshedClients.find((client) => {
            const clientRuc = safeTrim(client.ruc);
            const clientDni = safeTrim(client.dni);
            const clientName = safeTrim(client.nombreRazon).toLowerCase();
            return (
              (normalizedRuc && clientRuc === normalizedRuc) ||
              (normalizedDni && clientDni === normalizedDni) ||
              (!!normalizedName && clientName === normalizedName)
            );
          }) ?? null;

        const selectedName =
          safeTrim(createdClient?.nombreRazon) || payload.nombreRazon;
        const selectedDoc =
          docTypeCode === "01"
            ? safeTrim(createdClient?.ruc) ||
              safeTrim(createdClient?.dni) ||
              payload.ruc ||
              payload.dni
            : safeTrim(createdClient?.dni) ||
              safeTrim(createdClient?.ruc) ||
              payload.dni ||
              payload.ruc;

        setValue("customerName", selectedName, { shouldDirty: true });
        setValue("customerId", selectedDoc, { shouldDirty: true });
        setClienteIdFromOption({
          id: createdClient?.id ?? null,
          clienteId: createdClient?.id ?? null,
        });
        toast.success("Cliente creado correctamente.");
        return true;
      },
    });
  }, [
    addClient,
    docTypeCode,
    fetchClients,
    formLocked,
    openDialog,
    resolvedNotaUsuario,
    setClienteIdFromOption,
    setValue,
  ]);

  const uniqueClients = useMemo(() => {
    const seen = new Set<string>();
    const result: typeof clients = [];
    clients.forEach((client, index) => {
      const dniKey = client.dni ? safeTrim(client.dni) : "";
      const rucKey = (client as any).ruc ? safeTrim((client as any).ruc) : "";
      const idKey =
        client.id !== undefined && client.id !== null ? `id-${client.id}` : "";
      const nameKey = client.nombreRazon ? `name-${client.nombreRazon}` : "";
      const key =
        (dniKey && `dni-${dniKey}`) ||
        (rucKey && `ruc-${rucKey}`) ||
        idKey ||
        nameKey ||
        `idx-${index}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push(client);
    });
    return result;
  }, [clients]);

  const clientOptions = useMemo(
    () =>
      uniqueClients.map((client) => ({
        value: client.nombreRazon ?? "",
        label: client.nombreRazon ?? "",
        dni: client.dni ?? "",
        ruc: client.ruc ?? "",
        id: client.id,
      })),
    [uniqueClients],
  );

  const dniOptions = useMemo(
    () =>
      uniqueClients
        .filter((client) => client.dni?.trim())
        .map((client) => ({
          value: (client.dni ?? "").trim(),
          label: (client.dni ?? "").trim(),
          dni: (client.dni ?? "").trim(),
          nombreRazon: (client.nombreRazon ?? "").trim(),
          id: client.id,
        })),
    [uniqueClients],
  );

  const rucOptions = useMemo(
    () =>
      uniqueClients
        .filter((client) => client.ruc?.trim())
        .map((client) => ({
          value: (client.ruc ?? "").trim(),
          label: (client.ruc ?? "").trim(),
          ruc: (client.ruc ?? "").trim(),
          nombreRazon: (client.nombreRazon ?? "").trim(),
          id: client.id,
        })),
    [uniqueClients],
  );

  const selectedDocument = useMemo(() => {
    const source = docTypeCode === "01" ? rucOptions : dniOptions;
    const match = source.find(
      (opt) => String(opt.value) === String(customerId),
    );
    if (match?.label) return match.label;
    return typeof customerId === "string" ? customerId : "";
  }, [customerId, docTypeCode, dniOptions, rucOptions]);

  const ensureExistingCustomerByName = useCallback(
    (rawName?: string) => {
      if (formLocked) return true;

      const currentNameFromForm = safeTrim(getValues("customerName"));
      const typedName = safeTrim(rawName ?? currentNameFromForm);
      if (!typedName) {
        if (!hasInvalidCustomerSelectionRef.current) return true;
        window.requestAnimationFrame(() => {
          setFocus("customerName");
        });
        return false;
      }

      const typedNameNormalized = typedName.toLowerCase();
      const matchedOption = clientOptions.find(
        (opt) => safeTrim(opt.label).toLowerCase() === typedNameNormalized,
      );

      if (!matchedOption) {
        hasInvalidCustomerSelectionRef.current = true;
        toast.error(
          "Intentaste seleccionar un cliente que no existe, por favor agrega el cliente y seleccionalo.",
        );
        setValue("customerName", "", { shouldDirty: true });
        setValue("customerId", "", { shouldDirty: true });
        setClienteIdFromOption(null, { shouldDirty: true });
        window.requestAnimationFrame(() => {
          setFocus("customerName");
        });
        return false;
      }

      hasInvalidCustomerSelectionRef.current = false;
      const selectedName = safeTrim(matchedOption.label ?? "");
      const docValue =
        docTypeCode === "01"
          ? safeTrim((matchedOption as any).ruc ?? "")
          : safeTrim((matchedOption as any).dni ?? "");

      setValue("customerName", selectedName, { shouldDirty: true });
      setValue("customerId", docValue || "", { shouldDirty: true });
      setClienteIdFromOption(matchedOption, { shouldDirty: true });
      return true;
    },
    [
      formLocked,
      clientOptions,
      docTypeCode,
      getValues,
      setValue,
      setFocus,
      setClienteIdFromOption,
    ],
  );

  // Sincronizacion consistente: si hay clienteId seleccionado, nombre/documento
  // se alinean a ese cliente (especialmente al cambiar tipo de documento).
  useEffect(() => {
    const clientIdNumeric = Number(clienteId);
    if (!Number.isFinite(clientIdNumeric) || clientIdNumeric <= 0) return;

    const clientById = uniqueClients.find(
      (client) => Number(client.id) === clientIdNumeric,
    );
    if (!clientById) return;

    const nameFromId = safeTrim(clientById.nombreRazon ?? "");
    const docFromId =
      docTypeCode === "01"
        ? safeTrim((clientById as any).ruc ?? "")
        : safeTrim((clientById as any).dni ?? "");

    if (nameFromId && safeTrim(customerName) !== nameFromId) {
      setValue("customerName", nameFromId, { shouldDirty: false });
    }

    if (safeTrim(customerId) !== docFromId) {
      setValue("customerId", docFromId, { shouldDirty: false });
    }
  }, [
    clienteId,
    docTypeCode,
    uniqueClients,
    customerName,
    customerId,
    setValue,
  ]);

  const resolveDocumentValue = useCallback(
    (value: any, type: "dni" | "ruc") => {
      const source = type === "ruc" ? rucOptions : dniOptions;
      const match = source.find(
        (opt) => String(opt.value) === String((value as any)?.value ?? value),
      );

      const docFromMatch = match
        ? safeTrim(
            type === "ruc"
              ? ((match as any).ruc ?? match.label ?? "")
              : ((match as any).dni ?? match.label ?? ""),
          )
        : "";

      if (docFromMatch) return docFromMatch;

      const fallback =
        (value as any)?.inputValue ??
        (value as any)?.label ??
        (value as any)?.value ??
        value;

      return safeTrim(fallback);
    },
    [dniOptions, rucOptions],
  );

  const validateDniLength = useCallback(
    (value: any) => {
      const doc = resolveDocumentValue(value, "dni");
      if (!doc) return true;
      return /^\d{8}$/.test(doc) || "El DNI debe tener 8 digitos";
    },
    [resolveDocumentValue],
  );

  const validateRucLength = useCallback(
    (value: any) => {
      const doc = resolveDocumentValue(value, "ruc");
      if (!doc) return "El RUC es obligatorio para Factura";
      return /^\d{11}$/.test(doc) || "El RUC debe tener 11 digitos";
    },
    [resolveDocumentValue],
  );

  const ensureFacturaCustomerAndRuc = useCallback(() => {
    if (docTypeCode !== "01") return true;

    const selectedClientId = Number(getValues("clienteId") ?? 0);
    const selectedName = safeTrim(getValues("customerName"));
    const resolvedRuc = resolveDocumentValue(getValues("customerId"), "ruc");
    const ruc = safeTrim(resolvedRuc);

    if (!selectedName || selectedClientId <= 0) {
      toast.error("Para Factura debes seleccionar un cliente.");
      window.requestAnimationFrame(() => {
        setFocus("customerName");
      });
      return false;
    }

    if (!/^\d{11}$/.test(ruc)) {
      toast.error("Para Factura debes ingresar un RUC valido de 11 digitos.");
      window.requestAnimationFrame(() => {
        setFocus("customerId");
      });
      return false;
    }

    return true;
  }, [docTypeCode, getValues, resolveDocumentValue, setFocus]);
  const documentFilterOptions = useCallback(
    (
      options: Array<(typeof dniOptions)[number] | (typeof rucOptions)[number]>,
      state: { inputValue: string },
    ) => {
      const input = (state.inputValue ?? "").trim().toLowerCase();
      const filtered = options.filter((opt) => {
        const label = (opt.label ?? "").toLowerCase();
        const valueStr = String(opt.value ?? "").toLowerCase();
        const docStr = (
          (opt as any)?.dni ??
          (opt as any)?.ruc ??
          opt.label ??
          ""
        )
          .toString()
          .toLowerCase();
        return (
          input === "" ||
          label.includes(input) ||
          valueStr.includes(input) ||
          docStr.includes(input)
        );
      });

      if (input) {
        const exists = filtered.some((opt) => {
          const label = (opt.label ?? "").toLowerCase();
          const valueStr = String(opt.value ?? "").toLowerCase();
          const docStr = (
            (opt as any)?.dni ??
            (opt as any)?.ruc ??
            opt.label ??
            ""
          )
            .toString()
            .toLowerCase();
          return label === input || valueStr === input || docStr === input;
        });

        if (!exists) {
          filtered.push({
            label: `Usar ${docLabel}: ${state.inputValue}`,
            value: state.inputValue,
            inputValue: state.inputValue,
          } as any);
        }
      }

      return filtered;
    },
    [docLabel],
  );

  const ticketPreviewProps = useMemo(() => {
    const safeItems = itemsToRender.length ? itemsToRender : purchasedItems;
    const safeTotals = itemsToRender.length ? totalsToRender : paidTotals;
    const selectedClientById = uniqueClients.find(
      (client) => Number(client.id) === Number(clienteId),
    );
    const selectedClientByName = uniqueClients.find(
      (client) =>
        safeTrim(client.nombreRazon).toLowerCase() ===
        safeTrim(customerName).toLowerCase(),
    );
    const selectedClient = selectedClientById ?? selectedClientByName ?? null;
    return {
      clientName: safeTrim(customerName) || "Ultimo cliente",
      clientId: safeTrim(selectedDocument),
      clientAddress:
        safeTrim((selectedClient as any)?.direccionFiscal ?? "") ||
        safeTrim((selectedClient as any)?.direccionDespacho ?? "") ||
        "-",
      docType: docTypeForTicket,
      paymentMethod,
      items: safeItems,
      totals: safeTotals,
      noteId: notaId,
      summary: {
        operacionGravada: Number(gravada.toFixed(2)),
        descuento: Number(descuento.toFixed(2)),
        showDiscount: applyDiscount,
        subtotal: Number(discountedTotal.toFixed(2)),
        igv: Number(igvAmount.toFixed(2)),
        total: Number(totalAPagar.toFixed(2)),
      },
      documentNumber,
      companyName:
        companyCommercialFromSession ||
        companyNameFromSession ||
        "CONSORCIO FERRETERO ROSITA E.I.R.L.",
      companyRuc: companyRucFromSession || "20601070155",
      companyAddress: companyAddressSunatFromSession || "Calle 2 Mz B Lote 1",
      companyDistrict: companyUbigeoNameFromSession || "LIMA",
    };
  }, [
    selectedDocument,
    uniqueClients,
    clienteId,
    customerName,
    docTypeForTicket,
    documentNumber,
    notaId,
    paymentMethod,
    itemsToRender,
    totalsToRender,
    purchasedItems,
    paidTotals,
    gravada,
    descuento,
    applyDiscount,
    discountedTotal,
    igvAmount,
    totalAPagar,
    companyCommercialFromSession,
    companyNameFromSession,
    companyRucFromSession,
    companyAddressSunatFromSession,
    companyUbigeoNameFromSession,
  ]);
  const previewKey = useMemo(
    () =>
      [
        docTypeCode,
        paymentMethod,
        ticketPreviewProps.clientName,
        ticketPreviewProps.clientId,
        ticketPreviewProps.documentNumber,
        totalAPagar.toFixed(2),
        descuento.toFixed(2),
        itemsToRender.length,
      ].join("|"),
    [
      docTypeCode,
      itemsToRender.length,
      paymentMethod,
      ticketPreviewProps.clientId,
      ticketPreviewProps.clientName,
      ticketPreviewProps.documentNumber,
      totalAPagar,
      descuento,
    ],
  );

  const notaPayload = useMemo(() => {
    const now = new Date();
    const today = getLocalDateISO(now);
    const safeItems = itemsToRender.length ? itemsToRender : purchasedItems;
    const base = gravada;
    const clienteIdNumber = Number(clienteId ?? 1) || 1;

    const bankValue = bankEntity?.trim() || "-";

    return {
      nota: {
        notaId: notaId ?? 0,
        notaDocu: docTypeName,
        clienteId: clienteIdNumber,
        notaFecha: `${today}T00:00:00`,
        notaUsuario: resolvedNotaUsuario,
        notaFormaPago: paymentMethod,
        notaCondicion: "ALCONTADO",
        notaDias: 1,
        notaFechaPago: now.toISOString(),
        notaDireccion: null,
        notaTelefono: null,
        notaSubtotal: Number(base.toFixed(2)),
        notaMovilidad: 0,
        notaDescuento: Number(descuento.toFixed(2)),
        notaTotal: Number(discountedTotal.toFixed(2)),
        notaAcuenta: 0,
        notaSaldo: Number(discountedTotal.toFixed(2)),
        notaAdicional: Number(notaAdicional.toFixed(2)),
        notaTarjeta: 0,
        notaPagar: Number(totalAPagar.toFixed(2)),
        notaEstado: "CANCELADO",
        companiaId: companyId,
        notaEntrega: "INMEDIATA",
        modificadoPor: null,
        fechaEdita: null,
        notaConcepto: "MERCADERIA",
        notaSerie,
        notaNumero: paddedNotaNumero || "00000000",
        notaGanancia: 0,
        icbper: 0,
        entidadBancaria: bankValue,
        nroOperacion: isCash ? "" : safeTrim(nroOperacion) || "",
        efectivo: isCash ? Number(totalAPagar.toFixed(2)) : 0,
        deposito: isCash ? 0 : Number(totalAPagar.toFixed(2)),
      },
      detalles: safeItems.map((item) => ({
        detalleId: (item as any).detalleId ?? 0,
        idProducto: item.productId,
        detalleCantidad: item.cantidad,
        detalleUm: safeTrim(item.unidadMedida ?? "UND").toUpperCase(),
        detalleDescripcion: item.nombre,
        detalleCosto: item.precio,
        detallePrecio: item.precio,
        detalleImporte: Number((item.precio * item.cantidad).toFixed(2)),
        detalleEstado: "PENDIENTE",
        cantidadSaldo: 0,
        valorUM: 1,
      })),
    };
  }, [
    bankEntity,
    notaId,
    companyId,
    clienteId,
    notaSerie,
    docTypeName,
    paddedNotaNumero,
    descuento,
    discountedTotal,
    gravada,
    itemsToRender,
    notaAdicional,
    nroOperacion,
    resolvedNotaUsuario,
    paymentMethod,
    purchasedItems,
    totalAPagar,
    isCash,
  ]);

  useEffect(() => {
    setCanPreviewPdf(true);
  }, []);

  useEffect(() => {
    if (!notaId || hasLoadedNotaMeta) return;
    fetchNotaFromServer(notaId).finally(() => setHasLoadedNotaMeta(true));
  }, [notaId, hasLoadedNotaMeta]);

  const confirmPayment = async () => {
    if (isReadOnlyNoteView) return;
    if (!ensureExistingCustomerByName(getValues("customerName"))) return;
    if (!ensureFacturaCustomerAndRuc()) return;

    const sourceItems = hasLiveItems ? items : purchasedItems;
    const sourceTotals = hasLiveItems ? totals : paidTotals;
    setPurchasedItems(sourceItems);
    setPaidTotals(sourceTotals);

    const isEditing = Boolean(notaId) && isEditingMode;
    const baseNota = { ...notaPayload.nota, notaId: notaId ?? 0 };
    const editNota = isEditing
      ? {
          notaId: baseNota.notaId,
          notaDocu: baseNota.notaDocu,
          clienteId: baseNota.clienteId,
          notaUsuario: baseNota.notaUsuario,
          notaFormaPago: baseNota.notaFormaPago,
          notaCondicion: baseNota.notaCondicion,
          notaSubtotal: baseNota.notaSubtotal,
          notaTotal: baseNota.notaTotal,
          notaPagar: baseNota.notaPagar,
          notaEntrega: baseNota.notaEntrega,
          notaSerie: baseNota.notaSerie,
          notaNumero: baseNota.notaNumero,
          companiaId: baseNota.companiaId,
          icbper: baseNota.icbper,
          entidadBancaria: baseNota.entidadBancaria,
          efectivo: baseNota.efectivo,
          deposito: baseNota.deposito,
          notaGanancia: baseNota.notaGanancia,
          notaConcepto: baseNota.notaConcepto,
          notaEstado: baseNota.notaEstado,
          modificadoPor: resolvedNotaUsuario,
          nroOperacion: baseNota.nroOperacion ?? "",
        }
      : baseNota;

    const detallesPayload: NotaDetallePayload[] = notaPayload.detalles.map(
      (detalle) => {
        const baseDetalle = {
          ...detalle,
          detalleId: (detalle as any).detalleId ?? 0,
        };
        if (!isEditing) return baseDetalle;
        return {
          detalleId: baseDetalle.detalleId,
          idProducto: baseDetalle.idProducto,
          detalleCantidad: baseDetalle.detalleCantidad,
          detalleUm: baseDetalle.detalleUm,
          detalleDescripcion: baseDetalle.detalleDescripcion,
          detalleCosto: baseDetalle.detalleCosto,
          detallePrecio: baseDetalle.detallePrecio,
          detalleImporte: baseDetalle.detalleImporte,
          detalleEstado: baseDetalle.detalleEstado,
          valorUM: baseDetalle.valorUM,
        };
      },
    );

    const basePayload = {
      nota: editNota,
      detalles: detallesPayload,
    };

    const requestDetalle = isEditing
      ? buildRequestDetalle(
          detallesPayload as any,
          serverItems.length ? serverItems : purchasedItems,
        )
      : undefined;
    const requestDetallePayload =
      requestDetalle && requestDetalle.length > 0 ? requestDetalle : undefined;

    const extractApiMessage = (val: any): string => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object") {
        const msg =
          (val as any).message ??
          (val as any).Message ??
          (val as any).error ??
          (val as any).Error ??
          (val as any).data ??
          (val as any).response?.data ??
          (val as any).response?.data?.message ??
          (val as any).response?.data?.error;
        if (typeof msg === "string") return msg;
      }
      return "";
    };

    const editPayloadForApi = isEditing
      ? {
          NotaId: editNota.notaId ?? 0,
          NotaDocu: editNota.notaDocu,
          ClienteId: editNota.clienteId,
          Usuario: editNota.notaUsuario,
          FormaPago: editNota.notaFormaPago,
          Condicion: editNota.notaCondicion,
          Direccion: editNota.notaDireccion ?? "",
          Telefono: editNota.notaTelefono ?? "",
          SubTotal: editNota.notaSubtotal,
          Movilidad: editNota.notaMovilidad,
          Descuento: editNota.notaDescuento,
          Total: editNota.notaTotal,
          Acuenta: editNota.notaAcuenta,
          Saldo: editNota.notaSaldo,
          Adicional: editNota.notaAdicional,
          Tarjeta: editNota.notaTarjeta,
          Pagar: editNota.notaPagar,
          CompaniaId: editNota.companiaId,
          Entrega: editNota.notaEntrega,
          ModificadoPor: editNota.modificadoPor ?? resolvedNotaUsuario,
          Serie: editNota.notaSerie,
          Numero: editNota.notaNumero,
          Ganancia: editNota.notaGanancia,
          NotaConcepto: editNota.notaConcepto ?? "MERCADERIA",
          ICBPER: editNota.icbper,
          IGV: Number(igvAmount.toFixed(2)),
          DocuGravada: Number(gravada.toFixed(2)),
          DocuDescuento: Number(descuento.toFixed(2)),
          EntidadBancaria: editNota.entidadBancaria,
          NroOperacion: editNota.nroOperacion ?? "",
          Efectivo: editNota.efectivo,
          Deposito: editNota.deposito,
          ClienteRazon: safeTrim(customerName),
          ClienteRuc: docTypeCode === "01" ? safeTrim(selectedDocument) : "",
          ClienteDni: docTypeCode !== "01" ? safeTrim(selectedDocument) : "",
          DireccionFiscal: "",
          Items: detallesPayload.length,
          ...(requestDetallePayload
            ? { requestDetalle: requestDetallePayload }
            : {}),
        }
      : basePayload;

    const result = await apiRequest({
      url: isEditing
        ? buildApiUrl("/Nota/editarOrden")
        : buildApiUrl("/Nota/crearOrden"),
      method: isEditing ? "PUT" : "POST",
      data: editPayloadForApi,
      config: {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      },
      fallback: null,
    });

    const apiMessage = extractApiMessage(result);
    const normalizedMessage = apiMessage
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (normalizedMessage.includes("aperturo caja")) {
      toast.error(apiMessage || "No Aperturó Caja");
      return;
    }

    if (!result || (result as any) === false) {
      toast.error("No se pudo registrar la nota.");
      return;
    }

    const parseNotaId = (val: any): number | null => {
      if (val === null || val === undefined) return null;
      if (typeof val === "number") {
        return Number.isFinite(val) ? val : null;
      }
      if (typeof val === "string") {
        const match = val.match(/\d+/);
        if (match?.[0]) {
          const numeric = Number(match[0]);
          return Number.isFinite(numeric) ? numeric : null;
        }
      }
      const nested =
        (val as any)?.notaId ??
        (val as any)?.nota?.notaId ??
        (val as any)?.idNota ??
        (val as any)?.data?.notaId ??
        (val as any)?.data?.idNota ??
        (val as any)?.data;

      if (typeof nested === "number") {
        return Number.isFinite(nested) ? nested : null;
      }
      if (typeof nested === "string") {
        const matchNested = nested.match(/\d+/);
        if (matchNested?.[0]) {
          const numeric = Number(matchNested[0]);
          return Number.isFinite(numeric) ? numeric : null;
        }
      }
      return null;
    };

    const parseNotaCorrelative = (val: any): string | null => {
      if (val && typeof val === "object") {
        const objNumber = safeTrim(
          (val as any).notaNumero ??
            (val as any).numero ??
            (val as any).Numero ??
            (val as any).NotaNumero ??
            (val as any)?.nota?.notaNumero ??
            (val as any)?.data?.notaNumero ??
            (val as any)?.data?.numero ??
            (val as any)?.data?.Numero ??
            "",
        );
        const objDigits = objNumber.replace(/\D/g, "");
        if (objDigits) return objDigits.padStart(8, "0");
      }

      const resolveString = (): string => {
        if (typeof val === "string") return val;
        if (val && typeof (val as any).data === "string")
          return (val as any).data;
        if (val && typeof (val as any).message === "string")
          return (val as any).message;
        return "";
      };

      const raw = resolveString();
      if (!raw) return null;

      if (raw.includes("¬")) {
        const [, correlativeRaw = ""] = raw.split("¬");
        const digits = correlativeRaw.match(/\d+/)?.[0] ?? correlativeRaw;
        const normalized = (digits ?? "").replace(/\D/g, "");
        return normalized ? normalized.padStart(8, "0") : null;
      }

      const matches = raw.match(/(\d+)/g);
      if (matches && matches.length >= 2) {
        const candidate = matches[matches.length - 1] ?? "";
        const normalized = candidate.replace(/\D/g, "");
        return normalized ? normalized.padStart(8, "0") : null;
      }

      return null;
    };

    const parsedNotaId = isEditing ? notaId : parseNotaId(result);
    const parsedNotaCorrelative = parseNotaCorrelative(result);
    if (parsedNotaCorrelative) {
      setNotaNumero(parsedNotaCorrelative);
    }
    if (!isEditing && parsedNotaId) {
      const numericNotaId = Number(parsedNotaId);
      setNotaId(numericNotaId);
      setEditingNotaInStore(numericNotaId);
      setEditingModeInStore(false); // creación no activa edición
      setServerItemsInStore(
        serverItems.length
          ? serverItems
          : purchasedItems.length
            ? purchasedItems
            : items,
      );
      await fetchNotaFromServer(numericNotaId);
      // Rehabilita el formulario para permitir cambios posteriores
      setIsConfirmed(false);
    }

    if (isEditingMode) {
      setEditingModeInStore(false);
    }

    refetchProducts();

    toast.success(isEditing ? "Orden actualizada" : "Pago registrado");
    if (!isEditing && hasLiveItems && items.length) {
      clearCart();
    }
    setIsConfirmed(true);
    handlePrint();
  };

  const handleBackToPos = (ev?: MouseEvent) => {
    ev?.preventDefault();
    if (isOrderNotesFlow) {
      clearEditingNota();
      navigate(backRoute);
      return;
    }

    const itemsForReturn =
      isEditingMode && items.length
        ? items
        : purchasedItems.length > 0
          ? purchasedItems
          : serverItems.length > 0
            ? serverItems
            : items;

    if (isEditingMode && notaId && itemsForReturn.length) {
      setStoreItems(itemsForReturn);
      setPaidTotals(computeTotalsFromItems(itemsForReturn));
      setEditingNotaInStore(notaId);
      setServerItemsInStore(serverItems.length ? serverItems : itemsForReturn);
      navigate(backRoute, { state: { preserveCart: true } });
      return;
    }

    clearEditingNota();
    // Si aún no se ha confirmado/guardado la nota inicial, conservar el carrito
    if (!notaId && !isConfirmed) {
      navigate(backRoute, { state: { preserveCart: true } });
      return;
    }

    if (items.length) {
      setPurchasedItems(items);
      setPaidTotals(totals);
    }
    clearCart();
    navigate(backRoute);
  };

  const handleEnableEditing = () => {
    if (!notaId) return;
    if (isReadOnlyNoteView) {
      navigate(`/sales/order_notes/${notaId}/edit`);
      return;
    }
    setIsConfirmed(false);
    setEditingNotaInStore(notaId);
    setEditingModeInStore(true);
    setServerItemsInStore(serverItems.length ? serverItems : purchasedItems);
  };

  const createComprobanteBlob = useCallback(
    async () => pdf(<TicketDocument {...ticketPreviewProps} />).toBlob(),
    [ticketPreviewProps],
  );

  const getComprobanteFileName = useCallback(() => {
    const safeCorrelative =
      safeTrim(documentNumber).replace(/[^a-zA-Z0-9-_]/g, "_") ||
      `COMPROBANTE_${Date.now()}`;
    return `${safeCorrelative}.pdf`;
  }, [documentNumber]);

  const downloadComprobante = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, []);

  const shareByWhatsApp = useCallback(async () => {
    const safeDocNumber = safeTrim(documentNumber) || "SIN-NUMERO";
    const message = [
      `Comprobante: ${safeDocNumber}`,
      `Cliente: ${safeTrim(customerName) || "PUBLICO GENERAL"}`,
      `Total: S/ ${totalAPagar.toFixed(2)}`,
    ].join("\n");

    const blob = await createComprobanteBlob();
    const fileName = getComprobanteFileName();
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (typeof navigator.share === "function") {
      try {
        const canShareFile =
          typeof navigator.canShare === "function"
            ? navigator.canShare({ files: [file] })
            : true;

        if (canShareFile) {
          await navigator.share({
            title: "Comprobante de pago",
            text: message,
            files: [file],
          });
          toast.success("Panel de compartir abierto.");
          return;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    downloadComprobante(blob, fileName);
    toast.info(
      "No se pudo abrir el panel de compartir. Se descargo el PDF para enviarlo manualmente.",
    );
  }, [
    createComprobanteBlob,
    customerName,
    documentNumber,
    downloadComprobante,
    getComprobanteFileName,
    totalAPagar,
  ]);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await createComprobanteBlob();

      /** const res = await fetch("http://localhost:3000/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: base64, printerName }),
      });
      const data = await res.json(); 
       if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al imprimir");
      }
      toast.success("Impresión enviada");
      */
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo imprimir";
      toast.error(message);
    } finally {
      setIsPrinting(false);
    }
  };
  if (!itemsToRender.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <ArrowLeft className="w-4 h-4" />
          <Link
            to={backRoute}
            className="text-blue-600 hover:underline"
            onClick={(e) => handleBackToPos(e)}
          >
            {backLabel}
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">
          No hay ítems para pagar.
        </div>
      </div>
    );
  }

  const ItemsList = (
    <div
      data-payment-items-list="true"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="sm:hidden max-h-[62vh] overflow-y-auto divide-y divide-slate-200">
        {itemsToRender.map((item) => {
          const isZeroOrNegative = (item.cantidad ?? 0) <= 0;
          const isStockNegative = Number(item.stock ?? 0) < 0;
          const minPrice = Math.max(0, Number(item.precioMinimo ?? 0) || 0);

          return (
            <article
              key={item.productId}
              className={`p-3 ${
                isZeroOrNegative || isStockNegative
                  ? "bg-red-50/70"
                  : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold leading-snug text-slate-900">
                    {item.nombre}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.unidadMedida || "UND"}
                    {item.stock !== undefined ? ` · Stock: ${item.stock}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="h-7 w-7 shrink-0 rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handleRemoveItem(item.productId)}
                  disabled={!canEditItems}
                  title="Quitar"
                >
                  <Trash2 className="mx-auto h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Cantidad
                  </p>
                  {canEditItems ? (
                    <input
                      type="number"
                      min={0}
                      step="1"
                      inputMode="numeric"
                      className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-center text-sm outline-none appearance-none [appearance:textfield] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      value={item.cantidad === 0 ? "" : item.cantidad}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          handleQuantityChange(item, -item.cantidad);
                          return;
                        }
                        const parsed = Number(value);
                        if (Number.isNaN(parsed)) return;
                        const desired = Math.max(0, parsed);
                        handleQuantityChange(
                          item,
                          desired - (item.cantidad ?? 0),
                        );
                      }}
                      onFocus={(e) => e.target.select()}
                      disabled={!canEditItems}
                      style={{ MozAppearance: "textfield" }}
                    />
                  ) : (
                    <p className="mt-1 text-base font-semibold text-slate-800">
                      {item.cantidad}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    P. Uni
                  </p>
                  {canEditItems ? (
                    <div className="mt-1 inline-flex h-9 w-full items-center gap-1 rounded-md border border-slate-300 bg-white px-2">
                      <span className="text-xs text-slate-500">S/</span>
                      <input
                        type="number"
                        min={minPrice}
                        step="0.01"
                        inputMode="decimal"
                        className="w-full border-0 bg-transparent text-right text-sm outline-none appearance-none [appearance:textfield] disabled:text-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        value={priceDrafts[item.productId] ?? item.precio}
                        onChange={(e) => {
                          handlePriceChange(item, e.target.value);
                        }}
                        onBlur={(e) => {
                          handlePriceBlur(
                            item,
                            e.currentTarget.value,
                            e.currentTarget,
                          );
                        }}
                        onFocus={(e) => e.target.select()}
                        disabled={!canEditItems}
                        style={{ MozAppearance: "textfield" }}
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-base font-semibold text-slate-800">
                      S/ {item.precio.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Importe
                    </p>
                    <p
                      className={`text-lg font-semibold ${
                        isZeroOrNegative ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      S/ {(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden sm:block max-h-[min(58vh,620px)] md:max-h-[60vh] overflow-auto">
        <div className="min-w-[640px]">
          <div className="sticky top-0 z-10 grid grid-cols-[96px_minmax(0,1fr)_120px_130px] border-b-2 border-slate-800 bg-white px-3 py-2 text-sm font-semibold tracking-wide text-slate-800">
            <div className="text-center">Cantidad</div>
            <div>Descripción</div>
            <div className="text-right">P.Uni</div>
            <div className="text-right">Importe</div>
          </div>

          <div className="divide-y divide-slate-200">
            {itemsToRender.map((item, rowIndex) => {
              const isZeroOrNegative = (item.cantidad ?? 0) <= 0;
              const isStockNegative = Number(item.stock ?? 0) < 0;
              const minPrice = Math.max(0, Number(item.precioMinimo ?? 0) || 0);

              return (
                <div
                  key={item.productId}
                  className={`grid grid-cols-[96px_minmax(0,1fr)_120px_130px] items-start px-3 py-3 ${
                    isZeroOrNegative || isStockNegative
                      ? "bg-red-50/70"
                      : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-center pt-1">
                    {canEditItems ? (
                      <input
                        type="number"
                        min={0}
                        step="1"
                        inputMode="numeric"
                        data-payment-column="quantity"
                        data-payment-row-index={rowIndex}
                        className="h-9 w-16 rounded-md border border-slate-300 py-1 text-center text-sm outline-none appearance-none [appearance:textfield] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        value={item.cantidad === 0 ? "" : item.cantidad}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            handleQuantityChange(item, -item.cantidad);
                            return;
                          }
                          const parsed = Number(value);
                          if (Number.isNaN(parsed)) return;
                          const desired = Math.max(0, parsed);
                          handleQuantityChange(
                            item,
                            desired - (item.cantidad ?? 0),
                          );
                        }}
                        onKeyDown={(event) =>
                          handleColumnArrowNavigation(
                            event,
                            "quantity",
                            rowIndex,
                          )
                        }
                        onFocus={(e) => e.target.select()}
                        disabled={!canEditItems}
                        style={{ MozAppearance: "textfield" }}
                      />
                    ) : (
                      <span className="inline-flex h-9 min-w-10 items-center justify-center text-lg">
                        {item.cantidad}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 pr-3">
                    <p className="break-words text-base leading-snug text-slate-900">
                      {item.nombre}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.unidadMedida || "UND"}
                      {item.stock !== undefined
                        ? ` · Stock: ${item.stock}`
                        : ""}
                    </p>
                  </div>

                  <div className="pt-1 text-right">
                    {canEditItems ? (
                      <div className="inline-flex h-9 items-center justify-end gap-1 rounded-md border border-slate-300 bg-white px-2">
                        <span className="text-xs text-slate-500">S/</span>
                        <input
                          type="number"
                          min={minPrice}
                          step="0.01"
                          inputMode="decimal"
                          data-payment-column="price"
                          data-payment-row-index={rowIndex}
                          className="w-16 border-0 bg-transparent text-right text-sm outline-none appearance-none [appearance:textfield] disabled:text-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          value={priceDrafts[item.productId] ?? item.precio}
                          onChange={(e) => {
                            handlePriceChange(item, e.target.value);
                          }}
                          onBlur={(e) => {
                            handlePriceBlur(
                              item,
                              e.currentTarget.value,
                              e.currentTarget,
                            );
                          }}
                          onKeyDown={(event) =>
                            handleColumnArrowNavigation(
                              event,
                              "price",
                              rowIndex,
                            )
                          }
                          onFocus={(e) => e.target.select()}
                          disabled={!canEditItems}
                          style={{ MozAppearance: "textfield" }}
                        />
                      </div>
                    ) : (
                      <span className="inline-block pt-1 text-xl leading-none text-slate-900">
                        {item.precio.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="pt-1">
                    <div className="flex items-start justify-end gap-2">
                      <p
                        className={`pt-1 text-right text-xl leading-none ${
                          isZeroOrNegative ? "text-red-600" : "text-slate-900"
                        }`}
                      >
                        {(item.precio * item.cantidad).toFixed(2)}
                      </p>
                      <button
                        type="button"
                        className="h-6 w-6 shrink-0 rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => handleRemoveItem(item.productId)}
                        disabled={!canEditItems}
                        title="Quitar"
                      >
                        <Trash2 className="mx-auto h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const PdfViewerCard = (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {canPreviewPdf ? (
        <div className="h-[68vh] min-h-[420px] sm:h-[620px]">
          <PDFViewer
            key={previewKey}
            style={{ width: "100%", height: "100%" }}
            showToolbar={isConfirmed}
          >
            <TicketDocument {...ticketPreviewProps} />
          </PDFViewer>
        </div>
      ) : (
        <div className="p-4 text-xs text-gray-500">
          Cargando vista previa del comprobante...
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <>
      <HookForm
        methods={formMethods}
        onSubmit={confirmPayment}
        preventSubmitOnEnter
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="fixed inset-x-0 top-0 z-[90] px-3 pt-2 md:hidden">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {!formLocked && (
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar
                </button>
              )}
              {isConfirmed && isProforma && (
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-medium text-orange-800 transition-colors hover:bg-orange-50"
                  onClick={handleEnableEditing}
                >
                  {isReadOnlyNoteView ? "Ir a edición" : "Editar"}
                </button>
              )}
              {isConfirmed && (
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-medium text-green-800 transition-colors hover:bg-green-100"
                  onClick={() => {
                    void shareByWhatsApp();
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </button>
              )}
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-50"
                onClick={() => handlePrint()}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4" />
                {isPrinting ? "Imprimiendo..." : "Imprimir"}
              </button>
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50"
                onClick={handleBackToPos}
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </button>
            </div>
          </div>
        </div>
        <div className="h-20 md:hidden" />

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Ítems
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {itemsToRender.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Total
            </p>
            <p className="text-sm font-semibold text-slate-800">
              S/ {totalAPagar.toFixed(2)}
            </p>
          </div>
        </div>

        <HookFormSelect
          name="docTypeCode"
          label="Tipo de documento"
          disabled={formLocked}
          options={[
            { value: "101", label: "Proforma V" },
            { value: "03", label: "Boleta" },
            { value: "01", label: "Factura" },
          ]}
        />
        <HookFormSelect
          name="paymentMethod"
          label="Forma de pago"
          disabled={formLocked}
          options={[
            { value: "EFECTIVO", label: "Efectivo" },
            { value: "TARJETA", label: "Tarjeta" },
            { value: "TRANSFERENCIA", label: "Transferencia" },
            { value: "YAPE", label: "Yape" },
          ]}
        />
        <HookFormAutocomplete
          name="customerName"
          label="Nombre del cliente"
          placeholder="Seleccionar cliente"
          options={clientOptions}
          rules={{
            validate: (value: any) => {
              if (docTypeCode !== "01") return true;
              const normalized = safeTrim(value);
              return normalized
                ? true
                : "Nombre de cliente obligatorio para Factura";
            },
          }}
          syncInputToValue
          disableClearable={formLocked}
          disabled={formLocked}
          onInputBlur={({ inputValue }) => {
            ensureExistingCustomerByName(inputValue);
          }}
          onOptionSelected={(opt: any) => {
            if (!opt) {
              setValue("customerName", "", { shouldDirty: true });
              setValue("customerId", "", { shouldDirty: true });
              setClienteIdFromOption(null, { shouldDirty: true });
              return;
            }

            const selectedName = safeTrim(opt.nombreRazon ?? opt.label ?? "");
            const docValue =
              docTypeCode === "01" ? safeTrim(opt.ruc) : safeTrim(opt.dni);

            setValue("customerName", selectedName, { shouldDirty: true });
            setValue("customerId", docValue || "", { shouldDirty: true });
            setClienteIdFromOption(opt, { shouldDirty: true });
          }}
        />
        {docTypeCode === "01" ? (
          <HookFormAutocomplete
            name="customerId"
            label="RUC"
            placeholder="Número de RUC"
            options={rucOptions}
            rules={{ validate: validateRucLength }}
            disableClearable={formLocked}
            disabled={formLocked}
            allowCreate
            createLabel={(value: string) => `Usar RUC: ${value}`}
            filterOptions={documentFilterOptions as any}
            isOptionEqualToValue={(option: any, value: any) =>
              String(option?.value) === String((value as any)?.value ?? value)
            }
            onOptionSelected={(opt: any) => {
              if (!opt) {
                setValue("customerId", "", { shouldDirty: true });
                setClienteIdFromOption(null, { shouldDirty: true });
                return;
              }

              const selectedDoc = resolveDocumentValue(opt, "ruc");
              const selectedName = safeTrim(opt?.nombreRazon ?? "");

              setValue("customerId", selectedDoc, { shouldDirty: true });
              if (selectedName) {
                setValue("customerName", selectedName, { shouldDirty: true });
                setClienteIdFromOption(opt, { shouldDirty: true });
                return;
              }

              // Documento manual (freeSolo): no cliente asociado.
              setClienteIdFromOption(null, { shouldDirty: true });
            }}
          />
        ) : (
          <HookFormAutocomplete
            name="customerId"
            label="DNI"
            placeholder="Número de DNI"
            options={dniOptions}
            rules={{ validate: validateDniLength }}
            disableClearable={formLocked}
            disabled={formLocked}
            allowCreate
            createLabel={(value: string) => `Usar DNI: ${value}`}
            filterOptions={documentFilterOptions as any}
            isOptionEqualToValue={(option: any, value: any) =>
              String(option?.value) === String((value as any)?.value ?? value)
            }
            onOptionSelected={(opt: any) => {
              if (!opt) {
                setValue("customerId", "", { shouldDirty: true });
                setClienteIdFromOption(null, { shouldDirty: true });
                return;
              }

              const selectedDoc = resolveDocumentValue(opt, "dni");
              const selectedName = safeTrim(opt?.nombreRazon ?? "");

              setValue("customerId", selectedDoc, { shouldDirty: true });
              if (selectedName) {
                setValue("customerName", selectedName, { shouldDirty: true });
                setClienteIdFromOption(opt, { shouldDirty: true });
                return;
              }

              // Documento manual (freeSolo): no cliente asociado.
              setClienteIdFromOption(null, { shouldDirty: true });
            }}
          />
        )}
        {!formLocked && (
          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            onClick={handleOpenCreateClientModal}
          >
            <UserPlus className="h-4 w-4" />
            Agregar cliente
          </button>
        )}
        {paymentMethod !== "EFECTIVO" && (
          <HookFormSelect
            name="bankEntity"
            label="Entidad bancaria"
            disabled={formLocked || paymentMethod === "TARJETA"}
            rules={{
              validate: (value: any) => {
                if (
                  paymentMethod !== "YAPE" &&
                  paymentMethod !== "TRANSFERENCIA"
                ) {
                  return true;
                }
                const normalized = safeTrim(value);
                return normalized && normalized !== "-"
                  ? true
                  : "Entidad bancaria obligatoria";
              },
            }}
            options={[
              { value: "-", label: "-" },
              { value: "BCP", label: "BCP" },
              { value: "INTERBANK", label: "INTERBANK" },
              { value: "CONTINENTAL", label: "CONTINENTAL" },
            ]}
          />
        )}
        {paymentMethod !== "EFECTIVO" && (
          <HookFormInput
            name="nroOperacion"
            label="N° Operación"
            disabled={formLocked}
            placeholder="Número de operación"
            rules={{
              validate: (value: any) => {
                if (
                  paymentMethod !== "TARJETA" &&
                  paymentMethod !== "YAPE" &&
                  paymentMethod !== "TRANSFERENCIA"
                ) {
                  return true;
                }
                return safeTrim(value) ? true : "N° de operación obligatorio";
              },
            }}
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-700">
          <span className="font-medium">Aplica descuento</span>
          <input
            type="checkbox"
            className="w-4 h-4 accent-slate-700 rounded"
            disabled={formLocked}
            checked={applyDiscount}
            {...register("applyDiscount", {
              onChange: (e) => {
                const checked = Boolean(e.target.checked);
                setValue("applyDiscount", checked, {
                  shouldDirty: true,
                });
                if (!checked || formLocked) return;
                window.setTimeout(() => {
                  const input = document.querySelector<HTMLInputElement>(
                    '[data-discount-input="true"]',
                  );
                  if (!input || input.disabled) return;
                  input.focus();
                  input.select?.();
                }, 0);
              },
            })}
          />
        </div>
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex justify-between text-sm text-gray-700">
            <span>Op. gravada</span>
            <span className="font-semibold">S/ {gravada.toFixed(2)}</span>
          </div>

          {applyDiscount && (
            <div className="flex items-center justify-between gap-3 text-sm text-gray-700">
              <span>Descuento</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">S/</span>
                <HookFormInput
                  name="discount"
                  label=""
                  type="number"
                  min={0}
                  max={Number(maxDiscount.toFixed(2))}
                  step="0.01"
                  data-discount-input="true"
                  rules={{
                    validate: (value: any) => {
                      const numeric = Number(value ?? 0);
                      if (!Number.isFinite(numeric))
                        return "Descuento inválido";
                      if (numeric < 0)
                        return "El descuento no puede ser negativo";
                      return (
                        numeric <= maxDiscount ||
                        `No puede superar S/ ${maxDiscount.toFixed(2)}`
                      );
                    },
                  }}
                  className="w-20 text-right appearance-none sm:w-16 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  style={{ MozAppearance: "textfield" }}
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => {
                    const currentValue = Number(e.currentTarget.value ?? 0);
                    const clampedValue = clampDiscount(e.currentTarget.value);
                    if (
                      !Number.isFinite(currentValue) ||
                      currentValue !== clampedValue
                    ) {
                      setValue("discount", clampedValue, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  disabled={formLocked}
                />
              </div>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-700">
            <span>Sub total</span>
            <span className="font-semibold">S/ {gravada.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-700">
            <span>IGV (18%)</span>
            <span className="font-semibold">S/ {igvAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-800">
            <span>Total pago</span>
            <span>S/ {totalAPagar.toFixed(2)}</span>
          </div>
        </div>
        {!formLocked && (
          <button
            type="submit"
            className="hidden w-full items-center justify-center gap-2 rounded-lg bg-slate-700 py-3 font-semibold text-white transition-colors hover:bg-slate-800 md:inline-flex"
            disabled={isSubmitting}
          >
            <CheckCircle2 className="w-5 h-5" />
            Confirmar pago
          </button>
        )}
      </HookForm>
      <div className="hidden gap-2 sm:gap-3 md:grid">
        {isConfirmed && isProforma && (
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-300 bg-white py-2.5 text-orange-800 transition-colors hover:bg-orange-50"
            onClick={handleEnableEditing}
          >
            {isReadOnlyNoteView ? "Ir a edición" : "Editar"}
          </button>
        )}
        {isConfirmed && (
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-300 bg-green-50 py-2.5 text-green-800 transition-colors hover:bg-green-100"
            onClick={() => {
              void shareByWhatsApp();
            }}
          >
            <MessageCircle className="w-5 h-5" />
            Enviar por WhatsApp
          </button>
        )}
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-50"
          onClick={() => handlePrint()}
          disabled={isPrinting}
        >
          <Printer className="w-5 h-5" />
          {isPrinting ? "Imprimiendo..." : "Imprimir comprobante"}
        </button>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-800 transition-colors hover:bg-slate-50"
          onClick={handleBackToPos}
        >
          <ArrowLeft className="w-5 h-5" />
          {backLabel}
        </button>
      </div>
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Confirmar cobro</p>
          <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
            Pago y comprobante
          </h1>
        </div>
        <Link
          to={backRoute}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          onClick={(e) => handleBackToPos(e)}
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      </div>
      {/* Layout móvil/mediano: tabs combinados + formulario */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-5 min-[1405px]:hidden">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-1 border-b border-slate-200 p-2 bg-slate-50">
              <button
                type="button"
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 sm:px-4 sm:py-3 ${
                  activeTab === "items"
                    ? "text-white bg-gradient-to-r from-slate-700 to-slate-800 shadow-md"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("items")}
              >
                Items ({itemsToRender.length})
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 sm:px-4 sm:py-3 ${
                  activeTab === "pdf"
                    ? "text-white bg-gradient-to-r from-slate-700 to-slate-800 shadow-md"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("pdf")}
              >
                Comprobante
              </button>
            </div>

            <div className="p-3 sm:p-5">
              {activeTab === "items" && ItemsList}
              {activeTab === "pdf" && PdfViewerCard}
            </div>
          </div>
        </section>

        <section className="space-y-4">{renderForm()}</section>
      </div>

      {/* Layout grande: 3 columnas optimizadas */}
      <div className="hidden min-[1405px]:grid grid-cols-[1.3fr_1.1fr_1fr] gap-5">
        {/* Comprobante PDF */}
        <section className="space-y-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
            {PdfViewerCard}
          </div>
        </section>

        {/* Items a cobrar */}
        <section className="space-y-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                Items a cobrar
              </h2>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {itemsToRender.length}
              </span>
            </div>
            {ItemsList}
          </div>
        </section>

        {/* Formulario */}
        <section className="space-y-3">{renderForm()}</section>
      </div>
    </div>
  );
};

export default PaymentPage;

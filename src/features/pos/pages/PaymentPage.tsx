import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate, Link } from "react-router";
import {
  CheckCircle2,
  ArrowLeft,
  Printer,
  Receipt,
  MessageCircle,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { useForm, useWatch } from "react-hook-form";
import { usePosStore, selectTotals } from "@/store/pos/pos.store";
import { toast } from "sonner";
import TicketDocument from "@/components/Ticket";
import { useDialogStore } from "@/store/app/dialog.store";
import { apiRequest } from "@/shared/helpers/apiRequest";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormAutocomplete } from "@/components/forms/HookFormAutocomplete";
import { useClientsStore } from "@/store/customers/customers.store";
import { useProductsStore } from "@/store/products/products.store";
import type { PosCartItem } from "@/types/pos";

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
  const navigate = useNavigate();
  const openDialog = useDialogStore((s) => s.openDialog);
  const { clients, fetchClients } = useClientsStore();
  const { fetchProducts: refetchProducts } = useProductsStore();
  const safeTrim = (value: unknown) => String(value ?? "").trim();
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
    editingNotaIdFromStore ?? null,
  );
  const [notaNumero, setNotaNumero] = useState<string>("");
  const [notaSerieOverride, setNotaSerieOverride] = useState<string | null>(
    null,
  );
  const [hasLoadedNotaMeta, setHasLoadedNotaMeta] = useState(false);
  const [activeTab, setActiveTab] = useState<"items" | "pdf">("items");
  const whatsappNumberInputRef = useRef<HTMLInputElement | null>(null);

  const docTypeConfig: Record<
    "03" | "01" | "101",
    { docu: string; serie: string; label: string }
  > = {
    "03": { docu: "BOLETA", serie: "BA01", label: "Boleta" },
    "01": { docu: "FACTURA", serie: "FA01", label: "Factura" },
    "101": { docu: "PROFORMA V", serie: "0001", label: "Proforma V" },
  };

  const { companyId, usernameFromSession } = useMemo(() => {
    if (typeof window === "undefined") {
      return { companyId: 1, usernameFromSession: "USUARIO" };
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

    return {
      companyId: safeCompanyId,
      usernameFromSession: username || "USUARIO",
    };
  }, []);

  const hasLiveItems = items.length > 0;
  const itemsToRender = hasLiveItems ? items : purchasedItems;
  const totalsToRender = hasLiveItems ? totals : paidTotals;
  const canEditItems = hasLiveItems || isEditingMode;

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

  const handlePriceChange = (item: PosCartItem, value: string) => {
    if (!canEditItems) return;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const nextPrice = Math.max(0, parsed);

    if (hasLiveItems) {
      updatePrice(item.productId, nextPrice);
      return;
    }

    adjustLocalItems((prev) =>
      prev.map((it) =>
        it.productId === item.productId ? { ...it, precio: nextPrice } : it,
      ),
    );
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
    register,
    control,
    handleSubmit,
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
  const docTypeForTicket =
    docTypeCode === "01"
      ? "factura"
      : docTypeCode === "101"
        ? "proforma"
        : "boleta";
  const isProforma = docTypeCode === "101";
  const totalAmount = totalsToRender?.total ?? 0;
  const descuento = applyDiscount
    ? Math.max(0, Number(discountInput ?? 0) || 0)
    : 0;
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
      precio: Number.isFinite(precio) ? precio : 0,
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
          url: `http://localhost:5000/api/v1/Nota/${notaIdToLoad}`,
          method: "GET",
          config: { headers: { Accept: "text/plain" } },
          fallback: null,
        }),
        apiRequest({
          url: `http://localhost:5000/api/v1/Nota/${notaIdToLoad}/detalles`,
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
      console.log("Nota sincronizada", {
        notaId: notaIdToLoad,
        notaResponse,
        detallesResponse,
        mappedItems,
      });

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
    if (paymentMethod === "EFECTIVO") {
      setValue("bankEntity", "-");
      setValue("nroOperacion", "");
    } else if (paymentMethod === "TARJETA") {
      setValue("bankEntity", bankEntity || "BCP");
      setValue("nroOperacion", "");
    } else {
      setValue("bankEntity", "");
      setValue("nroOperacion", "");
    }
  }, [paymentMethod, bankEntity, setValue]);

  const lastDocTypeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!clients.length) {
      fetchClients();
    }
  }, [clients.length, fetchClients]);

  // En nuevo registro, preselecciona cliente ID 1 (sin afectar edici�n)
  useEffect(() => {
    if (notaId || isEditingMode || hasLoadedNotaMeta) return;
    const hasClientAlready =
      (Number(clienteId) ?? 0) > 0 ||
      safeTrim(customerName) ||
      safeTrim(customerId);
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
    customerName,
    customerId,
    setValue,
  ]);

  useEffect(() => {
    if (!applyDiscount) {
      setValue("discount", 0, { shouldDirty: true });
    }
  }, [applyDiscount, setValue]);

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
    const hasCustomerData = safeTrim(customerId) || safeTrim(customerName);
    if (!hasCustomerData) return;

    setValue("customerId", "", { shouldDirty: false });
    setValue("customerName", "", { shouldDirty: false });
  }, [
    docTypeCode,
    dirtyFields?.docTypeCode,
    customerId,
    customerName,
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
    (opt: any) => {
      const candidate =
        opt?.id ??
        opt?.clienteId ??
        opt?.clientId ??
        (typeof opt?.value === "number" ? opt.value : undefined);
      const numeric = Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) {
        setValue("clienteId", numeric, { shouldDirty: true });
      }
    },
    [setValue],
  );

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
          value:
            client.id !== undefined && client.id !== null
              ? client.id
              : (client.dni ?? "").trim() || (client.nombreRazon ?? "").trim(),
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
          value:
            client.id !== undefined && client.id !== null
              ? client.id
              : (client.ruc ?? "").trim() || (client.nombreRazon ?? "").trim(),
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

  // Sincroniza: cambio en customerId (DNI/RUC) actualiza nombre y clienteId
  useEffect(() => {
    const docOptions = docTypeCode === "01" ? rucOptions : dniOptions;
    const normalizedDoc = safeTrim(customerId).toLowerCase();
    if (!normalizedDoc) return;

    const match = docOptions.find((opt) => {
      const valueStr = safeTrim(String(opt.value)).toLowerCase();
      const labelStr = safeTrim(opt.label ?? "").toLowerCase();
      const docStr = safeTrim(
        (opt as any)?.dni ?? (opt as any)?.ruc ?? "",
      ).toLowerCase();
      return (
        valueStr === normalizedDoc ||
        labelStr === normalizedDoc ||
        docStr === normalizedDoc
      );
    });

    if (!match) return;

    const nameFromMatch = safeTrim(
      (match as any).nombreRazon ?? match.label ?? "",
    );
    if (nameFromMatch && safeTrim(customerName) !== nameFromMatch) {
      setValue("customerName", nameFromMatch, { shouldDirty: false });
    }

    const numericId = Number((match as any).id);
    if (
      Number.isFinite(numericId) &&
      numericId > 0 &&
      Number(clienteId) !== numericId
    ) {
      setValue("clienteId", numericId, { shouldDirty: false });
    }
  }, [
    customerId,
    customerName,
    clienteId,
    docTypeCode,
    dniOptions,
    rucOptions,
    setValue,
  ]);

  // Sincroniza: cambio en customerName actualiza documento y clienteId
  useEffect(() => {
    const normalizedName = safeTrim(customerName).toLowerCase();
    if (!normalizedName) return;

    const match = clientOptions.find(
      (opt) => safeTrim(opt.label).toLowerCase() === normalizedName,
    );
    if (!match) return;

    const docFromMatch =
      docTypeCode === "01"
        ? safeTrim((match as any).ruc ?? "")
        : safeTrim((match as any).dni ?? "");

    if (docFromMatch && safeTrim(customerId) !== docFromMatch) {
      setValue("customerId", docFromMatch, { shouldDirty: false });
    }

    const numericId = Number((match as any).id);
    if (
      Number.isFinite(numericId) &&
      numericId > 0 &&
      Number(clienteId) !== numericId
    ) {
      setValue("clienteId", numericId, { shouldDirty: false });
    }
  }, [
    customerName,
    customerId,
    clienteId,
    docTypeCode,
    clientOptions,
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
      if (!doc) return true;
      return /^\d{11}$/.test(doc) || "El RUC debe tener 11 digitos";
    },
    [resolveDocumentValue],
  );
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
    return {
      clientName: safeTrim(customerName) || "Ultimo cliente",
      clientId: safeTrim(selectedDocument),
      docType: docTypeForTicket,
      paymentMethod,
      items: safeItems,
      totals: safeTotals,
      documentNumber,
    };
  }, [
    customerId,
    customerName,
    docTypeForTicket,
    documentNumber,
    paymentMethod,
    itemsToRender,
    totalsToRender,
    purchasedItems,
    paidTotals,
  ]);
  const previewKey = useMemo(
    () =>
      [
        docTypeCode,
        paymentMethod,
        ticketPreviewProps.clientName,
        ticketPreviewProps.clientId,
        ticketPreviewProps.documentNumber,
        totalsToRender.total.toFixed(2),
        itemsToRender.length,
      ].join("|"),
    [
      docTypeCode,
      itemsToRender.length,
      paymentMethod,
      ticketPreviewProps.clientId,
      ticketPreviewProps.clientName,
      ticketPreviewProps.documentNumber,
      totalsToRender.total,
    ],
  );

  const notaPayload = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
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
    const sourceItems = items.length ? items : purchasedItems;
    const sourceTotals = items.length ? totals : paidTotals;
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
        ? "http://localhost:5000/api/v1/Nota/editarOrden"
        : "http://localhost:5000/api/v1/Nota/crearOrden",
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
    if (!isEditing && items.length) {
      clearCart();
    }
    setIsConfirmed(true);
    handlePrint();
  };

  const handleBackToPos = (ev?: MouseEvent) => {
    ev?.preventDefault();
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
      navigate("/pos");
      return;
    }

    clearEditingNota();
    // Si aún no se ha confirmado/guardado la nota inicial, conservar el carrito
    if (!notaId && !isConfirmed) {
      navigate("/pos");
      return;
    }

    if (items.length) {
      setPurchasedItems(items);
      setPaidTotals(totals);
    }
    clearCart();
    navigate("/pos");
  };

  const handleEnableEditing = () => {
    if (!notaId) return;
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

  const openWhatsApp = useCallback((phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const url = phone
      ? `https://wa.me/${phone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const shareByWhatsApp = useCallback(
    async (rawPhone?: string) => {
      const normalizedPhone = String(rawPhone ?? "").replace(/\D/g, "");
      if (
        normalizedPhone &&
        (normalizedPhone.length < 8 || normalizedPhone.length > 15)
      ) {
        toast.error("Ingresa un numero valido (8 a 15 digitos).");
        return;
      }

      const blob = await createComprobanteBlob();
      const fileName = getComprobanteFileName();
      const file = new File([blob], fileName, { type: "application/pdf" });

      const safeDocNumber = safeTrim(documentNumber) || "SIN-NUMERO";
      const message = [
        `Comprobante: ${safeDocNumber}`,
        `Cliente: ${safeTrim(customerName) || "PUBLICO GENERAL"}`,
        `Total: S/ ${totalAPagar.toFixed(2)}`,
      ].join("\n");

      if (!normalizedPhone && typeof navigator.share === "function") {
        try {
          const canShareFile =
            typeof navigator.canShare === "function"
              ? navigator.canShare({ files: [file] })
              : false;

          if (canShareFile) {
            await navigator.share({
              title: "Comprobante de pago",
              text: message,
              files: [file],
            });
            toast.success("Comprobante listo para enviar por WhatsApp.");
            return;
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }

      downloadComprobante(blob, fileName);
      openWhatsApp(normalizedPhone, message);

      if (normalizedPhone) {
        toast.success("WhatsApp abierto. Adjunta el PDF descargado.");
        return;
      }

      toast.info(
        "WhatsApp abierto. Selecciona el contacto y adjunta el comprobante descargado.",
      );
    },
    [
      createComprobanteBlob,
      customerName,
      documentNumber,
      downloadComprobante,
      getComprobanteFileName,
      openWhatsApp,
      totalAPagar,
    ],
  );

  const handleOpenWhatsAppModal = useCallback(() => {
    openDialog({
      title: "Enviar por WhatsApp",
      confirmText: "Enviar",
      cancelText: "Cancelar",
      maxWidth: "xs",
      fullWidth: true,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Ingresa el numero para abrir el chat directo. Si lo dejas vacio,
            podras elegir el contacto en WhatsApp.
          </p>
          <input
            ref={(node) => {
              whatsappNumberInputRef.current = node;
            }}
            type="tel"
            inputMode="numeric"
            placeholder="Ej: 51987654321 (opcional)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
        </div>
      ),
      onConfirm: async () => {
        const phoneValue = whatsappNumberInputRef.current?.value ?? "";
        await shareByWhatsApp(phoneValue);
      },
    });
  }, [openDialog, shareByWhatsApp]);

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
  console.log("itemsToRender", itemsToRender);
  if (!itemsToRender.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <ArrowLeft className="w-4 h-4" />
          <Link
            to="/pos"
            className="text-blue-600 hover:underline"
            onClick={(e) => handleBackToPos(e)}
          >
            Regresar al POS
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">
          No hay ítems para pagar.
        </div>
      </div>
    );
  }

  const ItemsList = (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      {itemsToRender.map((item) => {
        const isZeroOrNegative = (item.cantidad ?? 0) <= 0;
        const isStockNegative = Number(item.stock ?? 0) < 0;
        const highlightClass =
          isZeroOrNegative || isStockNegative
            ? "border-red-200 bg-red-50"
            : "border-slate-200 bg-gray-50";

        return (
          <div
            key={item.productId}
            className={`border rounded-lg p-3 flex justify-between gap-3 ${highlightClass}`}
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {item.nombre}
              </p>
              <p className="text-xs text-gray-500">
                {item.codigo} · {item.unidadMedida ?? "UND"}
              </p>
              {item.stock !== undefined && (
                <p className="text-xs text-gray-500">
                  Stock:{" "}
                  <span
                    className={
                      isStockNegative ? "text-red-600 font-semibold" : ""
                    }
                  >
                    {item.stock}
                  </span>
                </p>
              )}
              <p className="text-xs text-gray-500">CANTIDAD: {item.cantidad}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">P. Unitario</p>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs text-gray-500">S/</span>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="w-20 text-right border rounded-md px-2 py-1 text-sm appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={item.precio === 0 ? "" : item.precio}
                  onChange={(e) => {
                    handlePriceChange(item, e.target.value);
                  }}
                  onFocus={(e) => e.target.select()}
                  disabled={!canEditItems}
                  style={{ MozAppearance: "textfield" }}
                />
              </div>
              <p className="text-xs text-gray-500">Subtotal</p>
              <p
                className={`text-base font-semibold ${
                  isZeroOrNegative ? "text-red-600" : "text-slate-800"
                }`}
              >
                S/ {(item.precio * item.cantidad).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1 rounded bg-white border hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => handleQuantityChange(item, -1)}
                  disabled={!canEditItems}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  className="w-16 text-center border rounded-md py-1 text-sm appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                    handleQuantityChange(item, desired - (item.cantidad ?? 0));
                  }}
                  onFocus={(e) => e.target.select()}
                  disabled={!canEditItems}
                  style={{ MozAppearance: "textfield" }}
                />
                <button
                  type="button"
                  className="p-1 rounded bg-white border hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => handleQuantityChange(item, 1)}
                  disabled={!canEditItems}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                onClick={() => handleRemoveItem(item.productId)}
                disabled={!canEditItems}
                title="Quitar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const PdfViewerCard = (
    <div className="border rounded-lg overflow-hidden">
      {canPreviewPdf ? (
        <PDFViewer
          key={previewKey}
          style={{ width: "100%", height: 620 }}
          showToolbar={isConfirmed}
        >
          <TicketDocument {...ticketPreviewProps} />
        </PDFViewer>
      ) : (
        <div className="p-3 text-xs text-gray-500">
          Cargando vista previa del comprobante...
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <>
      <HookForm
        methods={formMethods}
        onSubmit={handleSubmit(confirmPayment)}
        preventSubmitOnEnter
        className="bg-white rounded-xl shadow p-4 space-y-4"
      >
        <HookFormSelect
          name="docTypeCode"
          label="Tipo de documento"
          disabled={isConfirmed}
          options={[
            { value: "101", label: "Proforma V" },
            { value: "03", label: "Boleta" },
            { value: "01", label: "Factura" },
          ]}
        />
        <HookFormSelect
          name="paymentMethod"
          label="Forma de pago"
          disabled={isConfirmed}
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
          disableClearable={isConfirmed}
          disabled={isConfirmed}
          onOptionSelected={(opt: any) => {
            if (!opt) return;
            const docValue =
              docTypeCode === "01" ? safeTrim(opt.ruc) : safeTrim(opt.dni);
            if (docValue) {
              setValue("customerId", docValue, { shouldDirty: true });
            }
            setClienteIdFromOption(opt);
          }}
        />
        {docTypeCode === "01" ? (
          <HookFormAutocomplete
            name="customerId"
            label="RUC"
            placeholder="Número de RUC"
            options={rucOptions}
            rules={{ validate: validateRucLength }}
            disableClearable={isConfirmed}
            disabled={isConfirmed}
            allowCreate
            createLabel={(value: string) => `Usar RUC: ${value}`}
            filterOptions={documentFilterOptions as any}
            isOptionEqualToValue={(option: any, value: any) =>
              String(option?.value) === String((value as any)?.value ?? value)
            }
            onOptionSelected={(opt: any) => {
              if (!opt) return;
              if (opt?.nombreRazon) {
                setValue("customerName", opt.nombreRazon, {
                  shouldDirty: true,
                });
              }
              setClienteIdFromOption(opt);
            }}
          />
        ) : (
          <HookFormAutocomplete
            name="customerId"
            label="DNI"
            placeholder="Número de DNI"
            options={dniOptions}
            rules={{ validate: validateDniLength }}
            disableClearable={isConfirmed}
            disabled={isConfirmed}
            allowCreate
            createLabel={(value: string) => `Usar DNI: ${value}`}
            filterOptions={documentFilterOptions as any}
            isOptionEqualToValue={(option: any, value: any) =>
              String(option?.value) === String((value as any)?.value ?? value)
            }
            onOptionSelected={(opt: any) => {
              if (!opt) return;
              if (opt?.nombreRazon) {
                setValue("customerName", opt.nombreRazon, {
                  shouldDirty: true,
                });
              }
              setClienteIdFromOption(opt);
            }}
          />
        )}
        {paymentMethod !== "EFECTIVO" && (
          <HookFormSelect
            name="bankEntity"
            label="Entidad bancaria"
            disabled={isConfirmed || paymentMethod === "TARJETA"}
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
            disabled={isConfirmed}
            placeholder="Número de operación"
          />
        )}
        <div className="flex items-center justify-between text-sm text-gray-700 gap-3">
          <span>Aplica descuento</span>
          <input
            type="checkbox"
            className="w-4 h-4 accent-slate-700 rounded"
            disabled={isConfirmed}
            checked={applyDiscount}
            {...register("applyDiscount", {
              onChange: (e) =>
                setValue("applyDiscount", e.target.checked, {
                  shouldDirty: true,
                }),
            })}
          />
        </div>
        <div className="space-y-1 border-t pt-3">
          <div className="flex justify-between text-sm text-gray-700">
            <span>Op. gravada</span>
            <span className="font-semibold">S/ {gravada.toFixed(2)}</span>
          </div>

          {applyDiscount && (
            <div className="flex items-center justify-between text-sm text-gray-700 gap-3">
              <span>Descuento</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">S/</span>
                <HookFormInput
                  name="discount"
                  label=""
                  type="number"
                  step="0.01"
                  className="w-12 text-right appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  style={{ MozAppearance: "textfield" }}
                  onFocus={(e) => e.target.select()}
                  disabled={isConfirmed}
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
          <div className="flex justify-between text-base text-slate-800 font-bold">
            <span>Total pago</span>
            <span>S/ {totalAPagar.toFixed(2)}</span>
          </div>
        </div>
        {!isConfirmed && (
          <button
            type="submit"
            className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            disabled={isSubmitting}
          >
            <CheckCircle2 className="w-5 h-5" />
            Confirmar pago
          </button>
        )}
      </HookForm>

      {isConfirmed && isProforma && (
        <button
          className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-lg border border-orange-300 bg-white text-orange-800 hover:bg-orange-50 transition-colors"
          onClick={handleEnableEditing}
        >
          Editar
        </button>
      )}
      {isConfirmed && (
        <button
          className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-lg border border-green-300 bg-green-50 text-green-800 hover:bg-green-100 transition-colors"
          onClick={handleOpenWhatsAppModal}
        >
          <MessageCircle className="w-5 h-5" />
          Enviar por WhatsApp
        </button>
      )}
      <button
        className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50"
        onClick={() => handlePrint()}
        disabled={isPrinting}
      >
        <Printer className="w-5 h-5" />
        {isPrinting ? "Imprimiendo..." : "Imprimir comprobante"}
      </button>
      <button
        className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
        onClick={handleBackToPos}
      >
        <ArrowLeft className="w-5 h-5" />
        Volver al POS
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Confirmar cobro</p>
          <h1 className="text-2xl font-semibold text-slate-800">
            Pago y comprobante
          </h1>
        </div>
        <Link
          to="/pos"
          className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
          onClick={(e) => handleBackToPos(e)}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al POS
        </Link>
      </div>
      {/* Layout móvil/mediano: tabs combinados + formulario */}
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-5 min-[1405px]:hidden">
        <section className="space-y-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-1 border-b border-slate-200 p-2 bg-slate-50">
              <button
                type="button"
                className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === "items"
                    ? "text-white bg-gradient-to-r from-slate-700 to-slate-800 shadow-md"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("items")}
              >
                Items a cobrar
              </button>
              <button
                type="button"
                className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === "pdf"
                    ? "text-white bg-gradient-to-r from-slate-700 to-slate-800 shadow-md"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("pdf")}
              >
                Comprobante
              </button>
            </div>

            <div className="p-5">
              {activeTab === "items" && ItemsList}
              {activeTab === "pdf" && PdfViewerCard}
            </div>
          </div>
        </section>

        <section className="space-y-3">{renderForm()}</section>
      </div>

      {/* Layout grande: 3 columnas optimizadas */}
      <div className="hidden min-[1405px]:grid grid-cols-[1.3fr_1.1fr_1fr] gap-5">
        {/* Comprobante PDF */}
        <section className="space-y-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <Receipt className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-800">
                Vista previa del comprobante
              </h2>
            </div>
            {PdfViewerCard}
          </div>
        </section>

        {/* Items a cobrar */}
        <section className="space-y-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              {itemsToRender.length}
              <h2 className="text-lg font-bold text-slate-800">
                Items a cobrar
              </h2>
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

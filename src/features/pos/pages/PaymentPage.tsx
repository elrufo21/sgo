import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router";
import { CheckCircle2, ArrowLeft, Printer, Receipt } from "lucide-react";
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

const PaymentPage = () => {
  const items = usePosStore((s) => s.items);
  const totals = usePosStore(selectTotals);
  const clearCart = usePosStore((s) => s.clearCart);
  const navigate = useNavigate();
  const openDialog = useDialogStore((s) => s.openDialog);
  const { clients, fetchClients } = useClientsStore();
  const safeTrim = (value: string | null | undefined) => (value ?? "").trim();
  const [purchasedItems, setPurchasedItems] = useState(items);
  const [paidTotals, setPaidTotals] = useState(totals);
  const [canPreviewPdf, setCanPreviewPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [activeTab, setActiveTab] = useState<"items" | "pdf">("items");

  const docTypeConfig: Record<
    "03" | "01" | "101",
    { docu: string; serie: string; label: string }
  > = {
    "03": { docu: "BOLETA", serie: "BA01", label: "Boleta" },
    "01": { docu: "FACTURA", serie: "FA01", label: "Factura" },
    "101": { docu: "PROFORMA", serie: "PF01", label: "Proforma V" },
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
      parsedSession?.user?.username || parsedSession?.user?.displayName;

    return { companyId: safeCompanyId, usernameFromSession: username };
  }, []);

  const hasLiveItems = items.length > 0;
  const itemsToRender = hasLiveItems ? items : purchasedItems;
  const totalsToRender = hasLiveItems ? totals : paidTotals;

  const formMethods = useForm({
    defaultValues: {
      docTypeCode: "03" as "03" | "01" | "101",
      paymentMethod: "EFECTIVO" as
        | "EFECTIVO"
        | "TARJETA"
        | "TRANSFERENCIA"
        | "YAPE",
      clienteId: 1,
      customerName: "",
      customerId: "",
      bankEntity: "-",
      nroOperacion: "",
      notaUsuario: "",
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
    formState: { isSubmitting },
  } = formMethods;

  const docTypeCode = watch("docTypeCode");
  const paymentMethod = watch("paymentMethod");
  const clienteId = watch("clienteId");
  const customerName = watch("customerName");
  const customerId = watch("customerId");
  const bankEntity = watch("bankEntity");
  const nroOperacion = watch("nroOperacion");
  const notaUsuario = watch("notaUsuario");
  const notes = watch("notes");
  const applyDiscount = useWatch({
    control,
    name: "applyDiscount",
    defaultValue: false,
  }) as boolean;
  const discountInput = watch("discount");

  const docLabel = docTypeCode === "01" ? "RUC" : "DNI";
  const docConfig = docTypeConfig[docTypeCode];
  const docTypeName = docConfig?.docu ?? "BOLETA";
  const totalAmount = totalsToRender?.total ?? 0;
  const descuento = applyDiscount
    ? Math.max(0, Number(discountInput ?? 0) || 0)
    : 0;
  const discountedTotal = Math.max(0, totalAmount - descuento);
  const gravada = discountedTotal / 1.18;
  const igvAmount = discountedTotal - gravada;

  const notaAdicional =
    paymentMethod === "TARJETA" ? discountedTotal * 0.05 : 0;
  const totalAPagar = discountedTotal + notaAdicional;
  const isCash = paymentMethod === "EFECTIVO";
  const isCard = paymentMethod === "TARJETA";
  const requiresBankSelection =
    paymentMethod === "TRANSFERENCIA" || paymentMethod === "YAPE";

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

  useEffect(() => {
    if (!clients.length) {
      fetchClients();
    }
  }, [clients.length, fetchClients]);

  useEffect(() => {
    if (!applyDiscount) {
      setValue("discount", 0, { shouldDirty: true });
    }
  }, [applyDiscount, setValue]);

  useEffect(() => {
    // Reset documento y nombre al cambiar el tipo de documento para evitar cruces
    setValue("customerId", "");
    setValue("customerName", "");
  }, [docTypeCode, setValue]);

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
      })),
    [uniqueClients]
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
    [uniqueClients]
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
    [uniqueClients]
  );

  const selectedDocument = useMemo(() => {
    const source = docTypeCode === "01" ? rucOptions : dniOptions;
    const match = source.find(
      (opt) => String(opt.value) === String(customerId)
    );
    if (match?.label) return match.label;
    return typeof customerId === "string" ? customerId : "";
  }, [customerId, docTypeCode, dniOptions, rucOptions]);

  const documentFilterOptions = useCallback(
    (
      options: Array<(typeof dniOptions)[number] | (typeof rucOptions)[number]>,
      state: { inputValue: string }
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
    [docLabel]
  );

  const ticketPreviewProps = useMemo(() => {
    const safeItems = itemsToRender.length ? itemsToRender : purchasedItems;
    const safeTotals = itemsToRender.length ? totalsToRender : paidTotals;
    return {
      clientName: safeTrim(customerName) || "Ultimo cliente",
      clientId: safeTrim(selectedDocument),
      docType: docTypeName.toLowerCase(),
      paymentMethod,
      items: safeItems,
      totals: safeTotals,
    };
  }, [
    customerId,
    customerName,
    docTypeName,
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
        totalsToRender.total.toFixed(2),
        itemsToRender.length,
      ].join("|"),
    [
      docTypeCode,
      itemsToRender.length,
      paymentMethod,
      ticketPreviewProps.clientId,
      ticketPreviewProps.clientName,
      totalsToRender.total,
    ]
  );

  const notaPayload = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const safeItems = itemsToRender.length ? itemsToRender : purchasedItems;
    const base = gravada;
    const clienteIdNumber = Number(clienteId ?? 1) || 1;

    const bankValue = bankEntity?.trim() || null;

    return {
      nota: {
        notaId: 0,
        notaDocu: docTypeName,
        clienteId: clienteIdNumber,
        notaFecha: `${today}T00:00:00`,
        notaUsuario: safeTrim(notaUsuario) || usernameFromSession || "USUARIO",
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
        notaSerie: docConfig?.serie ?? "BA01",
        notaNumero: "00012345",
        notaGanancia: 0,
        icbper: 0,
        cajaId: 196,
        entidadBancaria: bankValue,
        nroOperacion: isCash ? null : safeTrim(nroOperacion) || null,
        efectivo: isCash ? Number(totalAPagar.toFixed(2)) : 0,
        deposito: isCash ? 0 : Number(totalAPagar.toFixed(2)),
      },
      detalles: safeItems.map((item) => ({
        detalleId: 0,
        notaId: 0,
        idProducto: item.productId,
        detalleCantidad: item.cantidad,
        detalleUm: item.unidadMedida ?? "UND",
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
    companyId,
    customerId,
    docConfig?.serie,
    docTypeName,
    gravada,
    itemsToRender,
    notaAdicional,
    notaUsuario,
    paymentMethod,
    purchasedItems,
    totalAPagar,
    totalAmount,
    selectedDocument,
  ]);

  useEffect(() => {
    setCanPreviewPdf(true);
  }, []);

  const confirmPayment = async () => {
    const sourceItems = items.length ? items : purchasedItems;
    const sourceTotals = items.length ? totals : paidTotals;
    setPurchasedItems(sourceItems);
    setPaidTotals(sourceTotals);

    const result = await apiRequest({
      url: "http://localhost:5000/api/v1/Nota/register-with-detail",
      method: "POST",
      data: notaPayload,
      config: {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      },
      fallback: null,
    });

    if (result === false) {
      toast.error("No se pudo registrar la nota.");
      return;
    }

    toast.success("Pago registrado");
    if (items.length) {
      clearCart();
    }
    setIsConfirmed(true);
    handlePrint();
  };

  const handleBackToPos = () => {
    if (items.length) {
      setPurchasedItems(items);
      setPaidTotals(totals);
    }
    clearCart();
    navigate("/pos");
  };

  const handleEnableEditing = () => {
    openDialog({
      title: "Confirmar edición",
      content: "¿Desea editar?",
      confirmText: "Editar",
      cancelText: "Cancelar",
      onConfirm: () => setIsConfirmed(false),
    });
  };

  const handlePrint = async (printerName = "Canon G2060 series HTTP") => {
    try {
      setIsPrinting(true);
      const blob = await pdf(
        <TicketDocument {...ticketPreviewProps} />
      ).toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        String.fromCharCode(...(new Uint8Array(arrayBuffer) as any))
      );

      const res = await fetch("http://localhost:3000/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: base64, printerName }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al imprimir");
      }
      toast.success("Impresión enviada");
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
          <Link to="/pos" className="text-blue-600 hover:underline">
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
      {itemsToRender.map((item) => (
        <div
          key={item.productId}
          className="border rounded-lg p-3 flex justify-between gap-3 bg-gray-50"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {item.nombre}
            </p>
            <p className="text-xs text-gray-500">
              {item.codigo} · {item.unidadMedida ?? "UND"}
            </p>
            <p className="text-xs text-gray-500">Cantidad: {item.cantidad}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">P. Unitario</p>
            <p className="text-sm font-semibold">S/ {item.precio.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Subtotal</p>
            <p className="text-base font-semibold text-slate-800">
              S/ {(item.precio * item.cantidad).toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const PdfViewerCard = (
    <div className="border rounded-lg overflow-hidden">
      {canPreviewPdf ? (
        <PDFViewer key={previewKey} style={{ width: "100%", height: 620 }}>
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
          disabled={isConfirmed}
          onOptionSelected={(opt: any) => {
            if (opt) {
              if (opt?.dni) {
                setValue("customerId", opt.dni, { shouldDirty: true });
              }
              if (opt?.value) {
                setValue("clienteId", Number(opt.value) || 1, {
                  shouldDirty: true,
                });
              }
            }
          }}
        />
        {docTypeCode === "01" ? (
          <HookFormAutocomplete
            name="customerId"
            label="RUC"
            placeholder="Número de RUC"
            options={rucOptions}
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
              if (opt?.id) {
                setValue("clienteId", Number(opt.id) || 1, {
                  shouldDirty: true,
                });
              }
            }}
          />
        ) : (
          <HookFormAutocomplete
            name="customerId"
            label="DNI"
            placeholder="Número de DNI"
            options={dniOptions}
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
              if (opt?.id) {
                setValue("clienteId", Number(opt.id) || 1, {
                  shouldDirty: true,
                });
              }
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

      {isConfirmed && (
        <button
          className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-lg border border-orange-300 bg-white text-orange-800 hover:bg-orange-50 transition-colors"
          onClick={handleEnableEditing}
        >
          Editar
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

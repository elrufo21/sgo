import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router";
import { CheckCircle2, ArrowLeft, Printer } from "lucide-react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { usePosStore, selectTotals } from "@/store/pos/pos.store";
import { toast } from "sonner";
import TicketDocument from "@/components/Ticket";

const PaymentPage = () => {
  const items = usePosStore((s) => s.items);
  const totals = usePosStore(selectTotals);
  const clearCart = usePosStore((s) => s.clearCart);
  const navigate = useNavigate();
  const [docType, setDocType] = useState<"boleta" | "factura">("boleta");
  const [paymentMethod, setPaymentMethod] = useState<
    "efectivo" | "tarjeta" | "transferencia"
  >("efectivo");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("Ultimo cliente");
  const [customerId, setCustomerId] = useState("");
  const [bankEntity, setBankEntity] = useState("");
  const [canPreviewPdf, setCanPreviewPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const docLabel = docType === "factura" ? "RUC" : "DNI";
  const igvAmount = Math.max(0, totals.total - totals.subTotal);
  const ticketPreviewProps = useMemo(
    () => ({
      clientName: customerName.trim() || "Ultimo cliente",
      clientId: customerId.trim(),
      docType,
      paymentMethod,
    }),
    [customerId, customerName, docType, paymentMethod]
  );
  const previewKey = useMemo(
    () =>
      [
        docType,
        paymentMethod,
        ticketPreviewProps.clientName,
        ticketPreviewProps.clientId,
        totals.total.toFixed(2),
        items.length,
      ].join("|"),
    [
      docType,
      items.length,
      paymentMethod,
      ticketPreviewProps.clientId,
      ticketPreviewProps.clientName,
      totals.total,
    ]
  );

  useEffect(() => {
    setCanPreviewPdf(true);
  }, []);

  const confirmPayment = () => {
    toast.success("Pago registrado");
    clearCart();
    navigate("/pos");
  };

  const handlePrint = async (printerName = "Canon G2060 series HTTP") => {
    try {
      setIsPrinting(true);
      const blob = await pdf(<TicketDocument {...ticketPreviewProps} />).toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer) as any)
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

  if (!items.length) {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section>
          {" "}
          <div className="border rounded-lg overflow-hidden">
            {canPreviewPdf ? (
              <PDFViewer
                key={previewKey}
                style={{ width: "100%", height: 660 }}
              >
                <TicketDocument {...ticketPreviewProps} />
              </PDFViewer>
            ) : (
              <div className="p-3 text-xs text-gray-500">
                Cargando vista previa del comprobante...
              </div>
            )}
          </div>
        </section>
        <section className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              Items a cobrar
            </h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {items.map((item) => (
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
                    <p className="text-xs text-gray-500">
                      Cantidad: {item.cantidad}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">P. Unitario</p>
                    <p className="text-sm font-semibold">
                      S/ {item.precio.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Subtotal</p>
                    <p className="text-base font-semibold text-slate-800">
                      S/ {(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Tipo de documento
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { value: "boleta", label: "Boleta" },
                  { value: "factura", label: "Factura" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={`border rounded-lg px-3 py-2 text-sm text-left ${
                      docType === opt.value
                        ? "border-slate-700 bg-slate-700 text-white"
                        : "border-slate-200 bg-white text-slate-800"
                    }`}
                    onClick={() => setDocType(opt.value as typeof docType)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">
                Forma de pago
              </p>
              <select
                className="w-full mt-2 border rounded-lg px-3 py-2 text-sm"
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as typeof paymentMethod)
                }
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Nombre del cliente
                </p>
                <input
                  className="w-full mt-2 border rounded-lg px-3 py-2 text-sm"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre o razón social"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {docLabel}
                </p>
                <input
                  className="w-full mt-2 border rounded-lg px-3 py-2 text-sm"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder={`Número de ${docLabel}`}
                />
              </div>
            </div>

            {paymentMethod === "tarjeta" && (
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Entidad bancaria
                </p>
                <input
                  className="w-full mt-2 border rounded-lg px-3 py-2 text-sm"
                  value={bankEntity}
                  onChange={(e) => setBankEntity(e.target.value)}
                  placeholder="Banco emisor"
                />
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-slate-700">
                Notas / referencia
              </p>
              <textarea
                className="w-full mt-2 border rounded-lg px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder="Cliente, referencia, observaciones..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-1 border-t pt-3">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">
                  S/ {totals.subTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>IGV</span>
                <span className="font-semibold">S/ {igvAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base text-slate-800 font-bold">
                <span>Total</span>
                <span>S/ {totals.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors"
              onClick={confirmPayment}
            >
              <CheckCircle2 className="w-5 h-5" />
              Confirmar pago
            </button>
            <button
              className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50"
              onClick={() => handlePrint()}
              disabled={isPrinting}
            >
              <Printer className="w-5 h-5" />
              {isPrinting ? "Imprimiendo..." : "Imprimir comprobante"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PaymentPage;

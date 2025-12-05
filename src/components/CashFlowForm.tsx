import React, { useState } from "react";
import { Save, Printer, X, Plus, Trash2 } from "lucide-react";
import type {
  CashFlow,
  ConteoMoneda,
  Movement,
  VentaTotal,
} from "@/types/cashFlow";

interface CashFlowFormProps {
  mode: "create" | "edit";
  initialData?: Partial<CashFlow>;
  onSave: (data: Omit<CashFlow, "id">) => void;
  onDelete?: () => void;
  onNew?: () => void;
}

export default function CashFlowForm({
  mode,
  initialData,
  onSave,
  onDelete,
  onNew,
}: CashFlowFormProps) {
  const [formData, setFormData] = useState({
    caja: initialData?.caja || "",
    encargado: initialData?.encargado || "",
    sencillo: initialData?.sencillo || 0,
    estado: initialData?.estado || ("ABIERTA" as "ABIERTA" | "CERRADA"),
    fechaApertura: initialData?.fechaApertura || new Date().toISOString(),
    fechaCierre: initialData?.fechaCierre || "",
    observaciones: initialData?.observaciones || "",
  });

  const [conteoMonedas, setConteoMonedas] = useState<ConteoMoneda[]>(
    initialData?.conteoMonedas || [
      { cantidad: 0, denominacion: 200.0 },
      { cantidad: 0, denominacion: 100.0 },
      { cantidad: 0, denominacion: 50.0 },
      { cantidad: 0, denominacion: 20.0 },
      { cantidad: 0, denominacion: 10.0 },
      { cantidad: 0, denominacion: 5.0 },
      { cantidad: 0, denominacion: 2.0 },
      { cantidad: 0, denominacion: 1.0 },
      { cantidad: 0, denominacion: 0.5 },
      { cantidad: 0, denominacion: 0.2 },
      { cantidad: 0, denominacion: 0.1 },
    ]
  );

  const [ingresos, setIngresos] = useState<Movement[]>(
    initialData?.ingresos || []
  );
  const [gastos, setGastos] = useState<Movement[]>(initialData?.gastos || []);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    descripcion: "",
    importe: 0,
  });
  const [tipoMovimiento, setTipoMovimiento] = useState<"ingresos" | "gastos">(
    "ingresos"
  );

  const [ventaTotal, setVentaTotal] = useState<VentaTotal>(
    initialData?.ventaTotal || {
      efectivo: 0,
      tarjeta: 0,
      deposito: 0,
    }
  );

  // Cálculos
  const totalEfectivo = conteoMonedas.reduce(
    (sum, item) => sum + item.cantidad * item.denominacion,
    0
  );
  const totalIngresos = ingresos.reduce((sum, item) => sum + item.importe, 0);
  const totalGastos = gastos.reduce((sum, item) => sum + item.importe, 0);
  const efectivoCaja = totalEfectivo + totalIngresos - totalGastos;
  const ventasBO_FA =
    ventaTotal.efectivo + ventaTotal.tarjeta + ventaTotal.deposito;
  const diferencial = efectivoCaja - ventasBO_FA;
  const totalVenta = ventasBO_FA - totalGastos;

  const handleCantidadChange = (index: number, valor: string) => {
    const cantidad = parseInt(valor) || 0;
    const newConteo = [...conteoMonedas];
    newConteo[index].cantidad = cantidad;
    setConteoMonedas(newConteo);
  };

  const agregarMovimiento = () => {
    if (!nuevoMovimiento.descripcion || nuevoMovimiento.importe <= 0) return;
    const movimiento: Movement = {
      id: Date.now(),
      descripcion: nuevoMovimiento.descripcion,
      importe: parseFloat(nuevoMovimiento.importe.toString()),
    };
    if (tipoMovimiento === "ingresos") {
      setIngresos([...ingresos, movimiento]);
    } else {
      setGastos([...gastos, movimiento]);
    }
    setNuevoMovimiento({ descripcion: "", importe: 0 });
  };

  const eliminarMovimiento = (id: number, tipo: "ingresos" | "gastos") => {
    if (tipo === "ingresos") {
      setIngresos(ingresos.filter((item) => item.id !== id));
    } else {
      setGastos(gastos.filter((item) => item.id !== id));
    }
  };

  const cerrarCaja = () => {
    setFormData({
      ...formData,
      estado: "CERRADA",
      fechaCierre: new Date().toISOString(),
    });
  };

  const handleSave = () => {
    const cashFlowData: Omit<CashFlow, "id"> = {
      ...formData,
      conteoMonedas,
      ingresos,
      gastos,
      ventaTotal,
    };
    onSave(cashFlowData);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Pendiente";
    return new Date(dateString).toLocaleString("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
        {/* Header */}
        <div className="bg-slate-800 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <h1 className="text-base font-semibold">
            {mode === "create" ? "Nuevo" : "Editar"} Control de Flujo de Caja
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
              title="Guardar"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
            </button>
            {formData.estado === "ABIERTA" && (
              <button
                onClick={cerrarCaja}
                className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                title="Cerrar Caja"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {mode === "edit" && onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 hover:bg-red-700 bg-red-600 rounded transition-colors ml-2"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onNew && (
              <button
                onClick={onNew}
                className="px-3 py-1.5 hover:bg-slate-700 rounded transition-colors text-sm ml-2"
              >
                Nuevo
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              {/* Info Básica */}
              <div className="border border-gray-200 rounded p-3">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-0.5">
                      Caja
                    </label>
                    <input
                      type="text"
                      value={formData.caja}
                      onChange={(e) =>
                        setFormData({ ...formData, caja: e.target.value })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 block mb-0.5">
                      Encargado
                    </label>
                    <input
                      type="text"
                      value={formData.encargado}
                      onChange={(e) =>
                        setFormData({ ...formData, encargado: e.target.value })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-0.5">
                      Sencillo
                    </label>
                    <input
                      type="number"
                      value={formData.sencillo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sencillo: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 block mb-0.5">
                      Estado
                    </label>
                    <div
                      className={`px-2 py-1 text-sm rounded text-center font-medium ${
                        formData.estado === "ABIERTA"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {formData.estado}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-gray-200 rounded p-2">
                  <label className="text-xs text-gray-600 block mb-0.5">
                    Apertura
                  </label>
                  <div className="text-sm font-medium">
                    {formatDate(formData.fechaApertura)}
                  </div>
                </div>
                <div className="border border-gray-200 rounded p-2">
                  <label className="text-xs text-gray-600 block mb-0.5">
                    Cierre
                  </label>
                  <div className="text-sm font-medium">
                    {formatDate(formData.fechaCierre)}
                  </div>
                </div>
              </div>

              {/* Conteo */}
              <div className="border border-gray-200 rounded p-3">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">
                  Conteo de Efectivo
                </h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {conteoMonedas.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-3 gap-2 items-center text-sm"
                    >
                      <input
                        type="number"
                        value={item.cantidad || ""}
                        onChange={(e) =>
                          handleCantidadChange(idx, e.target.value)
                        }
                        className="px-2 py-1 border border-gray-300 rounded text-center focus:border-slate-500 focus:outline-none"
                        min="0"
                      />
                      <div className="text-right text-gray-600">
                        {item.denominacion.toFixed(2)}
                      </div>
                      <div className="text-right font-medium">
                        {(item.cantidad * item.denominacion).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center bg-slate-100 px-3 py-2 rounded">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold">
                    S/ {totalEfectivo.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Resumen */}
              <div className="border border-gray-200 rounded p-3">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">
                  Resumen
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ventas (BO/FA)</span>
                    <span className="font-medium">
                      S/ {ventasBO_FA.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Efectivo en Caja</span>
                    <span className="font-medium">
                      S/ {efectivoCaja.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200">
                    <span className="text-gray-600">Diferencial</span>
                    <span
                      className={`font-bold ${
                        diferencial >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      S/ {diferencial.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-xs text-gray-600 block mb-0.5">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        observaciones: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-slate-500 focus:outline-none"
                    rows={2}
                    placeholder="Escriba sus observaciones..."
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
              {/* Movimientos */}
              <div className="border border-gray-200 rounded p-3">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">
                  Otros Movimientos
                </h3>
                <div className="flex gap-1 mb-2">
                  <button
                    onClick={() => setTipoMovimiento("ingresos")}
                    className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${
                      tipoMovimiento === "ingresos"
                        ? "bg-slate-800 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Ingresos
                  </button>
                  <button
                    onClick={() => setTipoMovimiento("gastos")}
                    className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${
                      tipoMovimiento === "gastos"
                        ? "bg-slate-800 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Gastos
                  </button>
                </div>

                <div className="flex gap-1 mb-2">
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={nuevoMovimiento.descripcion}
                    onChange={(e) =>
                      setNuevoMovimiento({
                        ...nuevoMovimiento,
                        descripcion: e.target.value,
                      })
                    }
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:border-slate-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={nuevoMovimiento.importe || ""}
                    onChange={(e) =>
                      setNuevoMovimiento({
                        ...nuevoMovimiento,
                        importe: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:border-slate-500 focus:outline-none"
                    step="0.01"
                  />
                  <button
                    onClick={agregarMovimiento}
                    className="p-1 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="border border-gray-200 rounded overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800 text-white">
                      <tr>
                        <th className="text-left py-1.5 px-2 font-medium text-xs">
                          Descripción
                        </th>
                        <th className="text-right py-1.5 px-2 font-medium text-xs">
                          Importe
                        </th>
                        <th className="w-8 py-1.5 px-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tipoMovimiento === "ingresos" ? ingresos : gastos).map(
                        (item, idx) => (
                          <tr
                            key={item.id}
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="py-1.5 px-2">{item.descripcion}</td>
                            <td className="text-right py-1.5 px-2 font-medium">
                              S/ {item.importe.toFixed(2)}
                            </td>
                            <td className="py-1.5 px-1">
                              <button
                                onClick={() =>
                                  eliminarMovimiento(item.id, tipoMovimiento)
                                }
                                className="p-0.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="border border-green-200 bg-green-50 rounded px-2 py-1">
                    <div className="text-xs text-gray-600">Ingresos</div>
                    <div className="font-bold text-green-700">
                      S/ {totalIngresos.toFixed(2)}
                    </div>
                  </div>
                  <div className="border border-red-200 bg-red-50 rounded px-2 py-1">
                    <div className="text-xs text-gray-600">Gastos</div>
                    <div className="font-bold text-red-700">
                      S/ {totalGastos.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Efectivo Caja */}
              <div className="bg-slate-800 text-white p-4 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Efectivo en Caja</span>
                  <span className="text-2xl font-bold">
                    S/ {efectivoCaja.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Venta Total */}
              <div className="border border-gray-200 rounded p-3">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">
                  Venta Total
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Efectivo</span>
                    <input
                      type="number"
                      value={ventaTotal.efectivo || ""}
                      onChange={(e) =>
                        setVentaTotal({
                          ...ventaTotal,
                          efectivo: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-right font-medium focus:border-slate-500 focus:outline-none"
                      step="0.01"
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tarjeta</span>
                    <input
                      type="number"
                      value={ventaTotal.tarjeta || ""}
                      onChange={(e) =>
                        setVentaTotal({
                          ...ventaTotal,
                          tarjeta: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-right font-medium focus:border-slate-500 focus:outline-none"
                      step="0.01"
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Yape/Plin/Delivery</span>
                    <input
                      type="number"
                      value={ventaTotal.deposito || ""}
                      onChange={(e) =>
                        setVentaTotal({
                          ...ventaTotal,
                          deposito: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-right font-medium focus:border-slate-500 focus:outline-none"
                      step="0.01"
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Gastos</span>
                    <div className="w-28 px-2 py-1 bg-red-100 text-red-700 rounded text-right font-bold">
                      S/ {totalGastos.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-bold">TOTAL</span>
                    <div className="w-28 px-2 py-1 bg-slate-800 text-white rounded text-right font-bold">
                      S/ {totalVenta.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

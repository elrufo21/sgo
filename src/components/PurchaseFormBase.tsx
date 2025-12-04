import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import DataTable from "./DataTable";
import { createColumnHelper } from "@tanstack/react-table";

interface CuentaBancaria {
  entidadBancaria: string;
  moneda: string;
  tipoCuenta: string;
  numeroCuenta: string;
}

interface PurchaseFormBaseProps {
  initialData?: Partial<any>;
  mode: "create" | "edit";
  onSave: (data: any) => void;
  onNew?: () => void;
  onDelete?: () => void;
}

export default function PurchaseFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: PurchaseFormBaseProps) {
  const [form, setForm] = useState({
    nombreRazon: "",
    ruc: "",
    contacto: "",
    celular: "",
    email: "",
    direccion: "",
    estado: "activo",
    cuentasBancarias: [] as CuentaBancaria[],
  });

  const [cuentaTemp, setCuentaTemp] = useState<CuentaBancaria>({
    entidadBancaria: "",
    moneda: "",
    tipoCuenta: "",
    numeroCuenta: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({ ...form, ...initialData });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCuentaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCuentaTemp({ ...cuentaTemp, [name]: value });
  };

  const agregarCuenta = () => {
    if (
      !cuentaTemp.entidadBancaria ||
      !cuentaTemp.moneda ||
      !cuentaTemp.tipoCuenta ||
      !cuentaTemp.numeroCuenta
    )
      return alert("Complete todos los campos de la cuenta");

    const index = form.cuentasBancarias.findIndex(
      (c) => c.numeroCuenta === cuentaTemp.numeroCuenta
    );
    let nuevasCuentas;
    if (index !== -1) {
      nuevasCuentas = [...form.cuentasBancarias];
      nuevasCuentas[index] = cuentaTemp;
    } else {
      nuevasCuentas = [...form.cuentasBancarias, cuentaTemp];
    }

    setForm({ ...form, cuentasBancarias: nuevasCuentas });

    setCuentaTemp({
      entidadBancaria: "",
      moneda: "",
      tipoCuenta: "",
      numeroCuenta: "",
    });
  };

  const handleSave = () => {
    onSave(form);
  };

  const handleNew = () => {
    setForm({
      nombreRazon: "",
      ruc: "",
      contacto: "",
      celular: "",
      email: "",
      direccion: "",
      estado: "activo",
      cuentasBancarias: [],
    });
    setCuentaTemp({
      entidadBancaria: "",
      moneda: "",
      tipoCuenta: "",
      numeroCuenta: "",
    });
    onNew?.();
  };

  const columnHelper = createColumnHelper<CuentaBancaria>();
  const columns = [
    columnHelper.accessor("entidadBancaria", {
      header: "Entidad bancaria",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("tipoCuenta", {
      header: "Tipo de cuenta",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("moneda", {
      header: "Moneda",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("numeroCuenta", {
      header: "Número de cuenta",
      cell: (info) => info.getValue(),
    }),
  ];

  return (
    <div className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {mode === "create"
                ? "Crear Proveedor / Cliente"
                : "Editar Proveedor / Cliente"}
            </h2>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-[40%] space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nombre / Razón Social
                  </label>
                  <input
                    type="text"
                    name="nombreRazon"
                    value={form.nombreRazon}
                    onChange={handleChange}
                    placeholder="Ingrese nombre o razón social"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    RUC
                  </label>
                  <input
                    type="number"
                    name="ruc"
                    value={form.ruc}
                    onChange={handleChange}
                    placeholder="Ingrese RUC"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Contacto
                  </label>
                  <input
                    type="text"
                    name="contacto"
                    value={form.contacto}
                    onChange={handleChange}
                    placeholder="Nombre del contacto"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Celular
                  </label>
                  <input
                    type="number"
                    name="celular"
                    value={form.celular}
                    onChange={handleChange}
                    placeholder="Ingrese número de celular"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Ingrese correo electrónico"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                    placeholder="Ingrese dirección"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="w-full md:w-[60%] mt-6 md:mt-0">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Entidad Bancaria
                    </label>
                    <select
                      name="entidadBancaria"
                      value={cuentaTemp.entidadBancaria}
                      onChange={handleCuentaChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    >
                      <option value="">Seleccione banco</option>
                      <option value="BCP">BCP</option>
                      <option value="Interbank">Interbank</option>
                      <option value="Scotiabank">Scotiabank</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Moneda
                    </label>
                    <select
                      name="moneda"
                      value={cuentaTemp.moneda}
                      onChange={handleCuentaChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    >
                      <option value="">Seleccione moneda</option>
                      <option value="PEN">Soles (PEN)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Tipo de Cuenta
                    </label>
                    <select
                      name="tipoCuenta"
                      value={cuentaTemp.tipoCuenta}
                      onChange={handleCuentaChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    >
                      <option value="">Seleccione tipo</option>
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Número de Cuenta
                    </label>
                    <input
                      type="text"
                      name="numeroCuenta"
                      value={cuentaTemp.numeroCuenta}
                      onChange={handleCuentaChange}
                      placeholder="Ingrese número de cuenta"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={agregarCuenta}
                  className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  Agregar / Actualizar Cuenta
                </button>

                <DataTable
                  columns={columns}
                  data={form.cuentasBancarias}
                  onRowClick={(row) => setCuentaTemp(row)}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" /> Guardar
              </button>

              {mode === "edit" && (
                <>
                  <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all"
                  >
                    <Plus className="w-5 h-5" /> Nuevo
                  </button>
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-600 hover:bg-red-50 transform hover:scale-105 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                      Eliminar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

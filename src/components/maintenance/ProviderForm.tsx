import React, { useEffect, useMemo, useRef, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { createColumnHelper } from "@tanstack/react-table";
import type { Provider, ProviderBankAccount } from "@/types/maintenance";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import DataTable from "@/components/DataTable";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { useDialogStore } from "@/store/app/dialog.store";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

interface ProviderFormProps {
  initialData?: Partial<Provider>;
  mode: "create" | "edit";
  onSave: (
    data: Provider & { cuentasBancarias?: ProviderBankAccount[] }
  ) => void | Promise<void>;
  onNew?: () => void;
  onDelete?: () => void;
  variant?: "page" | "modal";
}

export default function ProviderForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
  variant = "page",
}: ProviderFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setDialogData = useDialogStore((s) => s.setData);
  const fetchProviderAccounts = useMaintenanceStore(
    (s) => s.fetchProviderAccounts
  );
  const isModal = variant === "modal";

  const defaults = useMemo<Provider>(
    () => ({
      id: initialData?.id ?? 0,
      razon: initialData?.razon ?? "",
      ruc: initialData?.ruc ?? "",
      contacto: initialData?.contacto ?? "",
      celular: initialData?.celular ?? "",
      telefono: initialData?.telefono ?? "",
      correo: initialData?.correo ?? "",
      direccion: initialData?.direccion ?? "",
      estado: initialData?.estado ?? "ACTIVO",
    }),
    [initialData]
  );

  const formMethods = useForm<Provider>({
    defaultValues: defaults,
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = formMethods;

  const [cuentasBancarias, setCuentasBancarias] = useState<
    ProviderBankAccount[]
  >(
    (
      (initialData as any)?.cuentasBancarias ??
      (initialData as any)?.cuentas ??
      []
    )?.map((c: ProviderBankAccount) => ({ ...c, action: undefined })) ?? []
  );
  const [cuentaTemp, setCuentaTemp] = useState<ProviderBankAccount>({
    cuentaId: undefined,
    proveedorId: undefined,
    entidad: "",
    moneda: "",
    tipoCuenta: "",
    nroCuenta: "",
    action: undefined,
  });

  useEffect(() => {
    reset(defaults);
    setCuentasBancarias(
      (
        (initialData as any)?.cuentasBancarias ??
        (initialData as any)?.cuentas ??
        []
      ).map((c: ProviderBankAccount) => ({ ...c, action: undefined }))
    );
  }, [defaults, reset, initialData]);

  useEffect(() => {
    const loadAccounts = async () => {
      if (mode !== "edit") return;
      const providerId = initialData?.id ?? 0;
      if (!providerId) return;
      const accounts = await fetchProviderAccounts(providerId);
      if (Array.isArray(accounts)) {
        setCuentasBancarias(accounts.map((c) => ({ ...c, action: undefined })));
      }
    };
    loadAccounts();
  }, [mode, initialData?.id, fetchProviderAccounts]);

  useEffect(() => {
    focusFirstInput(containerRef.current);
  }, [mode, initialData]);

  useEffect(() => {
    if (!isModal) return;
    const subscription = formMethods.watch((values) => {
      setDialogData({
        ...values,
        cuentasBancarias,
        razon: values.razon?.toUpperCase() ?? "",
        contacto: values.contacto?.toUpperCase() ?? "",
        direccion: values.direccion?.toUpperCase() ?? "",
        estado: values.estado?.toUpperCase() ?? "",
      });
    });
    return () => subscription.unsubscribe();
  }, [isModal, formMethods, setDialogData, cuentasBancarias]);

  const handleNew = () => {
    reset({
      id: 0,
      razon: "",
      ruc: "",
      contacto: "",
      celular: "",
      telefono: "",
      correo: "",
      direccion: "",
      estado: "ACTIVO",
    });
    setCuentasBancarias([]);
    setCuentaTemp({
      cuentaId: undefined,
      proveedorId: undefined,
      entidad: "",
      moneda: "",
      tipoCuenta: "",
      nroCuenta: "",
      action: undefined,
    });
    onNew?.();
    focusFirstInput(containerRef.current);
  };

  const onSubmit = async (values: Provider) => {
    const payload: Provider = {
      ...values,
      razon: values.razon?.toUpperCase() ?? "",
      contacto: values.contacto?.toUpperCase() ?? "",
      direccion: values.direccion?.toUpperCase() ?? "",
      estado: values.estado?.toUpperCase() ?? "",
    };
    await onSave({ ...payload, cuentasBancarias });
    if (mode === "create") {
      handleNew();
    }
  };

  const estadoOptions = [
    { value: "", label: "Seleccionar..." },
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
  ];

  const columnHelper = createColumnHelper<ProviderBankAccount>();
  const columns = [
    columnHelper.accessor("entidad", { header: "Entidad bancaria" }),
    columnHelper.accessor("tipoCuenta", { header: "Tipo de cuenta" }),
    columnHelper.accessor("moneda", { header: "Moneda" }),
    columnHelper.accessor("nroCuenta", { header: "Numero de cuenta" }),

    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }: any) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            eliminarCuenta(row.original as ProviderBankAccount);
          }}
          className="text-red-600 hover:underline text-sm"
        >
          Eliminar
        </button>
      ),
      meta: { tdClassName: "text-right" },
    },
  ];

  const handleCuentaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCuentaTemp((prev) => ({ ...prev, [name]: value }));
  };

  const findCuentaIndex = (
    list: ProviderBankAccount[],
    account: ProviderBankAccount
  ) => {
    if (account.cuentaId) {
      return list.findIndex(
        (c) => c.cuentaId && Number(c.cuentaId) === Number(account.cuentaId)
      );
    }
    return list.findIndex(
      (c) => !c.cuentaId && c.nroCuenta === account.nroCuenta
    );
  };

  const agregarCuenta = () => {
    if (
      !cuentaTemp.entidad ||
      !cuentaTemp.moneda ||
      !cuentaTemp.tipoCuenta ||
      !cuentaTemp.nroCuenta
    ) {
      alert("Complete todos los campos de la cuenta");
      return;
    }

    setCuentasBancarias((prev) => {
      const idx = findCuentaIndex(prev, cuentaTemp);
      if (idx !== -1) {
        const existing = prev[idx];
        const nextAction =
          existing.action === "i" || existing.cuentaId === undefined
            ? "i"
            : "u";
        const updated: ProviderBankAccount = {
          ...existing,
          ...cuentaTemp,
          action: nextAction,
        };
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [
        ...prev,
        {
          ...cuentaTemp,
          action: "i",
        },
      ];
    });

    setCuentaTemp({
      cuentaId: undefined,
      proveedorId: undefined,
      entidad: "",
      moneda: "",
      tipoCuenta: "",
      nroCuenta: "",
      action: undefined,
    });
  };

  const eliminarCuenta = (cuenta: ProviderBankAccount) => {
    setCuentasBancarias((prev) => {
      const idx = findCuentaIndex(prev, cuenta);
      if (idx === -1) return prev;
      const target = prev[idx];
      if (target.action === "i" && !target.cuentaId) {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }
      const copy = [...prev];
      copy[idx] = { ...target, action: "d" };
      return copy;
    });
  };

  return (
    <div ref={containerRef} className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div
        className={`w-full mx-auto bg-white overflow-hidden ${
          isModal ? "" : "rounded-2xl shadow-xl"
        }`}
      >
        <HookForm methods={formMethods} onSubmit={handleSubmit(onSubmit)}>
          {!isModal && (
            <div className="bg-[#DB564D]  text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <h1 className="text-base font-semibold">
                {mode === "create" ? "Crear proveedor" : "Editar proveedor"}
              </h1>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-70 transition-colors"
                  title="Guardar"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Guardar</span>
                </button>
                {mode !== "edit" && (
                  <button
                    type="button"
                    onClick={handleNew}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                    title="Nuevo"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo</span>
                  </button>
                )}
                {mode === "edit" && onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-[40%] space-y-4">
                <HookFormInput<Provider>
                  name="razon"
                  label="Nombre / Razon Social"
                  placeholder="Ingrese nombre o razon social"
                  rules={{ required: "La razon social es obligatoria" }}
                  data-focus-first
                />
                <HookFormInput<Provider>
                  name="ruc"
                  label="RUC"
                  placeholder="Ingrese RUC"
                  inputMode="numeric"
                  rules={{
                    required: "El RUC es obligatorio",
                    validate: (value) =>
                      !value?.trim() ||
                      /^\d{8,20}$/.test(value.trim()) ||
                      "Ingrese un RUC valido",
                  }}
                />
                <HookFormInput<Provider>
                  name="contacto"
                  label="Contacto"
                  placeholder="Nombre del contacto"
                />
                <HookFormInput<Provider>
                  name="celular"
                  label="Celular"
                  placeholder="Ingrese numero de celular"
                  inputMode="tel"
                />
                <HookFormInput<Provider>
                  name="correo"
                  label="Email"
                  placeholder="Ingrese correo electronico"
                  type="email"
                />
                <HookFormInput<Provider>
                  name="direccion"
                  label="Direccion"
                  placeholder="Ingrese direccion"
                />
                <HookFormSelect<Provider>
                  name="estado"
                  label="Estado"
                  options={estadoOptions}
                  rules={{ required: "El estado es obligatorio" }}
                  disabled={mode !== "edit"}
                />
              </div>

              <div className="w-full md:w-[60%] mt-6 md:mt-0">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Entidad Bancaria
                    </label>
                    <select
                      name="entidad"
                      value={cuentaTemp.entidad}
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
                      <option value="USD">Dolares (USD)</option>
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
                      Numero de Cuenta
                    </label>
                    <input
                      type="text"
                      name="nroCuenta"
                      value={cuentaTemp.nroCuenta}
                      onChange={handleCuentaChange}
                      placeholder="Ingrese numero de cuenta"
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
                  data={cuentasBancarias}
                  onRowClick={(row) => setCuentaTemp(row)}
                />
              </div>
            </div>
          </div>
        </HookForm>
      </div>
    </div>
  );
}

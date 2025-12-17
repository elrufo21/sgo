import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { HookFormAutocomplete } from "@/components/forms/HookFormAutocomplete";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import type { ShoppingFormData, ShoppingItem } from "@/types/shopping";
import { useProductsStore } from "@/store/products/products.store";
import type { Product } from "@/types/product";
import EditableDataTable from "@/components/forms/table/FormTable";
import AutocompleteTableCell from "@/components/forms/table/AutoCompleteTable";
import EditableTextCell from "@/components/forms/table/EditableTextCell";
import EditableNumberCell from "@/components/forms/table/EditableNumberCell";
import { useProvidersQuery } from "@/features/maintenance/providers/useProvidersQuery";
import TotalsPanel from "./shopping/TotalsPanel";
import { fetchProvidersApi } from "@/features/maintenance/providers/providers.api";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useShoppingStore } from "@/store/shopping/shopping.store";

interface ShoppingFormBaseProps {
  initialData?: Partial<ShoppingFormData>;
  mode: "create" | "edit";
  onSave: (data: ShoppingFormData) => void;
  onNew?: () => void;
  onDelete?: () => void;
}

const conceptOptions = [
  { value: "compra-local", label: "Compra local" },
  { value: "servicio", label: "Servicio" },
  { value: "importacion", label: "Importacion" },
];

const documentoOptions = [
  { value: "01", label: "Factura" },
  { value: "03", label: "Boleta" },
  { value: "00", label: "Nota de credito" },
];

const condicionOptions = [
  { value: "Contado", label: "Contado" },
  { value: "Credito", label: "Credito" },
];

const monedaOptions = [
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dolares (USD)" },
];

const tipoIgvOptions = [
  { value: 1, label: "Incluido" },
  { value: 2, label: "Disgregado" },
  { value: 3, label: "Sin IGV" },
];

export default function ShoppingFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: ShoppingFormBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { products, fetchProducts } = useProductsStore();
  const { data: providers = [] } = useProvidersQuery();

  const defaults = useMemo<ShoppingFormData>(
    () => ({
      concepto: initialData?.concepto ?? "",
      proveedor: initialData?.proveedor ?? "",
      descripcion: initialData?.descripcion ?? "",
      ruc: initialData?.ruc ?? "",
      fechaEmision:
        initialData?.fechaEmision ?? new Date().toISOString().slice(0, 10),
      documento: initialData?.documento ?? "",
      serie: initialData?.serie ?? "",
      numero: initialData?.numero ?? "",
      condicion: initialData?.condicion ?? "",
      moneda: initialData?.moneda ?? "",
      diasPlazo: initialData?.diasPlazo ?? 0,
      fechaPago: initialData?.fechaPago ?? "",
      tipoIgv: initialData?.tipoIgv ?? "",
      tipoCambio: initialData?.tipoCambio ?? 0,
      items:
        initialData?.items && initialData.items.length > 0
          ? initialData.items
          : [
              {
                productId: null,
                codigo: "",
                nombre: "",
                unidadMedida: "",
                stock: 0,
                preCosto: 0,
                preVenta: 0,
                cantidad: 1,
                descuento: 0,
                importe: 0,
              },
            ],
    }),
    [initialData]
  );

  const formMethods = useForm<ShoppingFormData>({
    defaultValues: defaults,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { isSubmitting },
  } = formMethods;
  const setProviders = useMaintenanceStore((s) => s.setProviders);
  const draftItems = useShoppingStore((s) => s.draftItems);
  const setDraftItems = useShoppingStore((s) => s.setDraftItems);
  const clearDraftItems = useShoppingStore((s) => s.clearDraftItems);
  const [tableData, setTableData] = useState<ShoppingItem[]>(defaults.items);
  const [descuento, setDescuento] = useState<number>(0);
  const [percepcion, setPercepcion] = useState<number>(0);

  const productOptions = useMemo(
    () =>
      products.map((p: Product) => ({
        value: p.id,
        label: p.nombre,
        codigo: p.codigo,
        search: `${p.nombre ?? ""} ${p.codigo ?? ""}`.toLowerCase(),
        data: p,
      })),
    [products]
  );

  const providerOptions = useMemo(
    () =>
      providers.map((prov) => ({
        value: prov.razon ?? "",
        label: prov.razon ?? "",
        ruc: prov.ruc ?? "",
      })),
    [providers]
  );

  const rucOptions = useMemo(
    () =>
      providers
        .filter((prov) => prov.ruc)
        .map((prov) => ({
          value: prov.ruc ?? "",
          label: prov.ruc ?? "",
          razon: prov.razon ?? "",
        })),
    [providers]
  );

  useEffect(() => {
    reset(defaults);
    const normalized = normalizeRows(defaults.items);
    setTableData(normalized);
    setValue("items", normalized);

    // Si no hay datos iniciales y hay borrador, hidratarlo
    if (
      mode === "create" &&
      (!initialData?.items || initialData.items.length === 0) &&
      draftItems.length > 0
    ) {
      const hydrated = normalizeRows(draftItems);
      setTableData(hydrated);
      setValue("items", hydrated);
    }
  }, [defaults, reset]);

  useEffect(() => {
    focusFirstInput(containerRef.current);
  }, [mode, initialData]);

  useEffect(() => {
    if (!products.length) {
      fetchProducts();
    }
  }, [products.length, fetchProducts]);

  const condicion = watch("condicion");
  const diasPlazo = watch("diasPlazo");
  const fechaEmision = watch("fechaEmision");
  const fechaPago = watch("fechaPago");
  const numeroSerie = watch("numero");
  const rucValue = watch("ruc");
  const documento = watch("documento");
  const isBoleta = (documento ?? "").trim() === "03";
  const isCredito = (condicion ?? "").toLowerCase() === "credito";
  const lastChangedRef = useRef<
    "diasPlazo" | "fechaPago" | "fechaEmision" | null
  >(null);
  const prevValuesRef = useRef({
    diasPlazo,
    fechaPago,
    fechaEmision,
  });

  // Desactivar plazo y fecha de pago cuando es contado
  useEffect(() => {
    if (!isCredito) {
      setValue("diasPlazo", 0, { shouldDirty: true });
      setValue("fechaPago", "", { shouldDirty: true });
    }
  }, [isCredito, setValue]);

  // Registrar cuál campo cambió por última vez
  useEffect(() => {
    const prev = prevValuesRef.current;
    if (diasPlazo !== prev.diasPlazo) {
      lastChangedRef.current = "diasPlazo";
    } else if (fechaPago !== prev.fechaPago) {
      lastChangedRef.current = "fechaPago";
    } else if (fechaEmision !== prev.fechaEmision) {
      lastChangedRef.current = "fechaEmision";
    }
    prevValuesRef.current = { diasPlazo, fechaPago, fechaEmision };
  }, [diasPlazo, fechaPago, fechaEmision]);

  const isSyncingRef = useRef(false);
  const lastRucLookupRef = useRef<string>("");

  const lookupProviderByRuc = useCallback(
    async (ruc: string) => {
      const trimmed = ruc.trim();
      if (!trimmed) return;
      try {
        const providersList = await fetchProvidersApi();
        setProviders(providersList ?? []);
        const found = providersList?.find(
          (p) => (p.ruc ?? "").trim() === trimmed
        );
        if (found) {
          setValue("proveedor", found.razon ?? "", { shouldDirty: true });
          setValue("ruc", found.ruc ?? trimmed, { shouldDirty: true });
        }
      } catch (error) {
        console.error("No se pudo consultar proveedor por RUC", error);
      }
    },
    [setProviders, setValue]
  );

  // Sync diasPlazo -> fechaPago
  useEffect(() => {
    if (!isCredito) return;
    if (!fechaEmision) return;
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    const baseDate = new Date(fechaEmision);
    if (Number.isNaN(baseDate.getTime())) return;
    const days = Number(diasPlazo ?? 0);
    const target = new Date(baseDate);
    target.setDate(baseDate.getDate() + (Number.isFinite(days) ? days : 0));
    const formatted = target.toISOString().slice(0, 10);
    const lastChanged = lastChangedRef.current;
    const shouldSync =
      lastChanged === "diasPlazo" ||
      (lastChanged === "fechaEmision" && !fechaPago);
    if (shouldSync && formatted !== fechaPago) {
      isSyncingRef.current = true;
      setValue("fechaPago", formatted, { shouldDirty: true });
    }
  }, [diasPlazo, fechaEmision, isCredito, fechaPago, setValue]);

  // Sync fechaPago -> diasPlazo cuando el usuario edita fecha
  useEffect(() => {
    if (!isCredito) return;
    if (!fechaEmision || !fechaPago) return;
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    const start = new Date(fechaEmision);
    const end = new Date(fechaPago);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    )
      return;
    const diffMs = end.getTime() - start.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const lastChanged = lastChangedRef.current;
    if (
      lastChanged === "fechaPago" &&
      Number.isFinite(days) &&
      days !== (Number(diasPlazo) || 0)
    ) {
      isSyncingRef.current = true;
      setValue("diasPlazo", days, { shouldDirty: true });
    }
  }, [fechaPago, fechaEmision, isCredito, diasPlazo, setValue]);

  // Consultar proveedor por RUC y autocompletar
  useEffect(() => {
    const trimmed = (rucValue ?? "").trim();
    if (!trimmed || trimmed.length < 8) return;
    if (lastRucLookupRef.current === trimmed) return;
    lastRucLookupRef.current = trimmed;
    lookupProviderByRuc(trimmed);
  }, [lookupProviderByRuc, rucValue]);

  // Formatear numero de serie: AAAA-#### (primeros 4 letras, luego números)
  useEffect(() => {
    const raw = numeroSerie ?? "";
    const letters = raw
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 4)
      .toUpperCase();
    const numbers = raw.replace(/\D/g, "").slice(0, 4);
    if (!letters && !numbers) return;
    const formatted =
      letters.length === 4 && numbers ? `${letters}-${numbers}` : letters;
    if (formatted !== raw) setValue("numero", formatted, { shouldDirty: true });
  }, [numeroSerie, setValue]);

  const normalizeRows = (rows: ShoppingItem[]): ShoppingItem[] =>
    rows.map((row) => {
      const prod = productMap.get(
        String(row.productId ?? row["productId"] ?? "")
      );
      const cantidadNum = Number(row.cantidad ?? 1) || 1;
      const importeInput = Number(row.importe ?? (row as any)["importe"]);
      const hasImporte = Number.isFinite(importeInput);
      const costoFromProd = prod ? Number(prod.preCosto ?? 0) : null;
      const costoBase = Number(row.preCosto ?? 0) || 0;
      const costoNum =
        hasImporte && cantidadNum > 0
          ? Number((importeInput / cantidadNum).toFixed(2))
          : Number.isFinite(costoFromProd ?? NaN)
          ? (costoFromProd as number)
          : costoBase;
      const descuentoNum = Number(row.descuento ?? 0) || 0;
      const importeNum = hasImporte
        ? Number(importeInput.toFixed(2))
        : Number((costoNum * cantidadNum).toFixed(2));
      return {
        ...row,
        productId: prod?.id ?? row.productId ?? null,
        codigo: prod?.codigo ?? row.codigo ?? "",
        nombre: prod?.nombre ?? row.nombre ?? "",
        unidadMedida: prod?.unidadMedida ?? row.unidadMedida ?? "",
        stock: prod ? Number(prod.cantidad ?? 0) : Number(row.stock ?? 0) || 0,
        preCosto: costoNum,
        preVenta: prod
          ? Number(prod.preVenta ?? 0)
          : Number(row.preVenta ?? 0) || 0,
        cantidad: cantidadNum,
        descuento: descuentoNum,
        importe: importeNum,
      };
    });

  const handleTableChange = (rows: any[]) => {
    const normalized = normalizeRows(rows);
    setTableData(normalized);
    setValue("items", normalized, { shouldDirty: true });
    if (mode === "create") {
      setDraftItems(normalized);
    }
  };

  const ImportCell = ({ getValue, row, table }: any) => {
    const initialValue = Number(getValue() ?? 0) || 0;
    const [value, setValue] = useState<string>(initialValue.toString());

    useEffect(() => {
      setValue(initialValue.toString());
    }, [initialValue]);

    const onBlur = () => {
      const cantidad = Number(row.getValue("cantidad") ?? 1) || 1;
      const importeNum = Number(value) || 0;
      const newCosto =
        cantidad > 0 ? Number((importeNum / cantidad).toFixed(2)) : 0;

      table.options.meta?.updateRow(row.index, (r: any) => ({
        ...r,
        importe: importeNum,
        preCosto: newCosto,
      }));
    };

    return (
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
      />
    );
  };

  const productMap = useMemo(
    () => new Map(productOptions.map((p) => [String(p.value), p.data])),
    [productOptions]
  );

  const QuantityCell = ({ getValue, row, table }: any) => {
    const initialValue = Number(getValue() ?? 0) || 0;
    const [value, setValue] = useState<string>(initialValue.toString());

    useEffect(() => {
      setValue(initialValue.toString());
    }, [initialValue]);

    const onBlur = () => {
      const qty = Number(value) || 0;
      const costo = Number(row.getValue("preCosto") ?? 0) || 0;
      const importe = Number((qty * costo).toFixed(2));

      table.options.meta?.updateRow(row.index, (r: any) => ({
        ...r,
        cantidad: qty,
        importe,
      }));
    };

    return (
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
      />
    );
  };

  const CostCell = ({ getValue, row, table }: any) => {
    const initialValue = Number(getValue() ?? 0) || 0;
    const [value, setValue] = useState<string>(initialValue.toString());

    useEffect(() => {
      setValue(initialValue.toString());
    }, [initialValue]);

    const onBlur = () => {
      const costo = Number(value) || 0;
      const qty = Number(row.getValue("cantidad") ?? 0) || 0;
      const importe = Number((qty * costo).toFixed(2));

      table.options.meta?.updateRow(row.index, (r: any) => ({
        ...r,
        preCosto: costo,
        importe,
      }));
    };

    return (
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
      />
    );
  };

  const columns = useMemo(() => {
    return [
      {
        accessorKey: "productId",
        header: "Producto",
        cell: AutocompleteTableCell,

        meta: {
          defaultValue: null,
          options: productOptions,
          width: "270px",
        },
      },
      {
        accessorKey: "unidadMedida",
        header: "UM",
        cell: EditableTextCell,
        meta: { defaultValue: "", disabled: true },
      },
      {
        accessorKey: "cantidad",
        header: "Cantidad",
        cell: QuantityCell,
        meta: { defaultValue: 1 },
      },
      {
        accessorKey: "preCosto",
        header: "Costo",
        cell: CostCell,
        meta: { defaultValue: 0 },
      },
      {
        accessorKey: "descuento",
        header: "Descuento",
        cell: EditableNumberCell,
        meta: { defaultValue: 0 },
      },
      {
        accessorKey: "importe",
        header: "Importe",
        cell: ImportCell,
        meta: { defaultValue: 0 },
      },
    ];
  }, [productOptions]);

  const onSubmit = (values: ShoppingFormData) => {
    const detail =
      tableData?.filter(
        (i) => i.productId !== null && i.productId !== undefined
      ) ?? [];
    onSave({
      ...values,
      proveedor: values.proveedor?.toUpperCase() ?? "",
      descripcion: values.descripcion?.toUpperCase() ?? "",
      concepto: values.concepto ?? "",
      items: detail,
    });
    if (mode === "create") {
      clearDraftItems();
      const emptyRow = {
        productId: null,
        codigo: "",
        nombre: "",
        unidadMedida: "",
        stock: 0,
        preCosto: 0,
        preVenta: 0,
        cantidad: 1,
        descuento: 0,
        importe: 0,
      };
      reset({
        concepto: "",
        proveedor: "",
        descripcion: "",
        ruc: "",
        fechaEmision: new Date().toISOString().slice(0, 10),
        documento: "",
        serie: "",
        numero: "",
        condicion: "",
        moneda: "",
        diasPlazo: 0,
        fechaPago: "",
        tipoIgv: "",
        tipoCambio: 0,
        items: [emptyRow],
      });
      setTableData([emptyRow]);
      setValue("items", [emptyRow]);
      onNew?.();
    }
  };

  const handleNew = () => {
    clearDraftItems();
    const emptyRow = {
      productId: null,
      codigo: "",
      nombre: "",
      unidadMedida: "",
      stock: 0,
      preCosto: 0,
      preVenta: 0,
      cantidad: 1,
      descuento: 0,
      importe: 0,
    };
    reset({
      concepto: "",
      proveedor: "",
      descripcion: "",
      ruc: "",
      fechaEmision: new Date().toISOString().slice(0, 10),
      documento: "",
      serie: "",
      numero: "",
      condicion: "",
      moneda: "",
      diasPlazo: 0,
      fechaPago: "",
      tipoIgv: "",
      tipoCambio: 0,
      items: [emptyRow],
    });
    setTableData([emptyRow]);
    setValue("items", [emptyRow]);
    onNew?.();
    focusFirstInput(containerRef.current);
  };

  return (
    <div ref={containerRef} className="py-6 px-3 sm:px-4 lg:px-6 w-full">
      <div className="mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <HookForm methods={formMethods} onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-slate-700 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
            <h1 className="text-base font-semibold">
              {mode === "create" ? "Nueva Compra" : "Editar Compra"}
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
              {mode === "create" && (
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

          <div className="p-6 sm:p-7">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6 ">
              <div className="space-y-4 col-span-2  overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <HookFormAutocomplete<ShoppingFormData>
                      name="proveedor"
                      label="Proveedor"
                      options={providerOptions}
                      placeholder="Seleccionar proveedor"
                      rules={{
                        validate: (value) =>
                          isBoleta ||
                          (value?.trim()
                            ? true
                            : "El proveedor es obligatorio"),
                      }}
                      onOptionSelected={(option) => {
                        if (option?.ruc) {
                          setValue("ruc", option.ruc, { shouldDirty: true });
                        }
                      }}
                    />
                  </div>
                  <HookFormAutocomplete<ShoppingFormData>
                    name="ruc"
                    label="RUC"
                    options={rucOptions}
                    placeholder="RUC"
                    rules={{
                      validate: (value) => {
                        if (isBoleta) return true;
                        if (!value?.trim()) return "El RUC es obligatorio";
                        return (
                          /^\d{8,11}$/.test(value.trim()) ||
                          "Ingrese un RUC valido"
                        );
                      },
                    }}
                    onOptionSelected={(option) => {
                      if (option?.razon) {
                        setValue("proveedor", option.razon, {
                          shouldDirty: true,
                        });
                      }
                    }}
                  />

                  <HookFormInput<ShoppingFormData>
                    name="fechaEmision"
                    label="Fecha de emision"
                    type="date"
                    rules={{ required: "La fecha de emision es obligatoria" }}
                  />
                  <HookFormSelect<ShoppingFormData>
                    name="documento"
                    label="Documento"
                    options={[
                      { value: "", label: "Seleccionar..." },
                      ...documentoOptions,
                    ]}
                    rules={{ required: "El documento es obligatorio" }}
                  />

                  <HookFormInput<ShoppingFormData>
                    name="numero"
                    label="Numero de serie"
                    placeholder="Numero"
                    rules={{ required: "El numero es obligatorio" }}
                  />

                  <HookFormSelect<ShoppingFormData>
                    name="condicion"
                    label="Condicion"
                    options={[
                      { value: "", label: "Seleccionar..." },
                      ...condicionOptions,
                    ]}
                    rules={{ required: "La condicion es obligatoria" }}
                  />
                  <HookFormSelect<ShoppingFormData>
                    name="tipoIgv"
                    label="Tipo IGV"
                    options={[
                      { value: "", label: "Seleccionar..." },
                      ...tipoIgvOptions,
                    ]}
                    rules={{ required: "El tipo de IGV es obligatorio" }}
                  />
                  <HookFormInput<ShoppingFormData>
                    name="diasPlazo"
                    label="Dias de plazo"
                    type="number"
                    disabled={!isCredito}
                    rules={{
                      valueAsNumber: true,
                      min: { value: 0, message: "Debe ser 0 o mayor" },
                    }}
                  />

                  <HookFormInput<ShoppingFormData>
                    name="fechaPago"
                    label="Fecha de pago"
                    type="date"
                    disabled={!isCredito}
                    rules={{
                      validate: (value) =>
                        !isCredito ||
                        !!value ||
                        "La fecha de pago es obligatoria",
                    }}
                  />
                </div>
                <TotalsPanel
                  tableData={tableData}
                  descuento={descuento}
                  percepcion={percepcion}
                  onChangeDescuento={setDescuento}
                  onChangePercepcion={setPercepcion}
                />
              </div>

              <div className="space-y-3 col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <HookFormAutocomplete<ShoppingFormData>
                    name="concepto"
                    label="Concepto"
                    options={conceptOptions}
                    placeholder="Seleccionar concepto"
                    rules={{ required: "El concepto es obligatorio" }}
                  />
                </div>

                <EditableDataTable
                  data={tableData}
                  columns={columns}
                  onDataChange={handleTableChange}
                  enablePagination={false}
                  enableFiltering={false}
                  enableSorting={false}
                />
              </div>
            </div>
          </div>
        </HookForm>
      </div>
    </div>
  );
}

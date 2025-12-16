import React, { useEffect, useMemo, useRef, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
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
  { value: "Factura", label: "Factura" },
  { value: "Boleta", label: "Boleta" },
  { value: "Recibo", label: "Recibo" },
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
  { value: "Gravado", label: "Gravado" },
  { value: "Exonerado", label: "Exonerado" },
  { value: "Inafecto", label: "Inafecto" },
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
    watch,
    formState: { isSubmitting },
  } = formMethods;
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

  useEffect(() => {
    reset(defaults);
    setTableData(defaults.items);
    setValue("items", defaults.items);
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

  const normalizeRows = (rows: ShoppingItem[]): ShoppingItem[] =>
    rows.map((row) => {
      const prod = productMap.get(row.productId ?? row["productId"]);
      return {
        ...row,
        productId: prod?.id ?? row.productId ?? null,
        codigo: prod?.codigo ?? row.codigo ?? "",
        nombre: prod?.nombre ?? row.nombre ?? "",
        unidadMedida: prod?.unidadMedida ?? row.unidadMedida ?? "",
        stock: prod ? Number(prod.cantidad ?? 0) : Number(row.stock ?? 0) || 0,
        preCosto: prod
          ? Number(prod.preCosto ?? 0)
          : Number(row.preCosto ?? 0) || 0,
        preVenta: prod
          ? Number(prod.preVenta ?? 0)
          : Number(row.preVenta ?? 0) || 0,
        cantidad: Number(row.cantidad ?? 1) || 1,
      };
    });

  const handleTableChange = (rows: any[]) => {
    const normalized = normalizeRows(rows);
    setTableData(normalized);
    setValue("items", normalized, { shouldDirty: true });
  };

  const productMap = useMemo(
    () => new Map(productOptions.map((p) => [p.value, p.data])),
    [productOptions]
  );

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
        header: "Unidad",
        cell: EditableTextCell,
        meta: { defaultValue: "" },
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: EditableNumberCell,
        meta: { defaultValue: 0 },
      },
      {
        accessorKey: "preCosto",
        header: "Costo",
        cell: EditableNumberCell,
        meta: { defaultValue: 0 },
      },
      {
        accessorKey: "preVenta",
        header: "Precio venta",
        cell: EditableNumberCell,
        meta: { defaultValue: 0 },
      },
      {
        accessorKey: "cantidad",
        header: "Cantidad",
        cell: EditableNumberCell,
        meta: { defaultValue: 1 },
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
      const emptyRow = {
        productId: null,
        codigo: "",
        nombre: "",
        unidadMedida: "",
        stock: 0,
        preCosto: 0,
        preVenta: 0,
        cantidad: 1,
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
    const emptyRow = {
      productId: null,
      codigo: "",
      nombre: "",
      unidadMedida: "",
      stock: 0,
      preCosto: 0,
      preVenta: 0,
      cantidad: 1,
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
      <div className="mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-7 ">
        <HookForm methods={formMethods} onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6 ">
            <div className="space-y-4 col-span-2 max-h-[640px] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <HookFormAutocomplete<ShoppingFormData>
                    name="proveedor"
                    label="Proveedor"
                    options={providerOptions}
                    placeholder="Seleccionar proveedor"
                    rules={{ required: "El proveedor es obligatorio" }}
                    onOptionSelected={(option) => {
                      if (option?.ruc) {
                        setValue("ruc", option.ruc, { shouldDirty: true });
                      }
                    }}
                  />
                </div>
                <HookFormInput<ShoppingFormData>
                  name="ruc"
                  label="RUC"
                  placeholder="RUC"
                  inputMode="numeric"
                  rules={{
                    validate: (value) =>
                      !value?.trim() ||
                      /^\d{8,11}$/.test(value.trim()) ||
                      "Ingrese un RUC valido",
                  }}
                />

                <HookFormInput<ShoppingFormData>
                  name="fechaEmision"
                  label="Fecha de emision"
                  type="date"
                  rules={{ required: "La fecha de emision es obligatoria" }}
                />
                <div className="col-span-2">
                  <HookFormSelect<ShoppingFormData>
                    name="documento"
                    label="Documento"
                    options={[
                      { value: "", label: "Seleccionar..." },
                      ...documentoOptions,
                    ]}
                    rules={{ required: "El documento es obligatorio" }}
                  />
                </div>

                <HookFormInput<ShoppingFormData>
                  name="serie"
                  label="Serie"
                  placeholder="Serie"
                  rules={{ required: "La serie es obligatoria" }}
                />

                <HookFormInput<ShoppingFormData>
                  name="numero"
                  label="Numero"
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
                  name="moneda"
                  label="Moneda"
                  options={[
                    { value: "", label: "Seleccionar..." },
                    ...monedaOptions,
                  ]}
                  rules={{ required: "La moneda es obligatoria" }}
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
                <HookFormSelect<ShoppingFormData>
                  name="tipoIgv"
                  label="Tipo IGV"
                  options={[
                    { value: "", label: "Seleccionar..." },
                    ...tipoIgvOptions,
                  ]}
                  rules={{ required: "El tipo de IGV es obligatorio" }}
                />
              </div>
              <HookFormInput<ShoppingFormData>
                name="descripcion"
                label="Descripcion"
                placeholder="Descripcion breve"
                rules={{ required: "La descripcion es obligatoria" }}
              />

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

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-70"
            >
              <Save />
              Guardar
            </button>
            {mode === "create" && (
              <button
                type="button"
                onClick={handleNew}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg"
              >
                <Plus />
                Nuevo
              </button>
            )}
            {mode === "edit" && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-lg"
              >
                <Trash2 />
                Eliminar
              </button>
            )}
          </div>
        </HookForm>
      </div>
    </div>
  );
}

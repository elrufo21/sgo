import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Save,
  Plus,
  Trash2,
  X,
  Camera,
  Upload,
  PlusIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import TextField from "@mui/material/TextField";
import type { Product } from "@/types/product";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { focusNextInput } from "@/shared/helpers/focusNextInput";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useDialogStore } from "@/store/app/dialog.store";
import { useProductsStore } from "@/store/products/products.store";
import { useAuthStore } from "@/store/auth/auth.store";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { HookFormAutocomplete } from "./forms/HookFormAutocomplete";
import { BackArrowButton } from "@/components/common/BackArrowButton";
import { getLocalDateISO } from "@/shared/helpers/localDate";
import CategoriaForm from "./maintenance/CategoriaForm";
import type { Category } from "@/types/maintenance";

interface ProductFormBaseProps {
  initialData?: Partial<Product>;
  mode: "create" | "edit";
  onSave: (
    data: Omit<Product, "id"> & { images?: string[]; imageFile?: File | null },
  ) => Promise<boolean | void> | boolean | void;
  onNew?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const unidadesMedida = ["Unidad", "Kg", "Litro", "Caja", "Docena"];

const buildUserDate = () => `user-${getLocalDateISO()}`;
const toSafePositiveNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};
const normalizeUnitLabel = (value: unknown) => String(value ?? "").trim();
const parseUnitsPerPackage = (value: unknown) => {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "")
    .replace(",", ".")
    .trim();
  if (!normalized) return NaN;
  return Number(normalized);
};
const formatMoney = (value: number) => `S/ ${value.toFixed(2)}`;

const deriveInitialUnitsPerPackage = (
  initialData?: Partial<Product>,
  altRow?: Record<string, unknown> | null,
): number | null => {
  if (!initialData || !altRow) return null;

  const explicitFactor = toSafePositiveNumber(altRow.factor ?? altRow.valorUM);
  if (explicitFactor > 1) {
    return Number(explicitFactor.toFixed(2));
  }

  const baseStock = toSafePositiveNumber(initialData.cantidad);
  const altStock = toSafePositiveNumber(altRow.cantidad);
  if (baseStock > 0 && altStock > 0) {
    const byStock = baseStock / altStock;
    if (Number.isFinite(byStock) && byStock > 1) {
      return Number(byStock.toFixed(2));
    }
  }

  const baseVenta = toSafePositiveNumber(initialData.preVenta);
  const altVenta = toSafePositiveNumber(altRow.preVenta);
  if (baseVenta > 0 && altVenta > 0) {
    const byVenta = baseVenta / altVenta;
    if (Number.isFinite(byVenta) && byVenta > 1) {
      return Number(byVenta.toFixed(2));
    }
  }

  const baseCosto = toSafePositiveNumber(initialData.preCosto);
  const altCosto = toSafePositiveNumber(altRow.preCosto);
  if (baseCosto > 0 && altCosto > 0) {
    const byCosto = baseCosto / altCosto;
    if (Number.isFinite(byCosto) && byCosto > 1) {
      return Number(byCosto.toFixed(2));
    }
  }

  return null;
};

type ProductFormValues = Omit<Product, "id"> & {
  images?: string[];
  preVentaB?: number | null;
  imageFile?: File | null;
  imageRemoved?: boolean;
  aplicaOtraUnidad?: boolean;
  unidadAlterna?: string;
  unidadesPorEmpaque?: number | null;
  preVentaUnidadAlterna?: number | null;
};

type OtherUnitDialogData = {
  unidadPrincipal: string;
  unidadAlterna: string;
  unidadesPorEmpaque: string;
  preVentaUnidadAlterna: string;
  preVenta: number;
  preCosto: number;
  error: string;
};

const toDialogString = (value: unknown, fallback = "") => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const parseOtherUnitDialogData = (
  value: unknown,
  fallback?: Partial<OtherUnitDialogData>,
): OtherUnitDialogData => {
  const source =
    value && typeof value === "object"
      ? (value as Partial<OtherUnitDialogData>)
      : {};

  const unidadPrincipal = normalizeUnitLabel(
    source.unidadPrincipal ?? fallback?.unidadPrincipal ?? "Unidad",
  );

  return {
    unidadPrincipal: unidadPrincipal || "Unidad",
    unidadAlterna: toDialogString(
      source.unidadAlterna,
      fallback?.unidadAlterna ?? "",
    ),
    unidadesPorEmpaque: toDialogString(
      source.unidadesPorEmpaque,
      fallback?.unidadesPorEmpaque ?? "",
    ),
    preVentaUnidadAlterna: toDialogString(
      source.preVentaUnidadAlterna,
      fallback?.preVentaUnidadAlterna ?? "",
    ),
    preVenta: toSafePositiveNumber(source.preVenta ?? fallback?.preVenta ?? 0),
    preCosto: toSafePositiveNumber(source.preCosto ?? fallback?.preCosto ?? 0),
    error: toDialogString(source.error, fallback?.error ?? ""),
  };
};

const sharedDialogInputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "0.45rem",
    backgroundColor: "#fff",
    "& fieldset": {
      borderWidth: "1px",
      borderColor: "#e5e7eb",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 2px rgba(59,130,246,0.25)",
    },
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "0.875rem",
    py: 1,
  },
};

function OtherUnitDialogContent() {
  const rawDialogData = useDialogStore((s) => s.data);
  const setDialogData = useDialogStore((s) => s.setData);
  const unidadBaseInputRef = useRef<HTMLInputElement | null>(null);
  const dialogData = parseOtherUnitDialogData(rawDialogData);
  const unidadBaseDraft =
    normalizeUnitLabel(dialogData.unidadAlterna) || "Unidad";
  const unidadesPorEmpaqueDraft = toSafePositiveNumber(
    dialogData.unidadesPorEmpaque,
  );
  const precioVentaUnitarioDraft = toSafePositiveNumber(
    dialogData.preVentaUnidadAlterna,
  );
  const precioVentaUnitarioSugerido =
    unidadesPorEmpaqueDraft > 0
      ? dialogData.preVenta / unidadesPorEmpaqueDraft
      : 0;
  const precioCostoUnitarioPreview =
    unidadesPorEmpaqueDraft > 0
      ? dialogData.preCosto / unidadesPorEmpaqueDraft
      : 0;

  const updateField = (
    field: "unidadAlterna" | "unidadesPorEmpaque" | "preVentaUnidadAlterna",
    value: string,
  ) => {
    const normalizedValue =
      field === "unidadAlterna"
        ? String(value ?? "").toLocaleUpperCase("es-PE")
        : value;
    setDialogData((prevData) => {
      const latestDialogData = parseOtherUnitDialogData(prevData);
      return {
        ...latestDialogData,
        [field]: normalizedValue,
        error: "",
      };
    });
  };

  useEffect(() => {
    const focusInput = () => {
      const input = unidadBaseInputRef.current;
      if (!input) return false;
      input.focus({ preventScroll: true });
      input.select();
      return true;
    };

    window.requestAnimationFrame(() => {
      if (focusInput()) return;
      window.setTimeout(() => {
        focusInput();
      }, 0);
    });
  }, []);

  const handleFieldBlur =
    (field: "unidadAlterna" | "unidadesPorEmpaque" | "preVentaUnidadAlterna") =>
    (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      updateField(field, target.value ?? "");
    };

  const handleFieldCompositionEnd =
    (field: "unidadAlterna" | "unidadesPorEmpaque" | "preVentaUnidadAlterna") =>
    (event: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      updateField(field, target.value ?? "");
    };

  const handleFieldInput =
    (field: "unidadAlterna" | "unidadesPorEmpaque" | "preVentaUnidadAlterna") =>
    (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      updateField(field, target.value ?? "");
    };

  const handleFieldEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    focusNextInput(event.target as HTMLElement);
  };

  const handleNumberFieldKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      return;
    }
    handleFieldEnter(event);
  };

  return (
    <div className="space-y-4 py-1">
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
        <p className="text-slate-500">Unidad principal del producto</p>
        <p className="font-semibold text-slate-800 uppercase">
          {dialogData.unidadPrincipal}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField
          fullWidth
          autoFocus
          size="small"
          label="Unidad base"
          value={dialogData.unidadAlterna}
          onChange={(event) => {
            updateField("unidadAlterna", event.target.value);
          }}
          onBlur={handleFieldBlur("unidadAlterna")}
          onInput={handleFieldInput("unidadAlterna")}
          onCompositionEnd={handleFieldCompositionEnd("unidadAlterna")}
          onKeyDown={handleFieldEnter}
          placeholder="Ej: UNIDAD"
          autoComplete="off"
          inputRef={unidadBaseInputRef}
          sx={sharedDialogInputSx}
          inputProps={{
            name: "sgo_unidad_base_modal",
            "data-auto-next": "true",
            "data-no-history-guard": "true",
            autoComplete: "new-password",
            autoCorrect: "off",
            autoCapitalize: "off",
            spellCheck: false,
          }}
        />

        <TextField
          fullWidth
          size="small"
          type="number"
          label={`Cantidad por ${dialogData.unidadPrincipal}`}
          value={dialogData.unidadesPorEmpaque}
          onChange={(event) => {
            updateField("unidadesPorEmpaque", event.target.value);
          }}
          onBlur={handleFieldBlur("unidadesPorEmpaque")}
          onInput={handleFieldInput("unidadesPorEmpaque")}
          onCompositionEnd={handleFieldCompositionEnd("unidadesPorEmpaque")}
          onKeyDown={handleNumberFieldKeyDown}
          placeholder="Ej: 20"
          autoComplete="off"
          sx={{
            ...sharedDialogInputSx,
            "& input[type=number]": {
              MozAppearance: "textfield",
            },
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
              {
                WebkitAppearance: "none",
                margin: 0,
              },
          }}
          inputProps={{
            name: "sgo_unidades_empaque_modal",
            min: 2,
            step: 1,
            "data-auto-next": "true",
            "data-no-history-guard": "true",
            autoComplete: "new-password",
          }}
        />

        <TextField
          fullWidth
          size="small"
          type="number"
          label={`Precio venta por ${unidadBaseDraft}`}
          value={dialogData.preVentaUnidadAlterna}
          onChange={(event) => {
            updateField("preVentaUnidadAlterna", event.target.value);
          }}
          onBlur={handleFieldBlur("preVentaUnidadAlterna")}
          onInput={handleFieldInput("preVentaUnidadAlterna")}
          onCompositionEnd={handleFieldCompositionEnd("preVentaUnidadAlterna")}
          onKeyDown={handleNumberFieldKeyDown}
          placeholder="Ej: 2.50"
          autoComplete="off"
          sx={{
            ...sharedDialogInputSx,
            "& input[type=number]": {
              MozAppearance: "textfield",
            },
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
              {
                WebkitAppearance: "none",
                margin: 0,
              },
          }}
          inputProps={{
            min: 0.01,
            step: 0.01,
            "data-auto-next": "true",
            "data-no-history-guard": "true",
            autoComplete: "new-password",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <p className="text-slate-500">
            Precio total ({dialogData.unidadPrincipal})
          </p>
          <p className="font-semibold text-slate-800">
            Venta: {formatMoney(dialogData.preVenta)} | Costo:{" "}
            {formatMoney(dialogData.preCosto)}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <p className="text-slate-500">Precio por {unidadBaseDraft}</p>
          <p className="text-xs text-slate-500">
            Sugerido: {formatMoney(precioVentaUnitarioSugerido)}
          </p>
          <p className="font-semibold text-slate-800">
            Venta: {formatMoney(precioVentaUnitarioDraft)} | Costo:{" "}
            {formatMoney(precioCostoUnitarioPreview)}
          </p>
        </div>
      </div>

      {dialogData.error ? (
        <p className="text-sm text-red-600">{dialogData.error}</p>
      ) : null}
    </div>
  );
}

export default function ProductFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onArchive,
  onDelete,
}: ProductFormBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryFieldRef = useRef<HTMLDivElement>(null);
  const authUser = useAuthStore((s) => s.user);
  const { categories, fetchCategories, addCategory, updateCategory } =
    useMaintenanceStore();
  const { products, fetchProducts } = useProductsStore();
  const fallbackUser = useMemo(
    () => authUser?.displayName ?? authUser?.username ?? buildUserDate(),
    [authUser],
  );
  const productsLoading = useProductsStore((s) => s.loading);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [takingPhoto, setTakingPhoto] = useState(false);

  const generateCode = useCallback(() => {
    const latestProducts = useProductsStore.getState().products ?? [];
    const codePattern = /^(PRO)([-_ ]?)(\d+)$/i;

    const validCodes = latestProducts
      .filter((product) => {
        const normalizedStatus = String(product.estado ?? "")
          .trim()
          .toLowerCase();
        return normalizedStatus === "bueno" || normalizedStatus === "activo";
      })
      .map((product) => {
        const rawCode = String(product.codigo ?? "")
          .trim()
          .toUpperCase();
        const match = rawCode.match(codePattern);
        if (!match) return null;

        const [, rawPrefix, separator, numericPart] = match;
        const numericValue = Number.parseInt(numericPart, 10);
        if (!Number.isFinite(numericValue)) return null;

        return {
          prefix: (rawPrefix ?? "").toUpperCase(),
          separator: separator ?? "",
          numericPartLength: numericPart.length,
          numericValue,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (!validCodes.length) {
      return "PRO000001";
    }

    const latestCode = validCodes.reduce((maxItem, currentItem) =>
      currentItem.numericValue > maxItem.numericValue ? currentItem : maxItem,
    );

    const nextValue = latestCode.numericValue + 1;
    const nextLength = Math.max(6, latestCode.numericPartLength);
    return `${latestCode.prefix}${latestCode.separator}${String(nextValue).padStart(nextLength, "0")}`;
  }, []);

  const incrementCodeFromCurrent = useCallback(
    (currentCode: string) => {
      const trimmed = String(currentCode ?? "")
        .trim()
        .toUpperCase();
      const match = trimmed.match(/^(PRO)([-_ ]?)(\d+)$/i);
      if (!match) return generateCode();

      const [, rawPrefix, rawSeparator, numericPart] = match;
      const prefix = (rawPrefix ?? "").toUpperCase();
      const separator = rawSeparator ?? "";
      const numericValue = Number.parseInt(numericPart, 10);
      if (!Number.isFinite(numericValue)) return generateCode();

      const nextValue = numericValue + 1;
      const nextLength = Math.max(6, numericPart.length);
      return `${prefix}${separator}${String(nextValue).padStart(nextLength, "0")}`;
    },
    [generateCode],
  );

  const defaults = useMemo<ProductFormValues>(() => {
    const altRows = Array.isArray((initialData as any)?.unidadesAlternas)
      ? ((initialData as any).unidadesAlternas as Array<
          Record<string, unknown>
        >)
      : [];
    const firstAltRow = altRows.find((row) =>
      normalizeUnitLabel(row?.unidadMedida ?? row?.unidad),
    );
    const derivedUnidadAlterna = normalizeUnitLabel(
      firstAltRow?.unidadMedida ?? firstAltRow?.unidad,
    );
    const derivedUnidadesPorEmpaque = deriveInitialUnitsPerPackage(
      initialData,
      firstAltRow ?? null,
    );
    const derivedAplicaOtraUnidad = Boolean(
      derivedUnidadAlterna &&
      toSafePositiveNumber(derivedUnidadesPorEmpaque) > 1,
    );
    const explicitAplicaOtraUnidad = (initialData as any)?.aplicaOtraUnidad;
    const explicitUnidadAlterna = normalizeUnitLabel(
      (initialData as any)?.unidadAlterna,
    );
    const explicitUnidadesPorEmpaque = toSafePositiveNumber(
      (initialData as any)?.unidadesPorEmpaque,
    );
    const explicitPreVentaUnidadAlterna = toSafePositiveNumber(
      (initialData as any)?.preVentaUnidadAlterna,
    );
    const derivedPreVentaUnidadAlterna = toSafePositiveNumber(
      firstAltRow?.preVenta,
    );
    const explicitFromFields = Boolean(
      explicitUnidadAlterna && explicitUnidadesPorEmpaque > 1,
    );

    return {
      categoria: initialData?.categoria ?? "",
      idSubLinea:
        initialData?.idSubLinea !== undefined &&
        initialData?.idSubLinea !== null
          ? Number(initialData.idSubLinea)
          : null,
      codigo: initialData?.codigo ?? (mode === "create" ? generateCode() : ""),
      nombre: initialData?.nombre ?? "",
      unidadMedida: initialData?.unidadMedida ?? "Unidad",
      valorCritico: initialData?.valorCritico ?? 0,
      preCosto: initialData?.preCosto ?? null,
      preVenta: initialData?.preVenta ?? null,
      preVentaB: 0,
      aplicaINV:
        initialData?.aplicaINV === "N" || initialData?.aplicaINV === "S"
          ? initialData.aplicaINV
          : "S",
      cantidad: initialData?.cantidad ?? null,
      usuario: initialData?.usuario ?? fallbackUser,
      estado: initialData?.estado ?? "ACTIVO",
      images: initialData?.images ?? [],
      imageFile: null,
      imageRemoved: false,
      aplicaOtraUnidad:
        explicitAplicaOtraUnidad !== undefined &&
        explicitAplicaOtraUnidad !== null
          ? Boolean(explicitAplicaOtraUnidad)
          : explicitFromFields || derivedAplicaOtraUnidad,
      unidadAlterna: explicitUnidadAlterna || derivedUnidadAlterna,
      unidadesPorEmpaque:
        explicitUnidadesPorEmpaque > 0
          ? explicitUnidadesPorEmpaque
          : derivedUnidadesPorEmpaque,
      preVentaUnidadAlterna:
        explicitPreVentaUnidadAlterna > 0
          ? explicitPreVentaUnidadAlterna
          : derivedPreVentaUnidadAlterna > 0
            ? derivedPreVentaUnidadAlterna
            : null,
    };
  }, [initialData, mode, fallbackUser, generateCode]);

  const formMethods = useForm<ProductFormValues>({
    defaultValues: defaults,
  });

  const {
    handleSubmit,
    reset,
    setFocus,
    setValue,
    watch,
    getValues,
    setError,
    clearErrors,
    formState: { isSubmitting, errors, dirtyFields },
  } = formMethods;
  const openDialog = useDialogStore((s) => s.openDialog);
  const setDialogData = useDialogStore((s) => s.setData);

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const focusCategoryField = useCallback(() => {
    const focusInput = () => {
      setFocus("idSubLinea");

      const categoryInput =
        categoryFieldRef.current?.querySelector<HTMLInputElement>("input");
      if (!categoryInput) return false;
      categoryInput.focus();
      categoryInput.select();
      return true;
    };

    window.requestAnimationFrame(() => {
      if (focusInput()) return;
      window.setTimeout(() => {
        focusInput();
      }, 0);
    });
  }, [setFocus]);

  const focusProductNameField = useCallback(() => {
    const focusInput = () => {
      setFocus("nombre");
      const nameInput =
        containerRef.current?.querySelector<HTMLInputElement>(
          'input[name="nombre"]',
        ) ?? null;
      if (!nameInput) return false;
      nameInput.focus();
      nameInput.select();
      return true;
    };

    window.requestAnimationFrame(() => {
      if (focusInput()) return;
      window.setTimeout(() => {
        if (focusInput()) return;
        window.setTimeout(() => {
          focusInput();
        }, 120);
      }, 0);
    });
  }, [setFocus]);

  useEffect(() => {
    focusCategoryField();
  }, [mode, initialData, focusCategoryField]);

  useEffect(() => {
    if (!categories.length) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  useEffect(() => {
    if (!products.length) {
      fetchProducts();
    }
  }, [products.length, fetchProducts]);

  useEffect(() => {
    if (mode !== "create") return;
    if (productsLoading) return;
    if (dirtyFields.codigo) return;

    const nextCode = generateCode();
    const currentCode = String(getValues("codigo") ?? "").trim();
    if (currentCode === nextCode) return;

    setValue("codigo", nextCode, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [
    mode,
    products,
    productsLoading,
    dirtyFields.codigo,
    generateCode,
    getValues,
    setValue,
  ]);

  const selectedSubLineaId = watch("idSubLinea");
  const unidadMedidaActual = watch("unidadMedida");
  const aplicaINV = watch("aplicaINV");
  const aplicaOtraUnidad = Boolean(watch("aplicaOtraUnidad"));
  const preVentaActual = toSafePositiveNumber(watch("preVenta"));
  const preCostoActual = toSafePositiveNumber(watch("preCosto"));
  const isServiceProduct = aplicaINV === "N";
  const placeholderImage =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20' font-family='Arial, sans-serif'>No image</text></svg>";
  const currentImage = (watch("images")?.[0] ?? "").trim();
  const displayImage = currentImage !== "" ? currentImage : placeholderImage;
  const hasImage = currentImage !== "";

  const unidadMedidaOptions = useMemo(() => {
    const opciones = new Set<string>();
    unidadesMedida.forEach((u) => u && opciones.add(u));
    products.forEach((p) => {
      const unidad = (p.unidadMedida ?? "").trim();
      if (unidad) opciones.add(unidad);
    });
    const valorActual = (unidadMedidaActual ?? "").trim();
    if (valorActual) opciones.add(valorActual);

    return [
      { value: "", label: "Seleccionar..." },
      ...Array.from(opciones).map((u) => ({ value: u, label: u })),
    ];
  }, [products, unidadMedidaActual]);

  useEffect(() => {
    if (selectedSubLineaId === null || selectedSubLineaId === undefined) {
      setValue("categoria", "");
      return;
    }
    const selected = categories.find(
      (cat) => String(cat.id ?? cat.idSubLinea) === String(selectedSubLineaId),
    );
    setValue("categoria", selected?.nombreSublinea ?? "");
  }, [categories, selectedSubLineaId, setValue]);

  useEffect(() => {
    if (!isServiceProduct) return;

    setValue("cantidad", 0, { shouldDirty: true, shouldValidate: true });
    clearErrors(["cantidad"]);
  }, [isServiceProduct, setValue, clearErrors]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setValue("images", [previewUrl]);
    setValue("imageFile", file, { shouldDirty: true, shouldValidate: true });
    setValue("imageRemoved", false, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeImage = () => {
    setValue("images", []);
    setValue("imageFile", null, { shouldDirty: true, shouldValidate: true });
    setValue("imageRemoved", true, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const openImageModal = () => {
    if (!hasImage) return;
    openDialog({
      title: "Foto del producto",
      content: (
        <div className="rounded-lg bg-black p-1">
          <img
            src={currentImage}
            alt="Foto producto ampliada"
            className="max-h-[75vh] w-full object-contain"
          />
        </div>
      ),
      cancelText: "Cerrar",
      maxWidth: "lg",
      fullWidth: true,
    });
  };

  const openOtherUnitModal = (modalError?: string) => {
    const unidadPrincipal = normalizeUnitLabel(getValues("unidadMedida"));
    const unidadAlterna = normalizeUnitLabel(getValues("unidadAlterna"));
    const unidadesPorEmpaque = getValues("unidadesPorEmpaque");
    const unidadesPorEmpaqueDraft = parseUnitsPerPackage(unidadesPorEmpaque);
    const preVentaUnidadAlterna = toSafePositiveNumber(
      getValues("preVentaUnidadAlterna"),
    );
    const preVentaUnidadAlternaSugerida =
      Number.isFinite(unidadesPorEmpaqueDraft) && unidadesPorEmpaqueDraft > 0
        ? preVentaActual / unidadesPorEmpaqueDraft
        : 0;
    const preVentaUnidadAlternaInicial =
      preVentaUnidadAlterna > 0
        ? preVentaUnidadAlterna
        : preVentaUnidadAlternaSugerida;
    const unidadBaseDefault =
      unidadAlterna &&
      unidadPrincipal &&
      unidadAlterna.toLowerCase() === unidadPrincipal.toLowerCase()
        ? ""
        : unidadAlterna || "";

    const initialDialogData: OtherUnitDialogData = {
      unidadPrincipal: unidadPrincipal || "Unidad",
      unidadAlterna: unidadBaseDefault,
      unidadesPorEmpaque:
        unidadesPorEmpaque === null || unidadesPorEmpaque === undefined
          ? ""
          : String(unidadesPorEmpaque),
      preVentaUnidadAlterna:
        preVentaUnidadAlternaInicial > 0
          ? String(Number(preVentaUnidadAlternaInicial.toFixed(2)))
          : "",
      preVenta: preVentaActual,
      preCosto: preCostoActual,
      error: typeof modalError === "string" ? modalError : "",
    };

    openDialog({
      title: "Configurar contenido por unidad principal",
      content: <OtherUnitDialogContent />,
      confirmText: "Guardar unidad",
      cancelText: "Cancelar",
      onConfirm: (data) => confirmOtherUnit(data),
      onCancel: handleOtherUnitDialogCancel,
      maxWidth: "md",
      fullWidth: true,
      disableBackdropClose: false,
      mobileActions: <></>,
    });
    setDialogData(initialDialogData);
  };

  const clearOtherUnitConfiguration = () => {
    setValue("aplicaOtraUnidad", false, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("unidadAlterna", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("unidadesPorEmpaque", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("preVentaUnidadAlterna", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleOtherUnitDialogCancel = () => {
    const appliesOtherUnit = Boolean(getValues("aplicaOtraUnidad"));
    const unidadPrincipal = normalizeUnitLabel(getValues("unidadMedida"));
    const unidadBase = normalizeUnitLabel(getValues("unidadAlterna"));
    const unidadesPorEmpaque = parseUnitsPerPackage(
      getValues("unidadesPorEmpaque"),
    );
    const preVentaUnidadAlterna = toSafePositiveNumber(
      getValues("preVentaUnidadAlterna"),
    );
    const hasValidConfig =
      !!unidadBase &&
      Number.isFinite(unidadesPorEmpaque) &&
      unidadesPorEmpaque > 1 &&
      unidadBase.toLowerCase() !== unidadPrincipal.toLowerCase() &&
      preVentaUnidadAlterna > 0;

    if (appliesOtherUnit && !hasValidConfig) {
      clearOtherUnitConfiguration();
    }
  };

  const confirmOtherUnit = (rawDialogData?: unknown) => {
    const fallbackDialogData: Partial<OtherUnitDialogData> = {
      unidadPrincipal:
        normalizeUnitLabel(getValues("unidadMedida")) || "Unidad",
      unidadAlterna: normalizeUnitLabel(getValues("unidadAlterna")) || "",
      unidadesPorEmpaque: toDialogString(getValues("unidadesPorEmpaque"), ""),
      preVentaUnidadAlterna: toDialogString(
        getValues("preVentaUnidadAlterna"),
        "",
      ),
      preVenta: preVentaActual,
      preCosto: preCostoActual,
      error: "",
    };
    const dialogData = parseOtherUnitDialogData(
      rawDialogData,
      fallbackDialogData,
    );
    const unidadAlterna = normalizeUnitLabel(dialogData.unidadAlterna);
    const unidadPrincipal = normalizeUnitLabel(dialogData.unidadPrincipal);
    const unidadesPorEmpaque = parseUnitsPerPackage(
      dialogData.unidadesPorEmpaque,
    );
    const preVentaUnidadAlterna = toSafePositiveNumber(
      dialogData.preVentaUnidadAlterna,
    );

    if (!unidadPrincipal) {
      setDialogData({
        ...dialogData,
        error: "Selecciona primero la unidad principal del producto.",
      });
      return false;
    }

    if (!unidadAlterna) {
      setDialogData({
        ...dialogData,
        error: "La unidad base es obligatoria.",
      });
      return false;
    }

    if (unidadAlterna.toLowerCase() === unidadPrincipal.toLowerCase()) {
      setDialogData({
        ...dialogData,
        error: "La unidad base debe ser distinta a la unidad principal.",
      });
      return false;
    }

    if (!Number.isFinite(unidadesPorEmpaque) || unidadesPorEmpaque <= 1) {
      setDialogData({
        ...dialogData,
        error: `Ingresa una cantidad mayor a 1 para 1 ${unidadPrincipal}.`,
      });
      return false;
    }

    if (!Number.isFinite(preVentaUnidadAlterna) || preVentaUnidadAlterna <= 0) {
      setDialogData({
        ...dialogData,
        error: `Ingresa un precio de venta valido para ${unidadAlterna}.`,
      });
      return false;
    }

    setValue("aplicaOtraUnidad", true, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("unidadAlterna", unidadAlterna, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("unidadesPorEmpaque", unidadesPorEmpaque, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("preVentaUnidadAlterna", preVentaUnidadAlterna, {
      shouldDirty: true,
      shouldValidate: true,
    });
    return true;
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTakingPhoto(false);
  };

  const startCamera = async () => {
    try {
      setTakingPhoto(true);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("No se pudo iniciar la camara", error);
      setTakingPhoto(false);
    }
  };

  const dataUrlToFile = (dataUrl: string, fileName: string) => {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0]?.match(/:(.*?);/);
    const mime = mimeMatch?.[1] ?? "image/png";
    const bstr = atob(arr[1] ?? "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    const file = dataUrlToFile(dataUrl, `producto-${Date.now()}.png`);

    setValue("images", [dataUrl], { shouldDirty: true });
    setValue("imageFile", file, { shouldDirty: true, shouldValidate: true });
    setValue("imageRemoved", false, {
      shouldDirty: true,
      shouldValidate: true,
    });
    stopCamera();
  };
  useEffect(() => stopCamera, []);

  const resetForm = () => {
    if (mode === "create") {
      reset({
        ...defaults,
        codigo: generateCode(),
      });
    } else {
      reset(defaults);
    }
    focusCategoryField();
  };

  const onSubmit = async (values: ProductFormValues) => {
    const trimmedCode = values.codigo?.trim() ?? "";
    if (!trimmedCode) {
      setError("codigo", {
        type: "required",
        message: "El codigo es obligatorio",
      });
      focusFirstInput(containerRef.current);
      return;
    }

    const appliesOtherUnit = Boolean(values.aplicaOtraUnidad);
    const unidadAlterna = String(values.unidadAlterna ?? "").trim();
    const unidadPrincipal = normalizeUnitLabel(values.unidadMedida)
      .toLocaleUpperCase("es-PE");
    const unidadesPorEmpaque = parseUnitsPerPackage(values.unidadesPorEmpaque);
    const preVentaUnidadAlterna = toSafePositiveNumber(
      values.preVentaUnidadAlterna,
    );

    if (
      appliesOtherUnit &&
      (!unidadAlterna ||
        !Number.isFinite(unidadesPorEmpaque) ||
        unidadesPorEmpaque <= 1 ||
        unidadAlterna.toLowerCase() === unidadPrincipal.toLowerCase() ||
        !Number.isFinite(preVentaUnidadAlterna) ||
        preVentaUnidadAlterna <= 0)
    ) {
      openOtherUnitModal(
        "Configura una unidad base valida, cuantas unidades contiene la unidad principal y su precio de venta antes de guardar.",
      );
      return;
    }

    const payload = {
      ...values,
      codigo: trimmedCode,
      aplicaINV: values.aplicaINV ?? "S",
      valorCritico: 0,
      preVentaB: 0,
      cantidad: values.aplicaINV === "N" ? 0 : values.cantidad,
      nombre: values.nombre?.toUpperCase() ?? "",
      unidadMedida: unidadPrincipal || "UNIDAD",
      aplicaOtraUnidad: appliesOtherUnit,
      unidadAlterna: appliesOtherUnit ? unidadAlterna : "",
      unidadesPorEmpaque: appliesOtherUnit ? unidadesPorEmpaque : null,
      preVentaUnidadAlterna: appliesOtherUnit ? preVentaUnidadAlterna : null,
    };
    const saved = await Promise.resolve(onSave(payload));
    if (saved === false) return;

    if (mode === "create") {
      await fetchProducts();
      const generatedCode = generateCode();
      const nextCode =
        generatedCode && generatedCode !== trimmedCode
          ? generatedCode
          : incrementCodeFromCurrent(trimmedCode);

      reset({
        ...defaults,
        codigo: nextCode,
      });
      focusCategoryField();
    } else {
      focusCategoryField();
    }
  };

  const handleNewClick = () => {
    resetForm();
    onNew?.();
  };

  return (
    <div
      ref={containerRef}
      className="h-auto from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-visible relative">
          {productsLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl shadow-lg">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-slate-700">
                  Procesando, por favor espera...
                </span>
              </div>
            </div>
          )}

          <HookForm methods={formMethods} onSubmit={onSubmit}>
            <div className="fixed inset-x-0 top-20 z-30 px-4 pt-[env(safe-area-inset-top)] sm:sticky sm:top-2 sm:px-0 sm:pt-0">
              <div className="mx-auto flex max-w-5xl items-center justify-between rounded-b-xl bg-[#B23636] px-4 py-3 text-white shadow-lg shadow-black/10 sm:max-w-none sm:rounded-t-2xl sm:rounded-b-none">
                <div className="flex items-center gap-3">
                  <BackArrowButton />
                  <h1 className="text-base font-semibold">
                    {mode === "create"
                      ? "Crear Nuevo Producto"
                      : "Editar Producto"}
                  </h1>
                </div>
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
                      onClick={handleNewClick}
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
            </div>

            <div className="px-6 pb-6 pt-24 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex flex-wrap gap-4">
                      {["S", "N"].map((v) => (
                        <label
                          key={v}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="radio"
                            value={v}
                            {...formMethods.register("aplicaINV", {
                              required: "El tipo de producto es obligatorio",
                            })}
                            checked={watch("aplicaINV") === v}
                            onChange={() => setValue("aplicaINV", v)}
                            className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                            {v === "S" ? "Bien" : "Servicio"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div
                    ref={categoryFieldRef}
                    className="flex min-w-0 items-end gap-2"
                  >
                    <HookFormAutocomplete<ProductFormValues>
                      name="idSubLinea"
                      label="Categoria"
                      options={[
                        { value: "", label: "Seleccionar..." },
                        ...categories.map((cat) => ({
                          value:
                            cat.idSubLinea !== undefined &&
                            cat.idSubLinea !== null
                              ? Number(cat.idSubLinea)
                              : cat.id !== undefined && cat.id !== null
                                ? Number(cat.id)
                                : "",
                          label: cat.nombreSublinea,
                        })),
                      ]}
                      rules={{
                        setValueAs: (v) =>
                          v === "" ? null : Number((v as any)?.value ?? v),
                        required: "La categoria es obligatoria",
                        validate: (v) =>
                          v !== 0 && v !== null && v !== undefined
                            ? true
                            : "La categoria es obligatoria",
                      }}
                      onOptionSelected={(opt) =>
                        setValue("categoria", opt?.label ?? "")
                      }
                      onOpenModal={(selectedOption) => {
                        const selectedId = Number(selectedOption?.value ?? 0);
                        if (!Number.isFinite(selectedId) || selectedId <= 0)
                          return;

                        const selectedCategory = categories.find(
                          (c) =>
                            String(c.idSubLinea ?? c.id) === String(selectedId),
                        );
                        if (!selectedCategory) return;

                        openDialog({
                          title: "Editar categoria",
                          content: (
                            <CategoriaForm
                              variant="modal"
                              mode="edit"
                              onSave={() => {}}
                              initialData={selectedCategory}
                            />
                          ),
                          onConfirm: async (data) => {
                            if (!data || typeof data !== "object") return;
                            const payload = data as Category;
                            const updated = await updateCategory(
                              selectedId,
                              payload,
                            );
                            if (!updated) return;
                            await fetchCategories();

                            const refreshedCategories =
                              useMaintenanceStore.getState().categories ?? [];
                            const updatedCategory = refreshedCategories.find(
                              (c) =>
                                String(c.idSubLinea ?? c.id) ===
                                String(selectedId),
                            );
                            if (!updatedCategory) return;

                            const updatedId = Number(
                              updatedCategory.idSubLinea ??
                                updatedCategory.id ??
                                selectedId,
                            );

                            setValue("idSubLinea", updatedId, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setValue(
                              "categoria",
                              updatedCategory.nombreSublinea ??
                                payload.nombreSublinea ??
                                "",
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              },
                            );
                          },
                          maxWidth: "md",
                          fullWidth: true,
                        });
                      }}
                      className="min-w-0 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        openDialog({
                          title: "Registrar categoria",
                          content: (
                            <CategoriaForm
                              variant="modal"
                              mode="create"
                              onSave={() => {}}
                              initialData={{}}
                            />
                          ),
                          onConfirm: async (data) => {
                            if (!data || typeof data !== "object") return;
                            const payload = data as Category;
                            const created = await addCategory(payload);
                            if (!created) return;
                            await fetchCategories();

                            const normalizedName = (
                              payload.nombreSublinea ?? ""
                            )
                              .trim()
                              .toUpperCase();
                            const refreshedCategories =
                              useMaintenanceStore.getState().categories ?? [];

                            const createdCategory = refreshedCategories.find(
                              (c) =>
                                (c.nombreSublinea ?? "")
                                  .trim()
                                  .toUpperCase() === normalizedName,
                            );

                            const createdId = Number(
                              createdCategory?.idSubLinea ??
                                createdCategory?.id ??
                                0,
                            );

                            if (createdId > 0) {
                              setValue("idSubLinea", createdId, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              setValue(
                                "categoria",
                                createdCategory?.nombreSublinea ??
                                  payload.nombreSublinea ??
                                  "",
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                },
                              );
                            }

                            focusProductNameField();
                          },
                          maxWidth: "md",
                          fullWidth: true,
                        })
                      }
                      className="mt-3 h-10 w-9 shrink-0 inline-flex items-center justify-center rounded-md border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                      title="Registrar categoria"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mt-3">
                    <HookFormInput<ProductFormValues>
                      name="codigo"
                      label="Codigo del Producto"
                      placeholder="AUTO-GENERADO"
                      onKeyDown={(e) => {
                        if (e.key === " ") e.preventDefault();
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData?.getData("text") ?? "";
                        const cleaned = pasted.replace(/\s+/g, "");
                        e.currentTarget.value = cleaned;
                        setValue("codigo", cleaned, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      rules={{
                        required: "El codigo es obligatorio",
                        validate: (v) =>
                          (v?.toString().trim?.() ?? "").length > 0 ||
                          "El codigo es obligatorio",
                      }}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <HookFormInput<ProductFormValues>
                      data-focus-first
                      name="nombre"
                      label="Nombre del Producto"
                      placeholder="Ingrese el nombre completo del producto"
                      rules={{ required: "El nombre es obligatorio" }}
                    />
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
                    <HookFormAutocomplete<ProductFormValues>
                      name="unidadMedida"
                      label="Unidad de Medida"
                      options={unidadMedidaOptions}
                      placeholder="Selecciona o escribe una unidad"
                      rules={{ required: "La unidad de medida es obligatoria" }}
                      allowCreate
                      showCreateOption={false}
                      syncInputToValue
                      className="w-full"
                    />

                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={aplicaOtraUnidad}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setValue("aplicaOtraUnidad", checked, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });

                              if (checked) {
                                openOtherUnitModal();
                                return;
                              }

                              clearOtherUnitConfiguration();
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          Aplica otra unidad
                        </label>
                        <button
                          type="button"
                          onClick={() => openOtherUnitModal()}
                          disabled={!aplicaOtraUnidad}
                          className="px-3 py-1.5 text-sm rounded-md border border-blue-200 bg-white text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Configurar unidad
                        </button>
                      </div>
                    </div>
                  </div>

                  <HookFormInput<ProductFormValues>
                    name="preVenta"
                    label="Precio de Venta"
                    type="number"
                    step="0.01"
                    min="0.01"
                    rules={{
                      valueAsNumber: true,
                      required: "El precio de venta es obligatorio",
                      validate: (v) =>
                        v !== undefined &&
                        v !== null &&
                        !Number.isNaN(v) &&
                        v > 0
                          ? true
                          : "El precio de venta debe ser mayor a 0",
                    }}
                  />
                  <HookFormInput<ProductFormValues>
                    name="preCosto"
                    label="Precio de Costo"
                    type="number"
                    step="0.01"
                    min="0.01"
                    rules={{
                      valueAsNumber: true,
                      required: "El precio de costo es obligatorio",
                      validate: (v) =>
                        v !== undefined &&
                        v !== null &&
                        !Number.isNaN(v) &&
                        v > 0
                          ? true
                          : "El precio de costo debe ser mayor a 0",
                    }}
                  />

                  <HookFormInput<ProductFormValues>
                    name="cantidad"
                    label="Cantidad en Stock"
                    type="number"
                    disabled={isServiceProduct}
                    rules={{
                      valueAsNumber: true,
                      validate: (v) => {
                        if (isServiceProduct) return true;
                        return (
                          (v !== undefined &&
                            v !== null &&
                            !Number.isNaN(v as number)) ||
                          "La cantidad es obligatoria"
                        );
                      },
                    }}
                  />
                  <HookFormSelect<ProductFormValues>
                    name="estado"
                    label="Estado del Producto"
                    disabled={mode === "create"}
                    options={[
                      { value: "ACTIVO", label: "Activo" },
                      { value: "INACTIVO", label: "Inactivo" },
                    ]}
                    rules={{ required: "El estado es obligatorio" }}
                  />
                  <HookFormInput<ProductFormValues>
                    name="usuario"
                    label="Usuario Responsable"
                    disabled
                  />
                </div>
                <div className="border-t-2 border-gray-100">
                  <div className="space-y-5">
                    <h3 className="text-lg font-semibold">Foto del producto</h3>

                    <div className="relative w-full h-64 border rounded-lg overflow-hidden shadow-md">
                      {takingPhoto ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full bg-black object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={takePhoto}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                Capturar
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="flex-1 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <img
                            src={displayImage}
                            onClick={openImageModal}
                            className={`w-full h-full object-cover ${
                              hasImage ? "cursor-zoom-in" : ""
                            }`}
                            alt="Foto producto"
                          />
                          {hasImage && (
                            <button
                              onClick={removeImage}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg"
                              title="Eliminar imagen"
                              type="button"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Upload className="w-5 h-5" />
                        Subir Foto
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>

                      {!takingPhoto ? (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          <Camera className="w-5 h-5" />
                          Tomar Foto
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </HookForm>
        </div>
      </div>
    </div>
  );
}

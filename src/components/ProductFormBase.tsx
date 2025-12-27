import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, Plus, Trash2, X, FileEdit, Camera, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Product } from "@/types/product";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useDialogStore } from "@/store/app/dialog.store";
import { useProductsStore } from "@/store/products/products.store";
import { useAuthStore } from "@/store/auth/auth.store";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { HookFormAutocomplete } from "./forms/HookFormAutocomplete";
import CategoriaForm from "./maintenance/CategoriaForm";
import type { Category } from "@/types/maintenance";

interface ProductFormBaseProps {
  initialData?: Partial<Product>;
  mode: "create" | "edit";
  onSave: (
    data: Omit<Product, "id"> & { images?: string[]; imageFile?: File | null }
  ) => void;
  onNew?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const unidadesMedida = ["Unidad", "Kg", "Litro", "Caja", "Docena"];

const buildUserDate = () => `user-${new Date().toISOString().slice(0, 10)}`;

type ProductFormValues = Omit<Product, "id"> & {
  images?: string[];
  preVentaB?: number | null;
  imageFile?: File | null;
  imageRemoved?: boolean;
};

export default function ProductFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onArchive,
  onDelete,
}: ProductFormBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [codeEditable, setCodeEditable] = useState(false);
  const authUser = useAuthStore((s) => s.user);
  const { categories, fetchCategories, addCategory, updateCategory } =
    useMaintenanceStore();
  const { products, fetchProducts } = useProductsStore();
  const fallbackUser = useMemo(
    () => authUser?.displayName ?? authUser?.username ?? buildUserDate(),
    [authUser]
  );
  const productsLoading = useProductsStore((s) => s.loading);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState<string | null>(null);

  const generateCode = () => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `PRD-${randomNumber}`;
  };

  const defaults = useMemo<ProductFormValues>(
    () => ({
      categoria: initialData?.categoria ?? "",
      idSubLinea:
        initialData?.idSubLinea !== undefined &&
        initialData?.idSubLinea !== null
          ? Number(initialData.idSubLinea)
          : null,
      codigo: initialData?.codigo ?? (mode === "create" ? generateCode() : ""),
      nombre: initialData?.nombre ?? "",
      unidadMedida: initialData?.unidadMedida ?? "Unidad",
      valorCritico: initialData?.valorCritico ?? null,
      preCosto: initialData?.preCosto ?? null,
      preVenta: initialData?.preVenta ?? null,
      preVentaB: (initialData as any)?.preVentaB ?? null,
      aplicaINV: initialData?.aplicaINV ?? "bien",
      cantidad: initialData?.cantidad ?? null,
      usuario: initialData?.usuario ?? fallbackUser,
      estado: initialData?.estado ?? "ACTIVO",
      images: initialData?.images ?? [],
      imageFile: null,
      imageRemoved: false,
    }),
    [initialData, mode, fallbackUser]
  );

  const formMethods = useForm<ProductFormValues>({
    defaultValues: defaults,
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { isSubmitting, errors },
  } = formMethods;
  const openDialog = useDialogStore((s) => s.openDialog);

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  useEffect(() => {
    focusFirstInput(containerRef.current);
  }, [mode, initialData]);

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

  const selectedSubLineaId = watch("idSubLinea");
  const unidadMedidaActual = watch("unidadMedida");
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
      (cat) => String(cat.id ?? cat.idSubLinea) === String(selectedSubLineaId)
    );
    setValue("categoria", selected?.nombreSublinea ?? "");
  }, [categories, selectedSubLineaId, setValue]);

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
    setModalImageSrc(currentImage);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setModalImageSrc(null);
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
    reset(defaults);
    setCodeEditable(false);
    focusFirstInput(containerRef.current);
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

    const payload = {
      ...values,
      codigo: trimmedCode,
      nombre: values.nombre?.toUpperCase() ?? "",
    };
    await Promise.resolve(onSave(payload));
    if (mode === "create") {
      reset({
        ...defaults,
        codigo: generateCode(),
      });
      setCodeEditable(false);
    } else {
      focusFirstInput(containerRef.current);
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
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative">
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
            <div className="bg-[#B23636]  text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <h1 className="text-base font-semibold">
                {mode === "create" ? "Crear Nuevo Producto" : "Editar Producto"}
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

            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700">
                        Categoria
                      </label>
                      <div className="flex gap-2">
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
                                await addCategory(data as Category);
                                await fetchCategories();
                              },
                              maxWidth: "md",
                              fullWidth: true,
                            })
                          }
                          className="text-blue-600 text-sm font-semibold hover:underline"
                        >
                          Registrar
                        </button>
                      </div>
                    </div>
                    <HookFormAutocomplete<ProductFormValues>
                      name="idSubLinea"
                      label=""
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
                        openDialog({
                          title: "Editar categoria",
                          content: (
                            <CategoriaForm
                              variant="modal"
                              mode="edit"
                              onSave={() => {}}
                              initialData={categories.find(
                                (c) => c.id === selectedOption.value
                              )}
                            />
                          ),
                          onConfirm: async (data) => {
                            const idToEdit = selectedSubLineaId;
                            if (!idToEdit || !data || typeof data !== "object")
                              return;
                            await updateCategory(
                              Number(idToEdit),
                              data as Category
                            );
                            await fetchCategories();
                          },
                          maxWidth: "md",
                          fullWidth: true,
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Codigo del Producto
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        {...formMethods.register("codigo", {
                          required: "El codigo es obligatorio",
                          validate: (v) =>
                            (v?.toString().trim?.() ?? "").length > 0 ||
                            "El codigo es obligatorio",
                        })}
                        disabled={!codeEditable}
                        placeholder="AUTO-GENERADO"
                        onKeyDown={(e) => {
                          if (e.key === " ") {
                            e.preventDefault();
                          }
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
                        className={`w-full pr-12 px-4 py-3 border-2 rounded-lg transition-all outline-none ${
                          codeEditable
                            ? "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            : "bg-gray-50 border-gray-200 cursor-not-allowed"
                        }`}
                      />
                      {errors.codigo && (
                        <p className="mt-1 text-sm text-red-600">
                          {String((errors as any).codigo?.message)}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setCodeEditable(!codeEditable)}
                        className={`absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                          codeEditable
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <FileEdit className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <HookFormInput<ProductFormValues>
                      data-focus-first
                      name="nombre"
                      label="Nombre del Producto"
                      placeholder="Ingrese el nombre completo del producto"
                      rules={{ required: "El nombre es obligatorio" }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>

                  <HookFormAutocomplete<ProductFormValues>
                    name="unidadMedida"
                    label="Unidad de Medida"
                    options={unidadMedidaOptions}
                    placeholder="Selecciona o escribe una unidad"
                    rules={{ required: "La unidad de medida es obligatoria" }}
                    allowCreate
                    createLabel={(v) => `Agregar "${v}"`}
                    onCreateOption={(v) => setValue("unidadMedida", v)}
                    className="w-full"
                  />

                  <HookFormInput<ProductFormValues>
                    name="valorCritico"
                    label="Stock Minimo (Valor Critico)"
                    type="number"
                    rules={{
                      valueAsNumber: true,
                      required: "El stock minimo es obligatorio",
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Tipo de Producto
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {["bien", "servicio"].map((v) => (
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
                            {v === "bien" ? "Bien" : "Servicio"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Precio de Costo
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...formMethods.register("preCosto", {
                          valueAsNumber: true,
                          required: "El precio de costo es obligatorio",
                          validate: (v) =>
                            v !== undefined &&
                            v !== null &&
                            !Number.isNaN(v) &&
                            v > 0
                              ? true
                              : "El precio de costo debe ser mayor a 0",
                        })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                      {errors.preCosto && (
                        <p className="text-sm text-red-600">
                          {String(
                            (errors as any).preCosto?.message ??
                              "El precio de costo es obligatorio"
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Precio de Venta
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...formMethods.register("preVenta", {
                          valueAsNumber: true,
                          required: "El precio de venta es obligatorio",
                          validate: (v) =>
                            v !== undefined &&
                            v !== null &&
                            !Number.isNaN(v) &&
                            v > 0
                              ? true
                              : "El precio de venta debe ser mayor a 0",
                        })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                      {errors.preVenta && (
                        <p className="text-sm text-red-600">
                          {String(
                            (errors as any).preVenta?.message ??
                              "El precio de venta es obligatorio"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Precio de Venta B
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...formMethods.register("preVentaB", {
                          valueAsNumber: true,
                          required: "El precio de venta es obligatorio",
                          validate: (v) =>
                            v !== undefined &&
                            v !== null &&
                            !Number.isNaN(v) &&
                            v > 0
                              ? true
                              : "El precio de venta debe ser mayor a 0",
                        })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                      {errors.preVentaB && (
                        <p className="text-sm text-red-600">
                          {String(
                            (errors as any).preVentaB?.message ??
                              "El precio de venta es obligatorio"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <HookFormInput<ProductFormValues>
                    name="cantidad"
                    label="Cantidad en Stock"
                    type="number"
                    rules={{
                      valueAsNumber: true,
                      required: "La cantidad es obligatoria",
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                  <HookFormInput<ProductFormValues>
                    name="usuario"
                    label="Usuario Responsable"
                    disabled
                    className="w-full px-4 py-3 border-2 bg-gray-50 border-gray-200 cursor-not-allowed"
                  />
                </div>
                <div className="border-t-2 border-gray-100">
                  <div className="space-y-5">
                    <h3 className="text-lg font-semibold">Foto del producto</h3>

                    <div className="relative w-full h-64 border rounded-lg overflow-hidden shadow-md">
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
                      ) : (
                        <div className="space-y-3">
                          <video
                            ref={videoRef}
                            autoPlay
                            className="w-full h-64 bg-black rounded-lg"
                          />
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </HookForm>
          {isImageModalOpen && modalImageSrc && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={closeImageModal}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="relative max-w-4xl w-full max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={closeImageModal}
                  className="absolute top-3 right-3 text-white hover:text-gray-200"
                  title="Cerrar"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="bg-black rounded-lg overflow-hidden">
                  <img
                    src={modalImageSrc}
                    alt="Foto producto ampliada"
                    className="w-full h-full max-h-[80vh] object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

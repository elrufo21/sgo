import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, Plus, Trash2, X, FileEdit } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Product } from "@/types/product";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useDialogStore } from "@/store/app/dialog.store";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { HookFormAutocomplete } from "./forms/HookFormAutocomplete";
import CategoriaForm from "./maintenance/CategoriaForm";
import type { Category } from "@/types/maintenance";

interface ProductFormBaseProps {
  initialData?: Partial<Product>;
  mode: "create" | "edit";
  onSave: (data: Omit<Product, "id"> & { images?: string[] }) => void;
  onNew?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const unidadesMedida = ["Unidad", "Kg", "Litro", "Caja", "Docena"];

type ProductFormValues = Omit<Product, "id"> & { images?: string[] };

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
  const { categories, fetchCategories, addCategory, updateCategory } =
    useMaintenanceStore();

  const generateCode = () => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `PRD-${randomNumber}`;
  };

  const defaults = useMemo<ProductFormValues>(
    () => ({
      categoria: initialData?.categoria ?? "",
      idSubLinea: initialData?.idSubLinea ?? null,
      codigo: initialData?.codigo ?? (mode === "create" ? generateCode() : ""),
      nombre: initialData?.nombre ?? "",
      unidadMedida: initialData?.unidadMedida ?? "",
      valorCritico: initialData?.valorCritico ?? null,
      preCosto: initialData?.preCosto ?? null,
      preVenta: initialData?.preVenta ?? null,
      aplicaINV: initialData?.aplicaINV ?? "bien",
      cantidad: initialData?.cantidad ?? null,
      usuario: initialData?.usuario ?? "",
      estado: initialData?.estado ?? "activo",
      images: initialData?.images ?? [],
    }),
    [initialData, mode]
  );

  const formMethods = useForm<ProductFormValues>({
    defaultValues: defaults,
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = formMethods;
  const openDialog = useDialogStore((s) => s.openDialog);

  // Inicializar formulario / sincronizar cambios externos
  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  useEffect(() => {
    focusFirstInput(containerRef.current);
  }, [mode, initialData]);

  // Cargar categorias desde mantenimiento
  useEffect(() => {
    if (!categories.length) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  // Sincroniza nombre de categoria cuando se selecciona idSubLinea
  const selectedSubLineaId = watch("idSubLinea");
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
    const files = Array.from(e.target.files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setValue("images", [...(watch("images") || []), ...urls]);
  };

  const removeImage = (index: number) => {
    const images = watch("images") || [];
    const updatedImages = images.filter((_, i) => i !== index);
    setValue("images", updatedImages);
  };

  const resetForm = () => {
    reset(defaults);
    setCodeEditable(false);
    focusFirstInput(containerRef.current);
  };

  const onSubmit = async (values: ProductFormValues) => {
    await Promise.resolve(onSave(values));
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
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {mode === "create" ? "Crear Nuevo Producto" : "Editar Producto"}
              </h2>
            </div>

            <HookForm methods={formMethods} onSubmit={onSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700">
                        Categoría
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openDialog({
                              title: "Registrar categoría",
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
                          value: cat.idSubLinea ?? cat.id ?? "",
                          label: cat.nombreSublinea,
                        })),
                      ]}
                      rules={{
                        setValueAs: (v) =>
                          v === "" ? null : Number((v as any)?.value ?? v),
                      }}
                      onOptionSelected={(opt) =>
                        setValue("categoria", opt?.label ?? "")
                      }
                      onOpenModal={(selectedOption) => {
                        console.log("selectedOption", selectedOption);
                        openDialog({
                          title: "Editar categoría",
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
                      Código del Producto
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        {...formMethods.register("codigo")}
                        disabled={!codeEditable}
                        placeholder="AUTO-GENERADO"
                        className={`w-full pr-12 px-4 py-3 border-2 rounded-lg transition-all outline-none ${
                          codeEditable
                            ? "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            : "bg-gray-50 border-gray-200 cursor-not-allowed"
                        }`}
                      />
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>

                  <HookFormSelect<ProductFormValues>
                    name="unidadMedida"
                    label="Unidad de Medida"
                    options={[
                      { value: "", label: "Seleccionar..." },
                      ...unidadesMedida.map((u) => ({ value: u, label: u })),
                    ]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />

                  <HookFormInput<ProductFormValues>
                    name="valorCritico"
                    label="Stock Mínimo (Valor Crítico)"
                    type="number"
                    rules={{ valueAsNumber: true }}
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
                            {...formMethods.register("aplicaINV")}
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
                        {...formMethods.register("preCosto", {
                          valueAsNumber: true,
                        })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
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
                        {...formMethods.register("preVenta", {
                          valueAsNumber: true,
                        })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <HookFormInput<ProductFormValues>
                    name="cantidad"
                    label="Cantidad en Stock"
                    type="number"
                    rules={{ valueAsNumber: true }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />

                  <HookFormInput<ProductFormValues>
                    name="usuario"
                    label="Usuario Responsable"
                    disabled
                    className="w-full px-4 py-3 border-2 bg-gray-50 border-gray-200 cursor-not-allowed"
                  />

                  <HookFormSelect<ProductFormValues>
                    name="estado"
                    label="Estado del Producto"
                    disabled={mode === "create"}
                    options={[
                      { value: "activo", label: "Activo" },
                      { value: "inactivo", label: "Inactivo" },
                      { value: "archivado", label: "Archivado" },
                    ]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="border-t-2 border-gray-100">
                <div className="space-y-4">
                  <div className="mb-4">
                    <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Agregar imágenes
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {watch("images")?.length > 0 && (
                    <div className="flex flex-wrap gap-4 justify-start sm:justify-center">
                      {watch("images")!.map((img, i) => (
                        <div
                          key={i}
                          className="relative group w-[300px] h-[300px]"
                        >
                          <div className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors shadow-sm hover:shadow-md">
                            <img
                              src={img}
                              alt={`Imagen ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar imagen"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-gray-100 w-full lg:col-span-3">
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
                  >
                    <Save className="w-5 h-5" />
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={handleNewClick}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo
                  </button>
                  {mode === "edit" && (
                    <>
                      {onDelete && (
                        <button
                          type="button"
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
            </HookForm>
          </div>
        </div>
      </div>
    </div>
  );
}

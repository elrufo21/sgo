import React, { useState, useEffect } from "react";
import { Save, Plus, Edit2, Archive, Trash2, X, FileEdit } from "lucide-react";
import type { Product } from "@/types/product";

interface ProductFormBaseProps {
  initialData?: Partial<Product>;
  mode: "create" | "edit";
  onSave: (data: Omit<Product, "id"> & { images?: string[] }) => void;
  onNew?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const categorias = ["Hardware", "Periféricos", "Accesorios", "Software"];
const unidadesMedida = ["Unidad", "Kg", "Litro", "Caja", "Docena"];

export default function ProductFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onArchive,
  onDelete,
}: ProductFormBaseProps) {
  const [codeEditable, setCodeEditable] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id"> & { images?: string[] }>(
    {
      categoria: "",
      codigo: "",
      nombre: "",
      unidadMedida: "",
      valorCritico: 0,
      preCosto: 0,
      preVenta: 0,
      aplicaINV: "bien",
      cantidad: 0,
      usuario: "",
      estado: "activo",
      images: [],
    }
  );

  // Generar código automático para modo crear
  const generateCode = () => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `PRD-${randomNumber}`;
  };

  // Inicializar formulario
  useEffect(() => {
    if (initialData) {
      setForm({
        categoria: initialData.categoria || "",
        codigo: initialData.codigo || "",
        nombre: initialData.nombre || "",
        unidadMedida: initialData.unidadMedida || "",
        valorCritico: initialData.valorCritico || 0,
        preCosto: initialData.preCosto || 0,
        preVenta: initialData.preVenta || 0,
        aplicaINV: initialData.aplicaINV || "bien",
        cantidad: initialData.cantidad || 0,
        usuario: initialData.usuario || "",
        estado: initialData.estado || "activo",
        images: initialData.images || [],
      });
    } else if (mode === "create" && !form.codigo) {
      setForm((prev) => ({ ...prev, codigo: generateCode() }));
    }
  }, [initialData, mode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setForm({ ...form, images: [...(form.images || []), ...urls] });
  };

  const removeImage = (index: number) => {
    const updatedImages = form.images?.filter((_, i) => i !== index) || [];
    setForm({ ...form, images: updatedImages });
  };

  const handleSaveClick = () => {
    onSave(form);
  };

  const handleNewClick = () => {
    setForm({
      categoria: "",
      codigo: generateCode(),
      nombre: "",
      unidadMedida: "",
      valorCritico: 0,
      preCosto: 0,
      preVenta: 0,
      aplicaINV: "bien",
      cantidad: 0,
      usuario: "",
      estado: "activo",
      images: [],
    });
    setCodeEditable(false);
    onNew?.();
  };

  return (
    <div className="h-auto  from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {mode === "create" ? "Crear Nuevo Producto" : "Editar Producto"}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Categoría
                  </label>
                  <select
                    name="categoria"
                    value={form.categoria}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Código del Producto
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="codigo"
                      value={form.codigo}
                      onChange={handleChange}
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
                      title={codeEditable ? "Bloquear" : "Editar"}
                    >
                      <FileEdit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ingrese el nombre completo del producto"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Unidad de Medida
                  </label>
                  <select
                    name="unidadMedida"
                    value={form.unidadMedida}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {unidadesMedida.map((unidad) => (
                      <option key={unidad} value={unidad}>
                        {unidad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Stock Mínimo (Valor Crítico)
                  </label>
                  <input
                    type="number"
                    name="valorCritico"
                    value={form.valorCritico}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Tipo de Producto
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="aplicaINV"
                        value="bien"
                        checked={form.aplicaINV === "bien"}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                        Bien
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="aplicaINV"
                        value="servicio"
                        checked={form.aplicaINV === "servicio"}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                        Servicio
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Precio de Costo
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      S/
                    </span>
                    <input
                      type="number"
                      name="preCosto"
                      value={form.preCosto}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Precio de Venta
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      S/
                    </span>
                    <input
                      type="number"
                      name="preVenta"
                      value={form.preVenta}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Cantidad en Stock
                  </label>
                  <input
                    type="number"
                    name="cantidad"
                    value={form.cantidad}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Usuario Responsable
                  </label>
                  <input
                    type="text"
                    name="usuario"
                    disabled
                    value={form.usuario}
                    onChange={handleChange}
                    placeholder="Nombre del usuario"
                    className="w-full px-4 py-3 border-2 bg-gray-50 border-gray-200 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Estado del Producto
                  </label>
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="archivado">Archivado</option>
                  </select>
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

                  {form.images && form.images.length > 0 && (
                    <div className="flex flex-wrap gap-4 justify-start sm:justify-center">
                      {form.images.map((img, index) => (
                        <div
                          key={index}
                          className="relative group w-[300px] h-[300px]"
                        >
                          <div className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors shadow-sm hover:shadow-md">
                            <img
                              src={img}
                              alt={`Imagen ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => removeImage(index)}
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
                    onClick={handleSaveClick}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Save className="w-5 h-5" />
                    Guardar
                  </button>
                  <button
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
      </div>
    </div>
  );
}

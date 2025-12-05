import React, { useState, useRef } from "react";
import { Save, Plus, Trash2, Camera, Upload, X } from "lucide-react";

interface Employee {
  company: string;
  area: string;
  code: string;
  password: string;
  nombres: string;
  apellidos: string;
  ruc: string;
  dni: string;
  direccion: string;
  fechaNacimiento: string;
  telefonoMovil: string;
  telefonoAsignado: string;
  correo: string;
  fechaIngreso: string;
  fechaBaja: string;
  estado: string;
  foto?: string;
}

interface Props {
  initialData?: Partial<Employee>;
  mode: "create" | "edit";
  onSave: (data: Employee) => void;
  onNew?: () => void;
  onDelete?: () => void;
}

const companies = ["Empresa A", "Empresa B", "Empresa C"];
const areas = ["Administración", "Ventas", "Soporte", "Almacén"];

export default function EmployeeFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: Props) {
  console.log("initialData", initialData);
  const [form, setForm] = useState<Employee>({
    company: initialData?.company || "",
    area: initialData?.area || "",
    code: initialData?.code || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    password: initialData?.password || "",
    nombres: initialData?.nombres || "",
    apellidos: initialData?.apellidos || "",
    ruc: initialData?.ruc || "",
    dni: initialData?.dni || "",
    direccion: initialData?.direccion || "",
    fechaNacimiento: initialData?.fechaNacimiento || "",
    telefonoMovil: initialData?.telefonoMovil || "",
    telefonoAsignado: initialData?.telefonoAsignado || "",
    correo: initialData?.correo || "",
    fechaIngreso: initialData?.fechaIngreso || "",
    fechaBaja: initialData?.fechaBaja || "",
    estado: initialData?.estado || "activo",
    foto: initialData?.foto || "",
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [takingPhoto, setTakingPhoto] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, foto: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setTakingPhoto(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/png");
      setForm((prev) => ({ ...prev, foto: imageData }));
    }

    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((t) => t.stop());
    setTakingPhoto(false);
  };

  const removePhoto = () => setForm((prev) => ({ ...prev, foto: "" }));

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {mode === "create" ? "Registrar Empleado" : "Editar Empleado"}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Compañía
              </label>
              <select
                name="company"
                value={form.company}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              >
                <option value="">Seleccionar...</option>
                {companies.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Área
              </label>
              <select
                name="area"
                value={form.area}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              >
                <option value="">Seleccionar...</option>
                {areas.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Código
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
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
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
            {/**<div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div> */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Nombres
              </label>
              <input
                name="nombres"
                value={form.nombres}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Apellidos
              </label>
              <input
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">RUC</label>
              <input
                name="ruc"
                value={form.ruc}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">DNI</label>
              <input
                name="dni"
                value={form.dni}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Dirección
              </label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Fecha nacimiento
              </label>
              <input
                type="date"
                name="fechaNacimiento"
                value={form.fechaNacimiento}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Teléfono móvil
              </label>
              <input
                name="telefonoMovil"
                value={form.telefonoMovil}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Teléfono asignado
              </label>
              <input
                name="telefonoAsignado"
                value={form.telefonoAsignado}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Correo
              </label>
              <input
                name="correo"
                value={form.correo}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Fecha ingreso
              </label>
              <input
                type="date"
                name="fechaIngreso"
                value={form.fechaIngreso}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Fecha baja
              </label>
              <input
                type="date"
                name="fechaBaja"
                value={form.fechaBaja}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Foto del empleado</h3>

            {form.foto ? (
              <div className="relative w-full h-64 border rounded-lg overflow-hidden shadow-md">
                <img
                  src={form.foto}
                  className="w-full h-full object-cover"
                  alt="Foto empleado"
                />
                <button
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full"
                >
                  <X />
                </button>
              </div>
            ) : (
              <div className="w-full h-64 border-2 border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                Sin foto
              </div>
            )}

            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Upload className="w-5 h-5" />
              Subir Foto
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadPhoto}
                className="hidden"
              />
            </label>

            {!takingPhoto ? (
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
                ></video>
                <button
                  onClick={takePhoto}
                  className="w-full py-3 bg-green-600 text-white rounded-lg"
                >
                  Capturar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => onSave(form)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            <Save />
            Guardar
          </button>

          <button
            onClick={onNew}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg"
          >
            <Plus />
            Nuevo
          </button>

          {mode === "edit" && onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-lg"
            >
              <Trash2 />
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

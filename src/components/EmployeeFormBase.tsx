import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Camera, Plus, Save, Trash2, Upload, X } from "lucide-react";

import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Personal } from "@/types/employees";
import { apiRequest } from "@/shared/helpers/apiRequest";

interface Props {
  initialData?: Partial<Personal>;
  mode: "create" | "edit";
  onSave: (data: Personal) => void;
  onNew?: () => void;
  onDelete?: () => void;
}

const formatDateForInput = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
};

const normalizeDateForApi = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00`;
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const today = () => new Date().toISOString().slice(0, 10);

const buildDefaults = (initialData?: Partial<Personal>): Personal => ({
  personalId: initialData?.personalId ?? 0,
  personalNombres: initialData?.personalNombres ?? "",
  personalApellidos: initialData?.personalApellidos ?? "",
  areaId: initialData?.areaId ?? 0,
  personalCodigo: initialData?.personalCodigo ?? "",
  personalNacimiento:
    initialData?.personalNacimiento !== undefined
      ? formatDateForInput(initialData?.personalNacimiento)
      : today(),
  personalIngreso: initialData?.personalIngreso ?? "",
  personalDni: initialData?.personalDni ?? "",
  personalDireccion: initialData?.personalDireccion ?? "",
  personalTelefono: initialData?.personalTelefono ?? "",
  personalEmail: initialData?.personalEmail ?? "",
  personalEstado: initialData?.personalEstado ?? "activo",
  personalImagen: initialData?.personalImagen ?? "",
  companiaId: initialData?.companiaId ?? 1,
});

export default function EmployeeFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: Props) {
  const { areas, fetchAreas } = useMaintenanceStore();
  const [companias, setCompanias] = useState<{ id: string; nombre: string }[]>(
    []
  );

  const formMethods = useForm<Personal>({
    defaultValues: buildDefaults(initialData),
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = formMethods;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [takingPhoto, setTakingPhoto] = useState(false);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  useEffect(() => {
    const loadCompanias = async () => {
      const cached = localStorage.getItem("companiaMap");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.options)) {
            setCompanias(parsed.options);
          }
        } catch (err) {
          console.error("Error parsing companiaMap", err);
        }
      }
      const response = await apiRequest<{ id: string; nombre: string }[]>({
        url: "http://localhost:5000/api/v1/Compania/combo",
        method: "GET",
        fallback: [],
      });
      const options =
        response?.map((item) => ({
          id: String(item.id),
          nombre: item.nombre,
        })) ?? [];
      setCompanias(options);
      localStorage.setItem(
        "companiaMap",
        JSON.stringify({
          options,
          map: Object.fromEntries(options.map((c) => [c.id, c.nombre])),
        })
      );
      if (!formMethods.getValues("companiaId") && options.length > 0) {
        formMethods.setValue("companiaId", Number(options[0].id));
      }
    };
    loadCompanias();
  }, [formMethods]);

  useEffect(() => {
    reset(buildDefaults(initialData));
  }, [initialData, reset]);

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setValue("personalImagen", reader.result as string, {
        shouldDirty: true,
      });
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
      setValue("personalImagen", imageData, { shouldDirty: true });
    }

    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((t) => t.stop());
    setTakingPhoto(false);
  };

  const removePhoto = () =>
    setValue("personalImagen", "", { shouldDirty: true });

  const calcularEdad = (fecha: string | null | undefined) => {
    if (!fecha) return "";
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    if (Number.isNaN(nacimiento.getTime())) return "";

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} anos`;
  };

  const watchedNacimiento = watch("personalNacimiento");
  const watchedImagen = watch("personalImagen");

  const companyOptions =
    companias.length > 0
      ? companias.map((c) => ({ value: Number(c.id), label: c.nombre }))
      : [{ value: 1, label: "Compania 1" }];

  const handleNew = () => {
    const defaults = buildDefaults({
      personalEstado: "activo",
      companiaId: companyOptions[0]?.value ?? 1,
    });
    reset(defaults);
    onNew?.();
  };

  const onSubmit = (values: Personal) => {
    onSave({
      ...values,
      personalNacimiento: normalizeDateForApi(values.personalNacimiento),
      personalIngreso: values.personalIngreso?.trim() || null,
    });
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {mode === "create" ? "Registrar Personal" : "Editar Personal"}
        </h2>

        <HookForm methods={formMethods} onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <HookFormSelect<Personal>
                  name="companiaId"
                  label="Compania"
                  options={companyOptions}
                  rules={{ setValueAs: (val) => Number(val) || 1 }}
                />
              </div>

              <HookFormInput<Personal>
                name="personalCodigo"
                label="Codigo Personal"
                placeholder="Codigo"
                rules={{ required: "El codigo de personal es obligatorio" }}
              />

              <HookFormSelect<Personal>
                name="areaId"
                label="Area"
                options={[
                  { value: 0, label: "Seleccione area" },
                  ...areas.map((a) => ({ value: a.id, label: a.area })),
                ]}
                rules={{ setValueAs: (val) => Number(val) || null }}
              />

              <HookFormInput<Personal>
                name="personalNombres"
                label="Nombres"
                rules={{ required: "El nombre es obligatorio" }}
              />

              <HookFormInput<Personal>
                name="personalApellidos"
                label="Apellidos"
                rules={{ required: "El apellido es obligatorio" }}
              />

              <HookFormInput<Personal> name="personalDni" label="DNI" />

              <HookFormInput<Personal>
                name="personalDireccion"
                label="Direccion"
              />

              <HookFormInput<Personal>
                name="personalNacimiento"
                label="Fecha nacimiento"
                type="date"
              />
              <input
                name="edad"
                value={calcularEdad(watchedNacimiento)}
                readOnly
                className="w-full px-4 py-3 rounded-lg outline-none"
              />

              <HookFormInput<Personal>
                name="personalTelefono"
                label="Telefono"
              />

              <HookFormInput<Personal>
                name="personalEmail"
                label="Correo"
                type="email"
              />

              <HookFormInput<Personal>
                name="personalIngreso"
                label="Fecha ingreso"
                type="date"
              />

              <HookFormSelect<Personal>
                name="personalEstado"
                label="Estado"
                disabled={mode === "create"}
                options={[
                  { value: "activo", label: "Activo" },
                  { value: "inactivo", label: "Inactivo" },
                ]}
              />
            </div>

            <div className="space-y-5">
              <h3 className="text-lg font-semibold">Foto del empleado</h3>

              <div className="relative w-full h-64 border rounded-lg overflow-hidden shadow-md">
                <img
                  src={
                    watchedImagen && watchedImagen.trim() !== ""
                      ? watchedImagen
                      : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20' font-family='Arial, sans-serif'>No image</text></svg>"
                  }
                  className="w-full h-full object-cover"
                  alt="Foto empleado"
                />
                {watchedImagen && watchedImagen.trim() !== "" && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full"
                  >
                    <X />
                  </button>
                )}
              </div>

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
                  type="button"
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
                    type="button"
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

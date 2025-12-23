import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Camera, Plus, Save, Trash2, Upload, X } from "lucide-react";

import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Personal } from "@/types/employees";
import { apiRequest } from "@/shared/helpers/apiRequest";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";

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
  personalNacimiento: initialData?.personalNacimiento?.toString().trim()
    ? formatDateForInput(initialData.personalNacimiento)
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
  const formContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    focusFirstInput(formContainerRef.current);
  }, [mode, initialData]);

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
    focusFirstInput(formContainerRef.current);
  };

  const onSubmit = (values: Personal) => {
    onSave({
      ...values,
      personalNombres: values.personalNombres?.toUpperCase() ?? "",
      personalApellidos: values.personalApellidos?.toUpperCase() ?? "",
      personalNacimiento: normalizeDateForApi(values.personalNacimiento),
      personalIngreso: values.personalIngreso?.trim() || null,
    });
    focusFirstInput(formContainerRef.current);
  };

  return (
    <div ref={formContainerRef} className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <HookForm methods={formMethods} onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-[#B23636]  text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
            <h1 className="text-base font-semibold">
              {mode === "create" ? "Registrar Personal" : "Editar Personal"}
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

          <div className="p-6 sm:p-8">
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
                  data-focus-first="true"
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
                  rules={{
                    setValueAs: (val) => Number(val) || 0,
                    validate: (val) =>
                      Number(val) > 0 || "El area es obligatorio",
                  }}
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

                <HookFormInput<Personal>
                  name="personalDni"
                  label="DNI"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  onInput={(e) => {
                    const onlyDigits = e.currentTarget.value
                      .replace(/\D/g, "")
                      .slice(0, 8);
                    e.currentTarget.value = onlyDigits;
                  }}
                  rules={{
                    validate: (value) =>
                      !value?.toString().trim() ||
                      /^\d{8}$/.test(value.toString().trim()) ||
                      "El DNI debe tener 8 digitos",
                  }}
                />

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
                  rules={{
                    validate: (value) => {
                      if (!value?.trim()) return true;
                      return (
                        /^\S+@\S+\.\S+$/.test(value.trim()) ||
                        "Ingrese un correo valido"
                      );
                    },
                  }}
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
          </div>
        </HookForm>
      </div>
    </div>
  );
}

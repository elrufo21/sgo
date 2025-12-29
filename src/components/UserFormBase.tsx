import React, { useEffect, useMemo, useRef, useState } from "react";
import { Save, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "sonner";
import { useUsersStore } from "@/store/users/users.store";
import { useEmployeesStore } from "@/store/employees/employees.store";
import DataTable from "./DataTable";
import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { HookFormSelect } from "@/components/forms/HookFormSelect";
import { HookFormAutocomplete } from "@/components/forms/HookFormAutocomplete";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { useDialogStore } from "@/store/app/dialog.store";

interface UserFormBaseProps {
  initialData?: Partial<any>;
  mode: "create" | "edit";
  onSave: (data: any) => Promise<boolean> | boolean;
  onNew?: () => void;
  onDelete?: () => void;
  onSelectUser?: (user: any) => void;
}

type UserFormValues = {
  PersonalId: string | number;
  UsuarioAlias: string;
  UsuarioClave: string;
  ConfirmClave: string;
  UsuarioEstado: string;
  UsuarioSerie: string;
  EnviaBoleta: number;
  EnviarFactura: number;
  EnviaNC: number;
  EnviaND: number;
  Administrador: number;
};

export default function UserFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
  onSelectUser,
}: UserFormBaseProps) {
  const [formKey, setFormKey] = useState(0);
  const { users, fetchUsers } = useUsersStore();
  const { employees, fetchEmployees } = useEmployeesStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const openDialog = useDialogStore((s) => s.openDialog);

  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);

  const emptyValues = useMemo<UserFormValues>(
    () => ({
      PersonalId: "",
      UsuarioAlias: "",
      UsuarioClave: "",
      ConfirmClave: "",
      UsuarioEstado: "ACTIVO",
      UsuarioSerie: "B001",
      EnviaBoleta: 0,
      EnviarFactura: 0,
      EnviaNC: 0,
      EnviaND: 0,
      Administrador: 0,
    }),
    []
  );

  const defaults = useMemo<UserFormValues>(
    () =>
      mode === "create"
        ? emptyValues
        : {
            PersonalId: initialData?.PersonalId ?? "",
            UsuarioAlias: initialData?.UsuarioAlias ?? "",
            UsuarioClave: initialData?.UsuarioClave ?? "",
            ConfirmClave: initialData?.UsuarioClave ?? "",
            UsuarioEstado: initialData?.UsuarioEstado ?? "ACTIVO",
            UsuarioSerie: initialData?.UsuarioSerie ?? "B001",
            EnviaBoleta: initialData?.EnviaBoleta ?? 0,
            EnviarFactura: initialData?.EnviarFactura ?? 0,
            EnviaNC: initialData?.EnviaNC ?? 0,
            EnviaND: initialData?.EnviaND ?? 0,
            Administrador: initialData?.Administrador ?? 0,
          },
    [initialData, mode, emptyValues]
  );

  const formMethods = useForm<UserFormValues>({
    defaultValues: defaults,
  });

  const { handleSubmit, reset, watch, setFocus } = formMethods;

  const passwordsMatch =
    (watch("UsuarioClave") ?? "") === (watch("ConfirmClave") ?? "");

  const [usersEstado, setUsersEstado] = useState<"ACTIVO" | "INACTIVO">(
    "ACTIVO"
  );

  useEffect(() => {
    fetchUsers(usersEstado);
  }, [fetchUsers, usersEstado]);

  useEffect(() => {
    if (!employees.length) {
      fetchEmployees();
    }
  }, [employees.length, fetchEmployees]);

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  useEffect(() => {
    focusFirstInput(containerRef.current);
  }, [mode, initialData]);

  const onSubmit = async (values: UserFormValues) => {
    if ((values.UsuarioClave ?? "") !== (values.ConfirmClave ?? "")) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    const payload = { ...values };
    delete (payload as any).ConfirmClave;

    const ok = await onSave(payload);
    if (!ok) return;

    reset(emptyValues);
    onNew?.();
    setFormKey((k) => k + 1);
    focusFirstInput(containerRef.current);
  };

  const handleNew = () => {
    reset(emptyValues);
    onNew?.();
    setFormKey((k) => k + 1);
    focusFirstInput(containerRef.current);
  };

  const columnHelper = createColumnHelper<any>();
  console.log("users", users);
  const columns = [
    columnHelper.accessor("UsuarioAlias", {
      header: "Usuario",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("area", {
      header: "Area",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("UsuarioEstado", {
      header: "Estado",
      cell: (info) => info.getValue(),
    }),
  ];

  return (
    <div ref={containerRef} className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <HookForm
            key={formKey}
            methods={formMethods}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="bg-[#B23636]  text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <h1 className="text-base font-semibold">
                {mode === "create" ? "Crear Usuario" : "Editar Usuario"}
              </h1>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                  title="Guardar"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Guardar</span>
                </button>

                <button
                  type="button"
                  onClick={handleNew}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                  title="Nuevo"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nuevo</span>
                </button>

                {mode === "edit" && onDelete && (
                  <button
                    type="button"
                    onClick={() =>
                      openDialog({
                        title: "Confirmar eliminación",
                        content: "¿Seguro que desea eliminar este usuario?",
                        confirmText: "Eliminar",
                        cancelText: "Cancelar",
                        onConfirm: async () => {
                          await onDelete();
                        },
                        maxWidth: "xs",
                      })
                    }
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
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-[40%] space-y-4">
                  <HookFormAutocomplete
                    name="PersonalId"
                    label="Personal"
                    placeholder="Buscar personal"
                    options={employees.map((p) => ({
                      label:
                        `${p.personalNombres ?? ""} ${
                          p.personalApellidos ?? ""
                        }`.trim() ||
                        p.personalCodigo ||
                        `Personal ${p.personalId}`,
                      value: p.personalId,
                      data: p,
                    }))}
                    onOptionSelected={(option) => {
                      if (option) {
                        setFocus("UsuarioAlias");
                      }
                    }}
                    rules={{ required: "Seleccione personal" }}
                    data-focus-first
                  />

                  <HookFormInput
                    name="UsuarioAlias"
                    label="Usuario / Alias"
                    placeholder="ej: jramirez"
                    onKeyDown={(e) => {
                      if (e.key === " ") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s+/g, "");
                      e.target.value = value;
                    }}
                    rules={{ required: "El alias es obligatorio" }}
                  />

                  <div className="relative space-y-2">
                    <HookFormInput
                      name="UsuarioClave"
                      label="Contraseña"
                      type={showPass ? "text" : "password"}
                      placeholder="Ingrese contrasena"
                      rules={{ required: "La contrasena es obligatoria" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-9 text-gray-500"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff /> : <Eye />}
                    </button>
                  </div>

                  <div className="relative space-y-2">
                    <HookFormInput
                      name="ConfirmClave"
                      label="Confirmar contrasena"
                      type={showPassConfirm ? "text" : "password"}
                      placeholder="Repita la contrasena"
                      rules={{
                        validate: (value) =>
                          value === watch("UsuarioClave") ||
                          "Las contrasenas no coinciden",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassConfirm((v) => !v)}
                      className="absolute right-3 top-9 text-gray-500"
                      tabIndex={-1}
                    >
                      {showPassConfirm ? <EyeOff /> : <Eye />}
                    </button>
                  </div>

                  <HookFormSelect
                    name="UsuarioEstado"
                    label="Estado"
                    options={[
                      { value: "ACTIVO", label: "Activo" },
                      { value: "INACTIVO", label: "Inactivo" },
                    ]}
                    disabled={mode === "create"}
                  />
                </div>

                <div className="w-full md:w-[60%] mt-6 md:mt-0">
                  <DataTable
                    columns={columns}
                    data={users}
                    renderFilters={
                      <div className="flex items-center gap-2">
                        <select
                          value={usersEstado}
                          onChange={(e) =>
                            setUsersEstado(
                              e.target.value as "ACTIVO" | "INACTIVO"
                            )
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="ACTIVO">Activos</option>
                          <option value="INACTIVO">Inactivos</option>
                        </select>
                      </div>
                    }
                    onRowClick={(row) => {
                      console.log("row", row, employees);
                      reset({
                        PersonalId: row.PersonalId ?? "",
                        UsuarioAlias: row.UsuarioAlias ?? "",
                        UsuarioClave: row.UsuarioClave ?? "",
                        ConfirmClave: row.UsuarioClave ?? "",
                        UsuarioEstado: row.UsuarioEstado ?? "ACTIVO",
                        UsuarioSerie: row.UsuarioSerie ?? "B001",
                        EnviaBoleta: row.EnviaBoleta ?? 0,
                        EnviarFactura: row.EnviarFactura ?? 0,
                        EnviaNC: row.EnviaNC ?? 0,
                        EnviaND: row.EnviaND ?? 0,
                        Administrador: row.Administrador ?? 0,
                      });
                      onSelectUser?.(row);
                    }}
                  />
                </div>
              </div>
            </div>
          </HookForm>
        </div>
      </div>
    </div>
  );
}

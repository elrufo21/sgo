import React, { useState, useEffect, useRef } from "react";
import { Save, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useUsersStore } from "@/store/users/users.store";
import DataTable from "./DataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "sonner";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";

interface UserFormBaseProps {
  initialData?: Partial<any>;
  mode: "create" | "edit";
  onSave: (data: any) => void;
  onNew?: () => void;
  onDelete?: () => void;
}

export default function UserFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: UserFormBaseProps) {
  const { users, fetchUsers } = useUsersStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);

  const [form, setForm] = useState({
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
  });

  useEffect(() => {
    if (users.length === 0) fetchUsers();
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        ConfirmClave: initialData.UsuarioClave ?? "",
      }));
    }
  }, [initialData]);

  useEffect(() => {
    focusFirstInput(containerRef.current);
  }, [mode, initialData]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSave = () => {
    if (form.UsuarioClave !== form.ConfirmClave) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    const payload = { ...form };
    delete payload.ConfirmClave;

    onSave(payload);
    focusFirstInput(containerRef.current);
  };

  const handleNew = () => {
    setForm({
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
    });

    onNew?.();
    focusFirstInput(containerRef.current);
  };

  const passwordsMatch = form.UsuarioClave === form.ConfirmClave;

  const columnHelper = createColumnHelper<any>();
  const columns = [
    columnHelper.accessor("UsuarioAlias", {
      header: "Usuario",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("UsuarioEstado", {
      header: "Estado",
      cell: (info) => info.getValue(),
    }),
  ];

  return (
    <div ref={containerRef} className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-700 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
            <h1 className="text-base font-semibold">
              {mode === "create" ? "Crear Usuario" : "Editar Usuario"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
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
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-[40%] space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Personal ID
                  </label>
                  <input
                    data-focus-first="true"
                    type="number"
                    name="PersonalId"
                    value={form.PersonalId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Usuario / Alias
                  </label>
                  <input
                    type="text"
                    name="UsuarioAlias"
                    value={form.UsuarioAlias}
                    onChange={handleChange}
                    placeholder="ej: jramirez"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2 relative">
                  <label className="block text-sm font-semibold text-gray-700">
                    Contrasena
                  </label>

                  <input
                    type={showPass ? "text" : "password"}
                    name="UsuarioClave"
                    value={form.UsuarioClave}
                    onChange={handleChange}
                    placeholder="Ingrese contrasena"
                    className={`w-full px-4 py-3 border-2 rounded-lg pr-10
                      ${!passwordsMatch ? "border-red-500" : "border-gray-200"}
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                  />

                  <span
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-10 text-gray-500 cursor-pointer"
                  >
                    {showPass ? <EyeOff /> : <Eye />}
                  </span>
                </div>

                <div className="space-y-2 relative">
                  <label className="block text-sm font-semibold text-gray-700">
                    Confirmar contrasena
                  </label>

                  <input
                    type={showPassConfirm ? "text" : "password"}
                    name="ConfirmClave"
                    value={form.ConfirmClave}
                    onChange={handleChange}
                    placeholder="Repita la contrasena"
                    className={`w-full px-4 py-3 border-2 rounded-lg pr-10
                      ${!passwordsMatch ? "border-red-500" : "border-gray-200"}
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                  />

                  <span
                    onClick={() => setShowPassConfirm(!showPassConfirm)}
                    className="absolute right-3 top-10 text-gray-500 cursor-pointer"
                  >
                    {showPassConfirm ? <EyeOff /> : <Eye />}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Estado
                  </label>
                  <select
                    name="UsuarioEstado"
                    value={form.UsuarioEstado}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    disabled={mode === "create"}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="w-full md:w-[60%] mt-6 md:mt-0">
                <DataTable
                  columns={columns}
                  data={users}
                  onRowClick={(row) => setForm({ ...form, ...row })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

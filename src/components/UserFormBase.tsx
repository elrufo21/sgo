import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useUsersStore } from "@/store/users/users.store";
import DataTable from "./DataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "sonner";

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

  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);

  // FORM REAL — Basado en tu estructura SQL
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

  // Cargar usuarios solo una vez
  useEffect(() => {
    if (users.length === 0) fetchUsers();
  }, []);

  // Cargar datos de edición
  useEffect(() => {
    if (initialData) {
      setForm({
        ...form,
        ...initialData,
        ConfirmClave: initialData.UsuarioClave ?? "",
      });
    }
  }, [initialData]);

  // Handler genérico
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSave = () => {
    if (form.UsuarioClave !== form.ConfirmClave) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    const payload = { ...form };
    delete payload.ConfirmClave;

    onSave(payload);
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
  };

  const passwordsMatch = form.UsuarioClave === form.ConfirmClave;

  // TABLA — Puedes retirarla luego
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
  console.log("users", users);
  return (
    <div className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {mode === "create" ? "Crear Usuario" : "Editar Usuario"}
            </h2>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-[40%] space-y-4">
                {/* PERSONAL */} {/* PERSONAL ID */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Personal ID
                  </label>
                  <input
                    type="number"
                    name="PersonalId"
                    value={form.PersonalId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>
                {/* ALIAS */}
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
                {/* CONTRASEÑA */}
                <div className="space-y-2 relative">
                  <label className="block text-sm font-semibold text-gray-700">
                    Contraseña
                  </label>

                  <input
                    type={showPass ? "text" : "password"}
                    name="UsuarioClave"
                    value={form.UsuarioClave}
                    onChange={handleChange}
                    placeholder="Ingrese contraseña"
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
                {/* CONFIRMAR CONTRASEÑA */}
                <div className="space-y-2 relative">
                  <label className="block text-sm font-semibold text-gray-700">
                    Confirmar contraseña
                  </label>

                  <input
                    type={showPassConfirm ? "text" : "password"}
                    name="ConfirmClave"
                    value={form.ConfirmClave}
                    onChange={handleChange}
                    placeholder="Repita la contraseña"
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
                {/* ESTADO */}
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
                {/* PERMISOS 
                <div className="space-y-1 pt-1">
                  {[
                    ["EnviaBoleta", "Puede enviar boletas"],
                    ["EnviarFactura", "Puede enviar facturas"],
                    ["EnviaNC", "Puede enviar notas de crédito"],
                    ["EnviaND", "Puede enviar notas de débito"],
                    ["Administrador", "Administrador"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <input
                        type="checkbox"
                        name={key}
                        checked={form[key] === 1}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      {label}
                    </label>
                  ))}
                </div>*/}
              </div>

              {/* TABLA (opcional) */}
              <div className="w-full md:w-[60%] mt-6 md:mt-0">
                <DataTable
                  columns={columns}
                  data={users}
                  onRowClick={(row) => setForm({ ...form, ...row })}
                />
              </div>
            </div>

            {/* BOTONES */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-5 h-5" /> Guardar
              </button>

              {mode === "edit" ? (
                onDelete && (
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" /> Eliminar
                  </button>
                )
              ) : (
                <button
                  onClick={handleNew}
                  className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg"
                >
                  <Plus className="w-5 h-5" /> Nuevo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

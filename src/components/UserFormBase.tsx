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

  const [form, setForm] = useState({
    staff: "",
    area: "",
    username: "",
    password: "",
    confirmPassword: "",
    status: "activo",
  });

  // CARGAR USERS SI NO ESTÁN CARGADOS
  useEffect(() => {
    if (users.length === 0) fetchUsers();
  }, [users, fetchUsers]);

  // CARGAR DATOS DE EDICIÓN
  useEffect(() => {
    if (initialData) {
      setForm({
        ...form,
        ...initialData,
        confirmPassword: initialData.password ?? "",
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSave = () => {
    if (form.password !== form.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const { confirmPassword, ...data } = form;
    onSave(data);
  };

  const handleNew = () => {
    setForm({
      staff: "",
      area: "",
      username: "",
      password: "",
      confirmPassword: "",
      status: "activo",
    });
    onNew?.();
  };

  // TABLA DE USERS
  const columnHelper = createColumnHelper<any>();
  const columns = [
    columnHelper.accessor("staff", {
      header: "Personal",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("area", {
      header: "Área",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("username", {
      header: "Usuario",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("status", {
      header: "Estado",
      cell: (info) => info.getValue(),
    }),
  ];
  const passwordsMatch = form.password === form.confirmPassword;

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
                {/* PERSONAL */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Personal
                  </label>
                  <select
                    name="staff"
                    value={form.staff}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  >
                    <option value="">Seleccione personal</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.staff}>
                        {u.staff}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ÁREA */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Área
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    placeholder="Ingrese área"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>

                {/* USUARIO */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Usuario
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Nombre de usuario"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2 relative">
                  <label className="block text-sm font-semibold text-gray-700">
                    Contraseña
                  </label>

                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={form.password}
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

                <div className="space-y-2 relative">
                  <label className="block text-sm font-semibold text-gray-700">
                    Confirmar contraseña
                  </label>

                  <input
                    type={showPassConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
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

                  {/* MENSAJE SUTIL */}
                  {!passwordsMatch && (
                    <p className="text-sm text-red-500 mt-1">
                      Las contraseñas no coinciden
                    </p>
                  )}
                </div>

                {/* ESTADO */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Estado
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
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

            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => {
                  if (!passwordsMatch) {
                    toast.error("Las contraseñas no coinciden");
                    return;
                  }

                  handleSave();
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-5 h-5" /> Guardar
              </button>

              {mode === "edit" && (
                <>
                  <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg"
                  >
                    <Plus className="w-5 h-5" /> Nuevo
                  </button>

                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" /> Eliminar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

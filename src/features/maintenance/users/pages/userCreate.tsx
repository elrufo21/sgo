import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import UserFormBase from "@/components/UserFormBase";
import { useUsersStore } from "@/store/users/users.store";
import type { User } from "@/store/users/users.store";

const UserCreate = () => {
  const { addUser } = useUsersStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<Omit<User, "UsuarioID">>({
    PersonalId: 0,
    UsuarioAlias: "",
    UsuarioClave: "",
    UsuarioFechaReg: new Date().toISOString(),
    UsuarioEstado: "ACTIVO",
    UsuarioSerie: "B001",
    EnviaBoleta: 0,
    EnviarFactura: 0,
    EnviaNC: 0,
    EnviaND: 0,
    Administrador: 0,
  });

  const handleSave = (data: Omit<User, "UsuarioID">) => {
    addUser(data);
    toast.success("Usuario creado correctamente");
    navigate("/maintenance/users");
  };

  const handleNew = () => {
    setForm({
      PersonalId: 0,
      UsuarioAlias: "",
      UsuarioClave: "",
      UsuarioFechaReg: new Date().toISOString(),
      UsuarioEstado: "ACTIVO",
      UsuarioSerie: "B001",
      EnviaBoleta: 0,
      EnviarFactura: 0,
      EnviaNC: 0,
      EnviaND: 0,
      Administrador: 0,
    });
  };

  return (
    <UserFormBase
      mode="create"
      initialData={form}
      onSave={handleSave}
      onNew={handleNew}
    />
  );
};

export default UserCreate;

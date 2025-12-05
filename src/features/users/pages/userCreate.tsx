import { useState } from "react";

import { useNavigate } from "react-router";
import { toast } from "sonner";
import UserFormBase from "@/components/UserFormBase";
import { useUsersStore } from "@/store/users/users.store";
import type { User } from "@/store/employees/employees.store";

const UserCreate = () => {
  const { addUser } = useUsersStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({});

  const handleSave = (data: Omit<User, "id">) => {
    addUser(data);
    toast.success("Empleado creado correctamente");
    navigate("/users");
  };

  const handleNew = () => {
    setForm({
      nombreRazon: "",
      ruc: "",
      dni: "",
      direccionFiscal: "",
      direccionDespacho: "",
      telefonoMovil: "",
      email: "",
      registradoPor: "Admin",
      estado: "activo",
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

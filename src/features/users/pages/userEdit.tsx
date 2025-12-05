import UserFormBase from "@/components/UserFormBase";
import type { User } from "@/store/employees/employees.store";
import { useUsersStore } from "@/store/users/users.store";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

const UserEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { users, updateUser, fetchUsers, deleteUser } = useUsersStore();

  const [form, setForm] = useState<Omit<User, "id"> | null>(null);

  useEffect(() => {
    if (users.length === 0) fetchUsers();
  }, [users, fetchUsers]);

  useEffect(() => {
    const user = users.find((e) => e.id === Number(id));
    if (user) {
      const { id, ...rest } = user;
      setForm(rest);
    }
  }, [users, id]);

  if (!form) return <div>Cargando empleado...</div>;

  const handleSave = (data: Omit<User, "id">) => {
    updateUser(Number(id), data);
    toast.success("Empleado guardado correctamente");
    navigate("/users");
  };

  const handleDelete = () => {
    deleteUser(Number(id));
    toast.success("Empleado eliminado correctamente");
    navigate("/users");
  };

  const handleNew = () => navigate("/users/create");

  return (
    <UserFormBase
      mode="edit"
      initialData={form}
      onSave={handleSave}
      onDelete={handleDelete}
      onNew={handleNew}
    />
  );
};

export default UserEdit;

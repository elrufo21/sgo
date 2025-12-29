import { useState } from "react";
import { toast } from "sonner";
import UserFormBase from "@/components/UserFormBase";
import { useUsersStore } from "@/store/users/users.store";

const UserList = () => {
  const { addUser, updateUser, deleteUser } = useUsersStore();
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<any | undefined>(undefined);

  const handleSave = async (values: any) => {
    if (mode === "edit" && selectedUser?.UsuarioID) {
      const ok = await updateUser(Number(selectedUser.UsuarioID), values);
      if (ok) {
        toast.success("Usuario actualizado");
        setMode("create");
        setSelectedUser(undefined);
        return true;
      } else {
        toast.error("No se pudo actualizar el usuario");
        return false;
      }
    }

    const created = await addUser(values);
    if (created) {
      toast.success("Usuario creado correctamente");
      setMode("create");
      setSelectedUser(undefined);
      return true;
    } else {
      //toast.error("No se pudo crear el usuario");
      return false;
    }
  };

  const handleNew = () => {
    setMode("create");
    setSelectedUser(undefined);
  };

  const handleDelete = async () => {
    if (!selectedUser?.UsuarioID) return;
    const ok = await deleteUser(Number(selectedUser.UsuarioID));
    if (ok) {
      toast.success("Usuario eliminado");
      setMode("create");
      setSelectedUser(undefined);
    } else {
      toast.error("No se pudo eliminar el usuario");
    }
  };

  const handleSelect = (user: any) => {
    setSelectedUser(user);
    setMode("edit");
  };

  return (
    <UserFormBase
      mode={mode}
      initialData={selectedUser}
      onSave={handleSave}
      onNew={handleNew}
      onDelete={mode === "edit" ? handleDelete : undefined}
      onSelectUser={handleSelect}
    />
  );
};

export default UserList;

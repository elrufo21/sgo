import { CrudList } from "@/components/ListView";
import { useUsersStore } from "@/store/users/users.store";

const UserList = () => {
  const { users, fetchUsers, deleteUser } = useUsersStore();

  const columns = [
    { key: "UsuarioID", header: "ID" },
    { key: "UsuarioAlias", header: "Alias" },
    { key: "UsuarioEstado", header: "Estado" },
    { key: "UsuarioSerie", header: "Serie" },
    { key: "Administrador", header: "Admin" },
  ];
  console.log("users", users);
  return (
    <CrudList
      data={users}
      fetchData={fetchUsers}
      deleteItem={deleteUser}
      columns={columns}
      idKey="UsuarioID"
      basePath="/maintenance/users"
      createLabel="+ Añadir usuario"
      deleteMessage="¿Estás seguro de eliminar este usuario?"
    />
  );
};

export default UserList;

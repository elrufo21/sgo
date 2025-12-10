import { CrudList } from "@/components/ListView";
import { useClientsStore } from "@/store/customers/customers.store";

const CustomerList = () => {
  const { clients, fetchClients, deleteClient } = useClientsStore();

  const columns = [
    { key: "id", header: "Id" },
    { key: "nombreRazon", header: "Nombre o Razon social" },
    { key: "telefonoMovil", header: "Telefono" },
    { key: "email", header: "Email" },
  ];

  return (
    <CrudList
      data={clients}
      fetchData={fetchClients}
      deleteItem={deleteClient}
      columns={columns}
      basePath="/customers"
      createLabel="+ Añadir cliente"
      deleteMessage="¿Estás seguro de eliminar este cliente?"
    />
  );
};

export default CustomerList;

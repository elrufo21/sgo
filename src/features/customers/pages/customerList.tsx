import { CrudList } from "@/components/ListView";
import { useClientsStore } from "@/store/customers/customers.store";

const CustomerList = () => {
  const { clients, fetchClients, deleteClient } = useClientsStore();

  const columns = [
    { key: "nombreRazon", header: "Nombre o Razón social" },
    { key: "ruc", header: "RUC" },
    { key: "dni", header: "DNI" },
    { key: "telefonoMovil", header: "Teléfono" },
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
      filterKeys={["nombreRazon", "ruc", "dni", "email"]}
    />
  );
};

export default CustomerList;

import React, { useState, useEffect } from "react";
import CustomerFormBase from "@/components/CustomerFormBase";
import { useClientsStore } from "@/store/customers/customers.store";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

const CustomerEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, fetchClients, updateClient, deleteClient } =
    useClientsStore();

  const [form, setForm] = useState<Omit<any, "id">>({
    nombreRazon: "",
    ruc: "",
    dni: "",
    direccionFiscal: "",
    direccionDespacho: "",
    telefonoMovil: "",
    email: "",
    registradoPor: "",
    estado: "activo",
    fecha: null,
  });

  useEffect(() => {
    if (clients.length === 0) {
      fetchClients();
    }
  }, [clients, fetchClients]);

  useEffect(() => {
    const client = clients.find((c) => c.id === Number(id));
    if (client) {
      const { id, ...rest } = client;
      setForm(rest);
    }
  }, [clients, id]);

  if (!form) return <div>Cargando cliente...</div>;

  const handleSave = async (data: Omit<typeof form, "id">) => {
    await updateClient(Number(id), data);
    toast.success("Cliente guardado correctamente");
    navigate("/customers");
  };

  const handleDelete = async () => {
    await deleteClient(Number(id));
    toast.success("Cliente eliminado correctamente");
    navigate("/customers");
  };

  const handleNew = () => {
    navigate("/customers/create");
  };

  return (
    <CustomerFormBase
      mode="edit"
      initialData={form}
      onSave={handleSave}
      onDelete={handleDelete}
      onNew={handleNew}
    />
  );
};

export default CustomerEdit;

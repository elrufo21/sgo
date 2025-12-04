import React, { useState } from "react";
import CustomerFormBase from "@/components/CustomerFormBase";
import { useClientsStore } from "@/store/customers/customers.store";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const CustomerCreate = () => {
  const { addClient } = useClientsStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
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

  const handleSave = (data: Omit<typeof form, "id">) => {
    addClient(data);
    toast.success("Cliente creado correctamente");
    navigate("/customers");
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
    <CustomerFormBase
      mode="create"
      initialData={form}
      onSave={handleSave}
      onNew={handleNew}
    />
  );
};

export default CustomerCreate;

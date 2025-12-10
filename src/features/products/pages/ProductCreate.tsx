import React, { useState } from "react";
import CustomerFormBase from "@/components/CustomerFormBase";
import { useClientsStore } from "@/store/customers/customers.store";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ProductFormBase from "@/components/ProductFormBase";
import { useProductsStore } from "@/store/products/products.store";
import type { Product } from "@/types/product";

const CustomerCreate = () => {
  const { addProduct } = useProductsStore();
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

  const handleSave = (data: Omit<Product, "id">) => {
    addProduct(data);
    toast.success("Producto creado correctamente");
    navigate("/products");
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
    <ProductFormBase mode="create" onSave={handleSave} onNew={handleNew} />
  );
};

export default CustomerCreate;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useProductsStore } from "@/store/products/products.store";
import type { Product } from "@/types/product";
import ProductFormBase from "@/components/ProductFormBase";
import { toast } from "sonner";

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, fetchProducts, updateProduct, deleteProduct } =
    useProductsStore();

  const [codeEditable, setCodeEditable] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id"> & { images?: string[] }>(
    {
      categoria: "",
      codigo: "",
      nombre: "",
      unidadMedida: "",
      valorCritico: 0,
      preCosto: 0,
      preVenta: 0,
      aplicaINV: "bien",
      cantidad: 0,
      usuario: "",
      estado: "activo",
      images: [],
    }
  );

  useEffect(() => {
    if (products.length === 0) fetchProducts();
  }, [products, fetchProducts]);

  useEffect(() => {
    const prod = products.find((p) => p.id === Number(id));
    if (prod) {
      const { id, ...rest } = prod;
      setForm({ ...rest, images: rest.images || [] });
      setCodeEditable(false);
    }
  }, [products, id]);

  if (!form) return <div>Cargando producto...</div>;

  const handleSave = () => {
    updateProduct(Number(id), form);
    toast.success("Producto guardado correctamente");
    navigate("/products");
  };

  return (
    <ProductFormBase
      mode="edit"
      initialData={form}
      onSave={handleSave}
      onArchive={() => {}}
      onNew={() => {
        navigate("/products/create");
      }}
      onDelete={() => {
        deleteProduct(Number(id));
        toast.success("Producto eliminado correctamente");
        navigate("/products");
      }}
    />
  );
}

import { useState, useEffect } from "react";

import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import PurchaseFormBase from "@/components/PurchaseFormBase";
import { usePurchasesStore } from "@/store/purchanse.store";

const PurchanseEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { purchases, fetchPurchases, updatePurchase, deletePurchase } =
    usePurchasesStore();

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
  });

  useEffect(() => {
    if (purchases.length === 0) fetchPurchases();
  }, [purchases, fetchPurchases]);

  useEffect(() => {
    const purchase = purchases.find((c) => c.id === Number(id));
    if (purchases) {
      const { id, ...rest } = purchase;
      setForm(rest);
    }
  }, [purchases, id]);

  if (!form) return <div>Cargando cliente...</div>;

  const handleSave = (data: Omit<typeof form, "id">) => {
    updatePurchase(Number(id), data);
    toast.success("Cliente guardado correctamente");
    navigate("/purchanses");
  };

  const handleDelete = () => {
    deletePurchase(Number(id));
    toast.success("Cliente eliminado correctamente");
    navigate("/purchanses");
  };

  const handleNew = () => {
    navigate("/purchanses/create");
  };

  return (
    <PurchaseFormBase
      mode="edit"
      initialData={form}
      onSave={handleSave}
      onDelete={handleDelete}
      onNew={handleNew}
    />
  );
};

export default PurchanseEdit;

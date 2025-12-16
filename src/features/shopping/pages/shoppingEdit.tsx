import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import ShoppingFormBase from "@/components/ShoppingFormBase";
import { useShoppingStore } from "@/store/shopping/shopping.store";
import type { ShoppingFormData } from "@/types/shopping";
import { useDialogStore } from "@/store/app/dialog.store";

const ShoppingEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openDialog = useDialogStore((s) => s.openDialog);

  const { shoppings, fetchShoppings, updateShopping, deleteShopping } =
    useShoppingStore();

  useEffect(() => {
    if (shoppings.length === 0) fetchShoppings();
  }, [fetchShoppings, shoppings.length]);

  const shopping = shoppings.find((s) => s.id === Number(id));

  if (!shopping) {
    return <div className="p-6">Cargando compra...</div>;
  }

  const handleSave = async (data: ShoppingFormData) => {
    if (!id) return;
    await updateShopping(Number(id), data);
    toast.success("Compra actualizada localmente");
    navigate("/shopping");
  };

  const handleDelete = () => {
    if (!id) return;
    openDialog({
      title: "Eliminar",
      content: <p>Seguro que deseas eliminar esta compra?</p>,
      onConfirm: async () => {
        await deleteShopping(Number(id));
        toast.success("Compra eliminada");
        navigate("/shopping");
      },
    });
  };

  return (
    <ShoppingFormBase
      mode="edit"
      initialData={shopping}
      onSave={handleSave}
      onNew={() => navigate("/shopping/create")}
      onDelete={handleDelete}
    />
  );
};

export default ShoppingEdit;

import React, { useEffect, useState } from "react";
import CashFlowForm from "@/components/CashFlowForm";
import { useCashFlowStore } from "@/store/cashFlow/cashFlow.store";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { CashFlow } from "@/types/cashFlow";

const CashFlowEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { flows, fetchFlows, updateFlow, deleteFlow, getFlowById } =
    useCashFlowStore();
  const [flow, setFlow] = useState<CashFlow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFlow = async () => {
      // Si no hay flows, los cargamos
      if (flows.length === 0) {
        await fetchFlows();
      }

      // Buscamos el flow específico
      const foundFlow = getFlowById(Number(id));
      if (foundFlow) {
        setFlow(foundFlow);
      } else {
        toast.error("Flujo de caja no encontrado");
        navigate("/cash_flow_control");
      }
      setLoading(false);
    };

    loadFlow();
  }, [id, flows.length, fetchFlows, getFlowById, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando flujo de caja...</div>
      </div>
    );
  }

  if (!flow) {
    return null;
  }

  const handleSave = (data: Omit<CashFlow, "id">) => {
    updateFlow(Number(id), data);
    toast.success("Flujo de caja actualizado correctamente");
    navigate("/cash_flow_control");
  };

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de eliminar este flujo de caja?")) {
      deleteFlow(Number(id));
      toast.success("Flujo de caja eliminado correctamente");
      navigate("/cash_flow_control");
    }
  };

  const handleNew = () => {
    navigate("/cash_flow_control/create");
  };

  return (
    <CashFlowForm
      mode="edit"
      initialData={flow}
      onSave={handleSave}
      onDelete={handleDelete}
      onNew={handleNew}
    />
  );
};

export default CashFlowEdit;

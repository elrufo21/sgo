import React, { useState } from "react";
import CustomerFormBase from "@/components/CustomerFormBase";
import { useClientsStore } from "@/store/customers/customers.store";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import EmployeeFormBase from "@/components/EmployeeFormBase";
import { useEmployeesStore } from "@/store/employees/employees.store";

const EmployeeCreate = () => {
  const { addEmployee } = useEmployeesStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({});

  const handleSave = (data: Omit<typeof form, "id">) => {
    addEmployee(data);
    toast.success("Empleado creado correctamente");
    navigate("/employees");
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
    <EmployeeFormBase
      mode="create"
      initialData={form}
      onSave={handleSave}
      onNew={handleNew}
    />
  );
};

export default EmployeeCreate;

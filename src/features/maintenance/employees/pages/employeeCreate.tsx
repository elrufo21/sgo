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
    navigate("/maintenance/employees");
  };
  const hoy = () => {
    return new Date().toISOString().split("T")[0];
  };

  const handleNew = () => {
    console.log("nuevo");
    setForm({
      company: "",
      area: "",
      code: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      password: "",
      nombres: "",
      apellidos: "",
      ruc: "",
      dni: "",
      direccion: "",
      fechaNacimiento: "",
      telefonoMovil: "",
      telefonoAsignado: "",
      correo: "",
      fechaBaja: "",
      estado: "activo",
      foto: "",
      fechaIngreso: hoy(),
    });
  };

  return (
    <EmployeeFormBase
      mode="create"
      initialData={{ ...form, fechaIngreso: hoy() }}
      onSave={handleSave}
      onNew={handleNew}
    />
  );
};

export default EmployeeCreate;

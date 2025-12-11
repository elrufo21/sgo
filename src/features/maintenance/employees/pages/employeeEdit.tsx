import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import EmployeeFormBase from "@/components/EmployeeFormBase";
import { useEmployeesStore } from "@/store/employees/employees.store";
import type { Personal } from "@/types/employees";

const EmployeeEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { employees, fetchEmployees, updateEmployee, deleteEmployee } =
    useEmployeesStore();

  const [form, setForm] = useState<Personal | null>(null);

  useEffect(() => {
    if (employees.length === 0) fetchEmployees();
  }, [employees, fetchEmployees]);

  useEffect(() => {
    const employee = employees.find(
      (e) => String(e.personalId) === String(id)
    );
    if (employee) {
      setForm(employee);
    }
  }, [employees, id]);

  if (!form) return <div>Cargando empleado...</div>;

  const handleSave = async (data: Personal) => {
    await updateEmployee(Number(id), data);
    toast.success("Empleado guardado correctamente");
    navigate("/maintenance/employees");
  };

  const handleDelete = async () => {
    await deleteEmployee(Number(id));
    toast.success("Empleado eliminado correctamente");
    navigate("/maintenance/employees");
  };

  const handleNew = () => navigate("/maintenance/employees/create");

  return (
    <EmployeeFormBase
      mode="edit"
      initialData={form}
      onSave={handleSave}
      onDelete={handleDelete}
      onNew={handleNew}
    />
  );
};

export default EmployeeEdit;

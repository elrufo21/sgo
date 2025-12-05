import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useEmployeesStore } from "@/store/employees/employees.store";
import EmployeeFormBase from "@/components/EmployeeFormBase";
import type { Employee } from "@/types/employees";

const EmployeeEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { employees, fetchEmployees, updateEmployee, deleteEmployee } =
    useEmployeesStore();

  const [form, setForm] = useState<Omit<Employee, "id"> | null>(null);

  // cargar empleados si el store está vacío
  useEffect(() => {
    if (employees.length === 0) fetchEmployees();
  }, [employees, fetchEmployees]);

  // cargar el empleado en el formulario
  useEffect(() => {
    const employee = employees.find((e) => e.id === Number(id));
    if (employee) {
      const { id, ...rest } = employee;
      setForm(rest);
    }
  }, [employees, id]);

  if (!form) return <div>Cargando empleado...</div>;

  const handleSave = (data: Omit<Employee, "id">) => {
    updateEmployee(Number(id), data);
    toast.success("Empleado guardado correctamente");
    navigate("/employees");
  };

  const handleDelete = () => {
    deleteEmployee(Number(id));
    toast.success("Empleado eliminado correctamente");
    navigate("/employees");
  };

  const handleNew = () => navigate("/employees/create");

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

import { CrudList } from "@/components/ListView";
import { useEmployeesStore } from "@/store/employees/employees.store";
import type { Employee } from "@/types/employees";

const EmployeeList = () => {
  const { employees, fetchEmployees, deleteEmployee } = useEmployeesStore();

  const columns = [
    { key: "personalId", header: "Id" },
    {
      id: "nombreCompleto",
      header: "Nombres",
      render: (row: Employee) =>
        `${row.personalNombres ?? ""} ${row.personalApellidos ?? ""}`.trim(),
    },
    { key: "personalTelefono", header: "Telefono" },
    { key: "personalEmail", header: "Email" },
  ];

  return (
    <CrudList
      data={employees}
      fetchData={fetchEmployees}
      deleteItem={deleteEmployee}
      columns={columns}
      basePath="/maintenance/employees"
      createLabel="+ Añadir empleado"
      deleteMessage="¿Estás seguro de eliminar este empleado?"
      idKey="personalId"
    />
  );
};

export default EmployeeList;

import EmployeeCreate from "./pages/employeeCreate";
import EmployeeEdit from "./pages/employeeEdit";
import EmployeeList from "./pages/employeeList";

export default [
  {
    path: "employees",
    element: <EmployeeList />,
    handle: {
      breadcrumb: [{ label: "Empleados" }],
    },
  },
  {
    path: "employees/create",
    element: <EmployeeCreate />,
    handle: {
      breadcrumb: [
        { label: "Empleados", to: "/employees" },
        { label: "Crear empleado" },
      ],
    },
  },
  {
    path: "employees/:id/edit",
    element: <EmployeeEdit />,
    handle: {
      breadcrumb: [
        { label: "Empleados", to: "/employees" },
        { label: "Editar empleado" },
      ],
    },
  },
];

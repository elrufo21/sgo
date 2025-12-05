import EmployeeCreate from "./pages/EmployeeCreate";
import EmployeeEdit from "./pages/employeeEdit";
import EmployeeList from "./pages/employeeList";

export default [
  { path: "employees", element: <EmployeeList /> },
  { path: "employees/create", element: <EmployeeCreate /> },
  { path: "employees/:id/edit", element: <EmployeeEdit /> },
];

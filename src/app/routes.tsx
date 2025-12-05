import { useRoutes } from "react-router";
import MainLayout from "./layouts/MainLayout";

import productRoutes from "../features/products/routes";
import customerRoutes from "../features/customers/routes";
import purchansesRoutes from "../features/purchanses/routes";
import employeesRoutes from "../features/employees/routes";
import Dashboard from "@/features/Dashboard/dashboard";
import usersRoutes from "@/features/users/routes";
import maintenanceRoutes from "@/features/maintenance/routes";
export default function Router() {
  const routes = useRoutes([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { index: true, element: <Dashboard /> },

        ...productRoutes,
        ...customerRoutes,
        ...purchansesRoutes,
        ...employeesRoutes,
        ...usersRoutes,
        ...maintenanceRoutes,
      ],
    },
    { path: "*", element: <h1>404 - Not Found</h1> },
  ]);

  return routes;
}

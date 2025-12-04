import { useRoutes } from "react-router";
import MainLayout from "./layouts/MainLayout";

import productRoutes from "../features/products/routes";
import customerRoutes from "../features/customers/routes";
import purchansesRoutes from "../features/purchanses/routes";
import Dashboard from "@/features/Dashboard/dashboard";
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
      ],
    },
    { path: "*", element: <h1>404 - Not Found</h1> },
  ]);

  return routes;
}

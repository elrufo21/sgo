import { createBrowserRouter, RouterProvider } from "react-router";
import MainLayout from "./layouts/MainLayout";

import productRoutes from "../features/products/routes";
import customerRoutes from "../features/customers/routes";
import purchansesRoutes from "../features/purchanses/routes";
import Dashboard from "@/features/Dashboard/dashboard";
import maintenanceRoutes from "@/features/maintenance/routes";
import cashFlowRoutes from "@/features/cashFlow/routes";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      ...productRoutes,
      ...customerRoutes,
      ...purchansesRoutes,
      ...maintenanceRoutes,
      ...cashFlowRoutes,
    ],
  },
  { path: "*", element: <h1>404 - Not Found</h1> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}

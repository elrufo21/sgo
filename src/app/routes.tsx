import { Navigate, RouterProvider, createBrowserRouter } from "react-router";
import Dashboard from "@/features/Dashboard/dashboard";
import cashFlowRoutes from "@/features/cashFlow/routes";
import maintenanceRoutes from "@/features/maintenance/routes";
import productRoutes from "@/features/products/routes";
import customerRoutes from "../features/customers/routes";
import purchansesRoutes from "../features/purchanses/routes";
import shoppingRoutes from "../features/shopping/routes";
import MainLayout from "./layouts/MainLayout";
import { RedirectIfAuthenticated, RequireAuth } from "./guards/AuthGuard";
import LoginPage from "@/features/auth/LoginPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      ...productRoutes,
      ...customerRoutes,
      ...purchansesRoutes,
      ...shoppingRoutes,
      ...maintenanceRoutes,
      ...cashFlowRoutes,
      { path: "*", element: <h1>404 - Not Found</h1> },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}

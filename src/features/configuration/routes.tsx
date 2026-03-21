import BillingSettingsPage from "./pages/BillingSettingsPage";
import ConfigurationDashboard from "./pages/ConfigurationDashboard";

export default [
  {
    path: "configuration",
    element: <ConfigurationDashboard />,
    handle: {
      breadcrumb: [{ label: "Configuración" }],
    },
  },
  {
    path: "configuration/billing",
    element: <BillingSettingsPage />,
    handle: {
      breadcrumb: [
        { label: "Configuración", to: "/configuration" },
        { label: "Facturación" },
      ],
    },
  },
];


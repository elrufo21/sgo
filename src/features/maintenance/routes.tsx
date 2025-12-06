import AreaCreate from "./areas/areaCreate";
import AreaEdit from "./areas/areaEdit";
import AreaList from "./areas/areatList";
import CategoryCreate from "./categories/categoriesCreate";
import CategoryEdit from "./categories/categoriesEdit";
import CategoryList from "./categories/categoriesList";
import ComputerCreate from "./computers/computersCreate";
import ComputerEdit from "./computers/computersEdit";
import ComputerList from "./computers/computersList";
import MaintenanceDashboard from "./pages/MaintenanceDashboard";

export default [
  {
    path: "maintenance",
    element: <MaintenanceDashboard />,
    handle: {
      breadcrumb: [{ label: "Mantenimiento" }],
    },
  },

  {
    path: "maintenance/areas",
    element: <AreaList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Áreas" },
      ],
    },
  },
  {
    path: "maintenance/areas/create",
    element: <AreaCreate />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Áreas", to: "/maintenance/areas" },
        { label: "Crear área" },
      ],
    },
  },
  {
    path: "maintenance/areas/:id/edit",
    element: <AreaEdit />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Áreas", to: "/maintenance/areas" },
        { label: "Editar área" },
      ],
    },
  },

  {
    path: "maintenance/categories",
    element: <CategoryList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Categorías" },
      ],
    },
  },
  {
    path: "maintenance/categories/create",
    element: <CategoryCreate />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Categorías", to: "/maintenance/categories" },
        { label: "Crear categoría" },
      ],
    },
  },
  {
    path: "maintenance/categories/:id/edit",
    element: <CategoryEdit />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Categorías", to: "/maintenance/categories" },
        { label: "Editar categoría" },
      ],
    },
  },

  {
    path: "maintenance/computers",
    element: <ComputerList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Computadoras" },
      ],
    },
  },
  {
    path: "maintenance/computers/create",
    element: <ComputerCreate />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Computadoras", to: "/maintenance/computers" },
        { label: "Crear computadora" },
      ],
    },
  },
  {
    path: "maintenance/computers/:id/edit",
    element: <ComputerEdit />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Computadoras", to: "/maintenance/computers" },
        { label: "Editar computadora" },
      ],
    },
  },
];

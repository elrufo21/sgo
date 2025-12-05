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

/** categorías
import CategoryList from "./categories/pages/CategoryList";
import CategoryCreate from "./categories/pages/CategoryCreate";
import CategoryEdit from "./categories/pages/CategoryEdit";

// áreas
import AreaList from "./areas/pages/AreaList";
import AreaCreate from "./areas/pages/AreaCreate";
import AreaEdit from "./areas/pages/AreaEdit";

// computadoras
import ComputerList from "./computers/pages/ComputerList";
import ComputerCreate from "./computers/pages/ComputerCreate";
import ComputerEdit from "./computers/pages/ComputerEdit"; */

export default [
  // Dashboard del módulo mantenimiento
  { path: "maintenance", element: <MaintenanceDashboard /> },
  { path: "maintenance/areas", element: <AreaList /> },
  { path: "maintenance/areas/create", element: <AreaCreate /> },
  { path: "maintenance/areas/:id/edit", element: <AreaEdit /> },
  { path: "maintenance/categories", element: <CategoryList /> },
  { path: "maintenance/categories/create", element: <CategoryCreate /> },
  { path: "maintenance/categories/:id/edit", element: <CategoryEdit /> },
  { path: "maintenance/computers", element: <ComputerList /> },
  { path: "maintenance/computers/create", element: <ComputerCreate /> },
  { path: "maintenance/computers/:id/edit", element: <ComputerEdit /> },

  /*
  // Categorías
  


  

  // Computadoras
  { path: "maintenance/computers", element: <ComputerList /> },
  { path: "maintenance/computers/create", element: <ComputerCreate /> },
  { path: "maintenance/computers/:id/edit", element: <ComputerEdit /> },
*/
];

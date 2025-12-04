import CustomerCreate from "./pages/customerCreate";
import CustomerEdit from "./pages/customerEdit";
import CustomerList from "./pages/customerList";

export default [
  { path: "customers", element: <CustomerList /> },
  { path: "customers/create", element: <CustomerCreate /> },
  { path: "customers/:id/edit", element: <CustomerEdit /> },
];

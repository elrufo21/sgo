import ProductList from "./pages/ProductList";
import ProductCreate from "./pages/ProductCreate";
import ProductEdit from "./pages/ProductEdit";

export default [
  { path: "products", element: <ProductList /> },
  { path: "products/create", element: <ProductCreate /> },
  { path: "products/:id/edit", element: <ProductEdit /> },
];

import PurchanseCreate from "./pages/purchanseCreate";
import PurchanseEdit from "./pages/purchanseEdit";
import PurchanseList from "./pages/purchanseList";

export default [
  { path: "purchanses", element: <PurchanseList /> },
  { path: "purchanses/create", element: <PurchanseCreate /> },
  { path: "purchanses/:id/edit", element: <PurchanseEdit /> },
];

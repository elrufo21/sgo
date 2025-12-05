import CashFlowCreate from "./pages/cashFlowCreate";
import CashFlowEdit from "./pages/cashFlowEdit";
import CashFlowList from "./pages/cashFlowList";

export default [
  { path: "cash_flow_control", element: <CashFlowList /> },
  { path: "cash_flow_control/create", element: <CashFlowCreate /> },
  { path: "cash_flow_control/:id/edit", element: <CashFlowEdit /> },
];

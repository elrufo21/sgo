import UserCreate from "./pages/userCreate";
import UserEdit from "./pages/userEdit";
import UserList from "./pages/userList";

export default [
  { path: "users", element: <UserList /> },
  { path: "users/create", element: <UserCreate /> },
  { path: "users/:id/edit", element: <UserEdit /> },
];

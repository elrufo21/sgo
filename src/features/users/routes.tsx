import UserCreate from "./pages/userCreate";
import UserEdit from "./pages/userEdit";
import UserList from "./pages/userList";

export default [
  {
    path: "users",
    element: <UserList />,
    handle: {
      breadcrumb: [{ label: "Usuarios" }],
    },
  },
  {
    path: "users/create",
    element: <UserCreate />,
    handle: {
      breadcrumb: [
        { label: "Usuarios", to: "/users" },
        { label: "Crear usuario" },
      ],
    },
  },
  {
    path: "users/:id/edit",
    element: <UserEdit />,
    handle: {
      breadcrumb: [
        { label: "Usuarios", to: "/users" },
        { label: "Editar usuario" },
      ],
    },
  },
];

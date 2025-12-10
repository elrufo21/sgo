import { Outlet, Link, useLocation, useMatches } from "react-router";
import {
  Home,
  Package,
  UserCheck,
  DollarSign,
  Menu,
  X,
  Settings2,
  StoreIcon,
} from "lucide-react";
import { useState } from "react";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface RouteHandle {
  breadcrumb?: BreadcrumbItem[];
}

export default function MainLayout() {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState(""); // 🔍 buscador
  const { pathname } = useLocation();
  const matches = useMatches();

  // 📌 Items del menú
  const navItems = [
    { label: "Dashboard", to: "/", icon: <Home size={18} /> },
    { label: "Productos", to: "/products", icon: <Package size={18} /> },
    { label: "Clientes", to: "/customers", icon: <UserCheck size={18} /> },
    { label: "Ventas", to: "/purchases", icon: <DollarSign size={18} /> },
    {
      label: "Mantenimiento",
      to: "/maintenance",
      icon: <Settings2 />,
    },
    {
      label: "Control de flujo de caja",
      to: "/cash_flow_control",
      icon: <StoreIcon />,
    },
  ];

  // 🔎 Filtrar módulos
  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  // 📌 Breadcrumb automático
  const breadcrumbItems = matches
    .filter((match) => {
      const handle = match.handle as RouteHandle | undefined;
      return handle?.breadcrumb;
    })
    .flatMap((match) => {
      const handle = match.handle as RouteHandle;
      return handle.breadcrumb || [];
    });

  // Render de items del menú
  const renderNavItem = (
    item: (typeof navItems)[0],
    alwaysShowLabel = false
  ) => {
    const active = pathname === item.to || pathname.startsWith(item.to + "/");

    return (
      <Link
        key={item.to}
        to={item.to}
        className={`
          flex items-center gap-3 p-3 rounded-lg transition-all duration-200
          justify-center ${!open && !alwaysShowLabel ? "" : "justify-start"}
          ${
            active
              ? "bg-slate-600 text-white shadow"
              : "text-gray-700 hover:bg-gray-200"
          }
        `}
        title={!open && !alwaysShowLabel ? item.label : undefined}
      >
        {item.icon}
        {(open || alwaysShowLabel) && (
          <span className="text-sm font-medium">{item.label}</span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* SIDEBAR DESKTOP */}
      <aside
        className={`hidden md:flex flex-col bg-white shadow-xl transition-all duration-300
          ${open ? "w-60" : "w-16"}`}
      >
        <div className="relative flex items-center justify-around p-4 border-b">
          <h1
            className={`text-lg font-semibold text-slate-600 transition-opacity duration-300 ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            Mi Sistema
          </h1>

          <button
            onClick={() => setOpen(!open)}
            className={`p-2 rounded hover:bg-gray-100 transition-colors 
            ${!open ? "absolute right-2 top-1/2 -translate-y-1/2" : ""}`}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* 🔍 BUSCADOR Desktop (solo cuando está abierto) */}
        {open && (
          <div className="px-3 mt-4">
            <input
              type="text"
              placeholder="Buscar módulo..."
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring focus:ring-slate-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Navegación */}
        <nav className="mt-4 flex flex-col gap-1 px-2 flex-1">
          {(search ? filteredItems : navItems).map((item) =>
            renderNavItem(item)
          )}
        </nav>

        <div className="p-4 border-t text-center text-gray-400 text-xs">
          {open && "© 2025 Mi Empresa"}
        </div>
      </aside>

      {/* OVERLAY MÓVIL */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR MÓVIL */}
      <aside
        className={`fixed z-50 top-0 left-0 h-full bg-white shadow-xl transition-transform duration-300 md:hidden
          ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } w-64 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold text-slate-600">Mi Sistema</h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 🔍 BUSCADOR Móvil */}
        <div className="px-3 mt-4">
          <input
            type="text"
            placeholder="Buscar módulo..."
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring focus:ring-slate-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-2 flex-1">
          {(search ? filteredItems : navItems).map((item) =>
            renderNavItem(item, true)
          )}
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-slate-700 shadow px-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {/* Botón móvil */}
            <button
              className="md:hidden p-2 rounded hover:bg-slate-500 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-semibold">Panel de Control</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-500 text-white flex items-center justify-center font-semibold cursor-pointer hover:bg-slate-400 transition-colors">
              R
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {/* Breadcrumb */}
          {breadcrumbItems.length > 0 && (
            <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
              <ol className="list-reset flex">
                <li>
                  <Link to="/" className="hover:text-gray-700">
                    Inicio
                  </Link>
                </li>
                {breadcrumbItems.map((item, idx) => (
                  <li key={idx} className="flex items-center">
                    <span className="mx-2">/</span>
                    {item.to ? (
                      <Link to={item.to} className="hover:text-gray-700">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="capitalize">{item.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}

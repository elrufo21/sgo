import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  Home,
  Package,
  UserCheck,
  DollarSign,
  Menu,
  X,
  Settings2,
  StoreIcon,
  ChevronDown,
  CopySlashIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/shared/ui/toast";
import UserFormBase from "@/components/UserFormBase";
import { PASSWORD_EXPIRATION_LOCK_ENABLED } from "@/config";
import { useDialogStore } from "@/store/app/dialog.store";
import { useAuthStore } from "@/store/auth/auth.store";
import { useUsersStore } from "@/store/users/users.store";
import type { User } from "@/store/users/users.store";

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
const PASSWORD_POLICY_MESSAGE =
  "La contrasena debe tener minimo 6 caracteres, una mayuscula, una minuscula y un numero";

export default function MainLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState(""); // 🔍 buscador
  const { pathname } = useLocation();
  const openDialog = useDialogStore((state) => state.openDialog);

  const user = useAuthStore((state) => state.user);
  const passwordExpiresAt = useAuthStore((state) => state.passwordExpiresAt);
  const isPasswordExpired = useAuthStore((state) => state.isPasswordExpired);
  const logout = useAuthStore((state) => state.logout);

  const users = useUsersStore((state) => state.users);
  const fetchUsers = useUsersStore((state) => state.fetchUsers);
  const updateUser = useUsersStore((state) => state.updateUser);

  const passwordDialogOpenedRef = useRef(false);
  const resolvingUserRef = useRef(false);
  const userLoadErrorNotifiedRef = useRef(false);
  const authSessionUserIdentity = useMemo(() => {
    const toPositiveNumber = (value: unknown) => {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : 0;
    };
    const normalizeId = (value: unknown) => String(value ?? "").trim();

    const normalizeAlias = (value: unknown) =>
      String(value ?? "")
        .trim()
        .toLowerCase();

    const stateUserIdRaw = normalizeId(user?.id);
    const statePersonalIdRaw = normalizeId(user?.personalId);
    const stateUserId = toPositiveNumber(user?.id);
    const statePersonalId = toPositiveNumber(user?.personalId);
    const stateAlias = normalizeAlias(user?.username);

    if (typeof window === "undefined") {
      return {
        userIdRaw: stateUserIdRaw,
        personalIdRaw: statePersonalIdRaw,
        userId: stateUserId,
        personalId: statePersonalId,
        alias: stateAlias,
      };
    }

    try {
      const raw = window.localStorage.getItem("sgo.auth.session");
      if (!raw) {
        return {
          userIdRaw: stateUserIdRaw,
          personalIdRaw: statePersonalIdRaw,
          userId: stateUserId,
          personalId: statePersonalId,
          alias: stateAlias,
        };
      }
      const parsed = JSON.parse(raw) as {
        id?: unknown;
        usuarioID?: unknown;
        user?: {
          id?: unknown;
          userId?: unknown;
          usuarioID?: unknown;
          personalId?: unknown;
          username?: unknown;
          UsuarioAlias?: unknown;
        };
      } | null;

      const storageUserId =
        toPositiveNumber(parsed?.user?.id) ||
        toPositiveNumber(parsed?.user?.userId) ||
        toPositiveNumber(parsed?.user?.usuarioID) ||
        toPositiveNumber(parsed?.usuarioID) ||
        toPositiveNumber(parsed?.id);
      const storageUserIdRaw =
        normalizeId(parsed?.user?.id) ||
        normalizeId(parsed?.user?.userId) ||
        normalizeId(parsed?.user?.usuarioID) ||
        normalizeId(parsed?.usuarioID) ||
        normalizeId(parsed?.id);
      const storagePersonalId = toPositiveNumber(parsed?.user?.personalId);
      const storagePersonalIdRaw = normalizeId(parsed?.user?.personalId);
      const storageAlias =
        normalizeAlias(parsed?.user?.username) ||
        normalizeAlias(parsed?.user?.UsuarioAlias);

      return {
        userIdRaw: stateUserIdRaw || storageUserIdRaw,
        personalIdRaw: statePersonalIdRaw || storagePersonalIdRaw,
        userId: stateUserId || storageUserId,
        personalId: statePersonalId || storagePersonalId,
        alias: stateAlias || storageAlias,
      };
    } catch {
      return {
        userIdRaw: stateUserIdRaw,
        personalIdRaw: statePersonalIdRaw,
        userId: stateUserId,
        personalId: statePersonalId,
        alias: stateAlias,
      };
    }
  }, [user?.id, user?.personalId, user?.username]);

  const hasSessionIdentity = useMemo(() => {
    const identity = authSessionUserIdentity;
    return Boolean(
      identity.userId ||
      identity.personalId ||
      identity.userIdRaw ||
      identity.personalIdRaw ||
      identity.alias,
    );
  }, [authSessionUserIdentity]);
  const userInitial =
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.username?.charAt(0)?.toUpperCase() ||
    "?";

  const passwordExpirationDateLabel = useMemo(() => {
    if (!passwordExpiresAt) return "fecha no disponible";
    const parsed = Date.parse(passwordExpiresAt);
    if (Number.isNaN(parsed)) return passwordExpiresAt;
    return new Date(parsed).toLocaleDateString("es-PE");
  }, [passwordExpiresAt]);

  const currentUserForPasswordUpdate = useMemo<User | null>(() => {
    const { userId, personalId, alias } = authSessionUserIdentity;
    if (!userId && !personalId && !alias) return null;

    return (
      users.find((item) => Number(item.UsuarioID) === userId) ??
      users.find((item) => Number(item.PersonalId) === personalId) ??
      users.find(
        (item) =>
          String(item.UsuarioAlias ?? "")
            .trim()
            .toLowerCase() === alias,
      ) ??
      null
    );
  }, [authSessionUserIdentity, users]);

  const resolveCurrentUserFromStore = useCallback((): User | null => {
    const { userId, personalId, alias, userIdRaw, personalIdRaw } =
      authSessionUserIdentity;
    if (!userId && !personalId && !alias && !userIdRaw && !personalIdRaw)
      return null;

    const rows = useUsersStore.getState().users;
    const normalizeId = (value: unknown) => String(value ?? "").trim();
    const rowMatchesRawId = (row: User) =>
      normalizeId(row.UsuarioID) === userIdRaw ||
      normalizeId(row.PersonalId) === personalIdRaw ||
      normalizeId(row.UsuarioID) === personalIdRaw ||
      normalizeId(row.PersonalId) === userIdRaw;

    return (
      rows.find((item) => Number(item.UsuarioID) === userId) ??
      rows.find((item) => Number(item.PersonalId) === personalId) ??
      rows.find((item) => Number(item.UsuarioID) === personalId) ??
      rows.find((item) => Number(item.PersonalId) === userId) ??
      rows.find((item) => rowMatchesRawId(item)) ??
      rows.find(
        (item) =>
          String(item.UsuarioAlias ?? "")
            .trim()
            .toLowerCase() === alias,
      ) ??
      null
    );
  }, [authSessionUserIdentity]);

  const ensureCurrentUserLoaded =
    useCallback(async (): Promise<User | null> => {
      const inMemory = resolveCurrentUserFromStore();
      if (inMemory) return inMemory;

      const attempts: Array<"" | "ACTIVO" | "INACTIVO"> = [
        "",
        "ACTIVO",
        "INACTIVO",
      ];
      for (const estado of attempts) {
        await fetchUsers(estado);
        const found = resolveCurrentUserFromStore();
        if (found) return found;
      }

      return null;
    }, [fetchUsers, resolveCurrentUserFromStore]);

  const openPasswordExpiredDialog = useCallback(
    (row: User) => {
      openDialog({
        title: "Cambiar la contraseña",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Tu clave ha vencido. Debes cambiar la contraseña para continuar
              usando el sistema.
            </p>
            <p className="text-sm text-slate-700">
              Fecha de vencimiento:{" "}
              <span className="font-semibold">
                {passwordExpirationDateLabel}
              </span>
            </p>
            <UserFormBase
              variant="modal"
              mode="edit"
              fieldsMode="password-only"
              initialData={row}
              onSave={() => true}
            />
          </div>
        ),
        confirmText: "Guardar contraseña",
        cancelText: "Cerrar sesión",
        maxWidth: "sm",
        fullWidth: true,
        disableBackdropClose: true,
        onCancel: () => {
          logout();
          navigate("/login", { replace: true });
        },
        onConfirm: async (rawData) => {
          const data = (rawData ?? {}) as Partial<User> & {
            ConfirmClave?: string;
          };

          const password = data.UsuarioClave ?? "";
          const confirmPassword = data.ConfirmClave ?? "";

          if (!password || !confirmPassword || password !== confirmPassword) {
            toast.error("Las contrasenas no coinciden");
            return false;
          }

          if (!PASSWORD_POLICY_REGEX.test(password)) {
            toast.error(PASSWORD_POLICY_MESSAGE);
            return false;
          }

          const updated = await updateUser(row.UsuarioID, {
            PersonalId: Number(data.PersonalId ?? row.PersonalId ?? 0),
            UsuarioAlias: (
              data.UsuarioAlias ??
              row.UsuarioAlias ??
              user?.username ??
              ""
            ).trim(),
            UsuarioClave: password,
            UsuarioFechaReg:
              data.UsuarioFechaReg ??
              row.UsuarioFechaReg ??
              new Date().toISOString(),
            UsuarioEstado: data.UsuarioEstado ?? row.UsuarioEstado ?? "ACTIVO",
            UsuarioSerie: data.UsuarioSerie ?? row.UsuarioSerie ?? "B001",
            EnviaBoleta: data.EnviaBoleta ?? row.EnviaBoleta ?? 0,
            EnviarFactura: data.EnviarFactura ?? row.EnviarFactura ?? 0,
            EnviaNC: data.EnviaNC ?? row.EnviaNC ?? 0,
            EnviaND: data.EnviaND ?? row.EnviaND ?? 0,
            Administrador: data.Administrador ?? row.Administrador ?? 0,
            area: row.area,
          });

          if (!updated) {
            toast.error("No se pudo actualizar la contraseña.");
            return false;
          }

          await fetchUsers("ACTIVO");
          toast.success("Contrasena actualizada correctamente");
          logout();
          navigate("/login", { replace: true });
          return true;
        },
      });
    },
    [
      fetchUsers,
      openDialog,
      logout,
      navigate,
      passwordExpirationDateLabel,
      updateUser,
      user?.username,
    ],
  );

  useEffect(() => {
    if (!PASSWORD_EXPIRATION_LOCK_ENABLED || !isPasswordExpired) {
      passwordDialogOpenedRef.current = false;
      resolvingUserRef.current = false;
      userLoadErrorNotifiedRef.current = false;
      return;
    }

    if (!hasSessionIdentity) return;
    if (passwordDialogOpenedRef.current) return;
    if (resolvingUserRef.current) return;

    let cancelled = false;
    resolvingUserRef.current = true;

    const run = async () => {
      const row =
        currentUserForPasswordUpdate ?? (await ensureCurrentUserLoaded());
      if (cancelled) return;

      if (!row) {
        if (!userLoadErrorNotifiedRef.current) {
          userLoadErrorNotifiedRef.current = true;
          toast.error(
            "No se pudo cargar el usuario completo para cambiar la contraseña.",
          );
        }
        return;
      }

      userLoadErrorNotifiedRef.current = false;
      passwordDialogOpenedRef.current = true;
      openPasswordExpiredDialog(row);
    };

    void run().finally(() => {
      if (!cancelled) {
        resolvingUserRef.current = false;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    currentUserForPasswordUpdate,
    ensureCurrentUserLoaded,
    hasSessionIdentity,
    isPasswordExpired,
    openPasswordExpiredDialog,
  ]);

  const navItems = [
    { label: "Dashboard", to: "/", icon: <Home size={18} /> },
    {
      label: "Ventas",
      to: "/sales",
      icon: <DollarSign size={18} />,
    },
    { label: "Compras", to: "/shopping", icon: <CopySlashIcon size={18} /> },
    { label: "Productos", to: "/products", icon: <Package size={18} /> },
    { label: "Clientes", to: "/customers", icon: <UserCheck size={18} /> },
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

  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  // Render de items del menú
  const renderNavItem = (
    item: (typeof navItems)[0],
    alwaysShowLabel = false,
  ) => {
    const active = pathname === item.to || pathname.startsWith(item.to + "/");

    return (
      <Link
        key={item.to}
        to={item.to}
        className={`
          flex items-center gap-3 p-3 rounded-lg transition-all duration-200
          justify-center text-white ${
            !open && !alwaysShowLabel ? "" : "justify-start"
          }
          ${
            active
              ? "bg-slate-600 text-white shadow"
              : "text-gray-700 hover:bg-gray-600"
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
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`hidden md:flex flex-col bg-[#222d32]  shadow-xl transition-all duration-300
          ${open ? "w-60" : "w-16"}`}
      >
        <div className="relative bg-[#222d32] flex items-center justify-around p-4 border-b">
          <h1
            className={`text-lg font-semibold text-white transition-opacity duration-300 ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            SGO VENTAS
          </h1>

          <button
            onClick={() => setOpen(!open)}
            className={`p-2 rounded hover:bg-gray-800 text-white transition-colors 
            ${!open ? "absolute right-2 top-1/2 -translate-y-1/2" : ""}`}
          >
            <Menu size={20} />
          </button>
        </div>

        {open && (
          <div className="px-3 mt-4 ">
            <input
              type="text"
              placeholder="Buscar módulo..."
              className="w-full px-3 py-2 text-sm border text-white rounded-md focus:outline-none focus:ring focus:ring-slate-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Navegación */}
        <nav className="mt-4 flex flex-col gap-1 px-2 flex-1 text-white bg-[#222d32]">
          {(search ? filteredItems : navItems).map((item) =>
            renderNavItem(item),
          )}
        </nav>

        <div className="p-4 border-t text-center text-gray-400 text-xs">
          {open && "© 2025 Mi Empresa"}
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#222d32]/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed z-50 top-0 left-0 h-full bg-[#222d32] shadow-xl text-white transition-transform duration-300 md:hidden
          ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } w-64 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b ">
          <h1 className="text-lg font-semibold text-white">Mi Sistema</h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

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
            renderNavItem(item, true),
          )}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-16 bg-[#96312a] shadow px-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded hover:bg-slate-500 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-semibold">Panel de Control</h2>
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white/20 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center font-semibold">
                {userInitial}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight text-white">
                <span className="text-sm font-semibold">
                  {user?.displayName ?? user?.username ?? "Usuario"}
                </span>
                <span className="text-[11px] text-slate-200">
                  {user?.role ?? "Sesión activa"}
                </span>
              </div>
              <ChevronDown size={16} className="text-white/80" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-lg bg-white text-slate-800 shadow-lg border border-slate-100 z-50">
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    navigate("/login", { replace: true });
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

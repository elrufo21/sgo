import { FormEvent, useState } from "react";
import { LogIn, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { useAuthStore } from "@/store/auth/auth.store";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!username.trim() || !password.trim()) {
      setFormError("Ingresa usuario y contraseña");
      return;
    }

    const success = await login({
      username: username.trim(),
      password: password.trim(),
    });

    if (success) {
      navigate(redirectTo, { replace: true });
    } else {
      setFormError(error ?? "No pudimos iniciar sesión, intenta nuevamente.");
    }
  };

  const message = formError ?? error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 border border-white/60">
        <div className="flex items-center gap-3">
          <div className="w-full">
            <h1 className="text-xl font-semibold text-slate-900 text-center">
              Inicia sesión
            </h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 mt-4 leading-relaxed">
          Usa las credenciales de tu cuenta. Ejemplo de prueba:
          <span className="font-semibold text-slate-900"> admin / admin</span>
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Usuario / Email
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition"
                placeholder="tu.usuario"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-10 top-2.5 text-slate-500 hover:text-slate-700 transition"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <ShieldCheck
                className="absolute right-3 top-3.5 text-slate-400"
                size={18}
              />
            </div>
          </div>

          {message && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white font-semibold py-3 shadow-lg hover:bg-slate-800 transition disabled:opacity-70"
          >
            <LogIn size={18} />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

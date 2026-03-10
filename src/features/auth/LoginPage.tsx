import { useState } from "react";
import { LogIn, ShieldCheck, Eye, EyeOff } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";

import { HookForm } from "@/components/forms/HookForm";
import { HookFormInput } from "@/components/forms/HookFormInput";
import { useAuthStore } from "@/store/auth/auth.store";

type LoginFormValues = {
  username: string;
  password: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const formMethods = useForm<LoginFormValues>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    const success = await login({
      username: values.username.trim(),
      password: values.password.trim(),
    });

    if (success) {
      navigate(redirectTo, { replace: true });
    } else {
      const latestError = useAuthStore.getState().error;
      setFormError(latestError ?? "No pudimos iniciar sesión, intenta nuevamente.");
    }
  };

  const message = formError ?? error;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.14) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/85 shadow-[0_20px_70px_rgba(2,6,23,0.65)] backdrop-blur-xl">
          <div className="grid md:grid-cols-[1.08fr_0.92fr]">
            <section className="relative min-h-[280px] md:min-h-[560px]">
              <img
                src="/logo.png"
                alt="Marca del sistema"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </section>

            <section className="flex items-center justify-center bg-slate-950/70 p-6 sm:p-8 md:p-10">
              <div className="mx-auto w-full max-w-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-100 ring-1 ring-slate-700/70">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-white">
                      Bienvenido
                    </h1>
                    <p className="text-xs text-slate-400">
                      Ingresa tus credenciales para continuar
                    </p>
                  </div>
                </div>

                <HookForm
                  methods={formMethods}
                  onSubmit={handleSubmit}
                  className="mt-6 space-y-1"
                >
                  <HookFormInput<LoginFormValues>
                    name="username"
                    label="Usuario / Email"
                    placeholder="tu.usuario"
                    autoComplete="username"
                    rules={{
                      required: "Ingresa usuario",
                      validate: (value) =>
                        value.trim().length > 0 || "Ingresa usuario",
                    }}
                  />

                  <HookFormInput<LoginFormValues>
                    name="password"
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    rules={{
                      required: "Ingresa contraseña",
                      validate: (value) =>
                        value.trim().length > 0 || "Ingresa contraseña",
                    }}
                    endAdornment={
                      <IconButton
                        type="button"
                        size="small"
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    }
                  />

                  {message && (
                    <div className="rounded-lg border border-red-900/70 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-3 font-semibold text-slate-900 shadow-lg shadow-black/25 transition hover:bg-white disabled:opacity-70"
                  >
                    <LogIn size={18} />
                    {loading ? "Ingresando..." : "Ingresar"}
                  </button>
                </HookForm>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

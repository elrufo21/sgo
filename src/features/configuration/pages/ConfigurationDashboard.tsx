import { FileBadge2 } from "lucide-react";
import { useNavigate } from "react-router";

export default function ConfigurationDashboard() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Facturación",
      desc: "Configura certificado digital y credenciales SOL.",
      icon: <FileBadge2 className="w-10 h-10 text-[#B23636]" />,
      route: "/configuration/billing",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Configuración</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            onClick={() => navigate(item.route)}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-xl"
          >
            <div className="flex items-center gap-4">
              {item.icon}
              <div>
                <h2 className="text-lg font-bold">{item.title}</h2>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


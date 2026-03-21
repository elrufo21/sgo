import {
  DollarSign,
  LucideDollarSign,
  NotebookPen,
  ReceiptText,
} from "lucide-react";
import { useNavigate } from "react-router";

const cards = [
  {
    title: "Punto de venta",
    desc: "Accede al POS para registrar ventas rápidas.",
    icon: <LucideDollarSign className="w-10 h-10 text-emerald-600" />,
    route: "/sales/pos",
  },
  {
    title: "Lista pedidos",
    desc: "Consulta el listado de pedidos.",
    icon: <NotebookPen className="w-10 h-10 text-amber-600" />,
    route: "/sales/order_notes",
  },
  {
    title: "Caja chica",
    desc: "Gestiona los movimientos de caja chica.",
    icon: <DollarSign className="w-10 h-10 text-blue-600" />,
    route: "/sales/small_cash",
  },
  {
    title: "Resumen de boletas",
    desc: "Visualiza y exporta boletas por rango de fechas.",
    icon: <ReceiptText className="w-10 h-10 text-violet-600" />,
    route: "/sales/boletas_summary",
  },
];

export default function SalesDashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Ventas</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.route)}
            className="cursor-pointer bg-white shadow-md rounded-xl p-6 hover:shadow-xl transition border border-gray-200"
          >
            <div className="flex items-center gap-4">
              {card.icon}
              <div>
                <h2 className="text-lg font-bold">{card.title}</h2>
                <p className="text-sm text-gray-600">{card.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

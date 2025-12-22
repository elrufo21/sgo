import type { ModuleListConfig } from "@/shared/config/listConfig";
import type { Holiday } from "@/types/maintenance";

export const holidaysListConfig: ModuleListConfig<Holiday> = {
  basePath: "/maintenance/holidays",
  columns: [
    { key: "fecha", header: "Fecha" },
    { key: "motivo", header: "Motivo" },
  ],
  idKey: "id",
  createLabel: "+ Añadir feriado",
  deleteMessage: "Seguro que deseas eliminar este feriado?",
};

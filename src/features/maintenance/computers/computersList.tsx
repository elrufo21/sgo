import { CrudList } from "@/components/ListView";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Computer, Area } from "@/types/maintenance";

const ComputerList = () => {
  const { computers, areas, fetchComputers, fetchAreas, deleteComputer } =
    useMaintenanceStore();

  const fetchData = () => {
    fetchComputers();
    fetchAreas(); // para tener el listado de Áreas
  };

  const computerColumns = [
    { key: "maquina", header: "Máquina" },
    { key: "registro", header: "Registro" },
    {
      key: "serieFactura",
      header: "Serie Factura",
      render: (row: Computer) => row.serieFactura || "-",
    },
    {
      key: "serieNc",
      header: "Serie NC",
      render: (row: Computer) => row.serieNc || "-",
    },
    {
      key: "serieBoleta",
      header: "Serie Boleta",
      render: (row: Computer) => row.serieBoleta || "-",
    },
    {
      key: "ticketera",
      header: "Ticketera",
      render: (row: Computer) => row.ticketera || "-",
    },
    {
      id: "area",
      header: "Área",
      render: (row: Computer) => {
        const area = areas.find((a: Area) => a.id === row.areaId);
        return area?.area || "-";
      },
    },
  ];

  return (
    <CrudList
      data={computers}
      fetchData={fetchData}
      deleteItem={deleteComputer}
      columns={computerColumns}
      basePath="/maintenance/computers"
      createLabel="+ Añadir computadora"
      deleteMessage="¿Estás seguro de eliminar esta computadora?"
    />
  );
};

export default ComputerList;

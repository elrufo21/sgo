export interface Product {
  id: number;
  categoria: string;
  codigo: string;
  nombre: string;
  unidadMedida: string;
  valorCritico: number;
  preCosto: number;
  preVenta: number;
  aplicaINV: "bien" | "servicio";
  cantidad: number;
  usuario: string;
  estado: "activo" | "inactivo" | "archivado";
}

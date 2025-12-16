export interface Product {
  id: number;
  idSubLinea?: number | null;
  categoria?: string;
  codigo: string;
  nombre: string;
  unidadMedida: string;
  valorCritico: number;
  preCosto: number;
  preVenta: number;
  preVentaB: number | string;
  aplicaINV: "bien" | "servicio";
  cantidad: number;
  usuario: string;
  estado: "activo" | "inactivo" | "archivado";
  images?: string[];
}

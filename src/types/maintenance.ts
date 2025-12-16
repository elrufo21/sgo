export interface Category {
  id?: string | number;
  idSubLinea?: number;
  nombreSublinea: string;
  codigoSunat: string;
  nombre?: string | null;
}

export interface Area {
  id: number;
  area: string;
}

export interface Computer {
  id: number;
  maquina: string;
  registro: string;
  serieFactura: string;
  serieNc: string;
  serieBoleta: string;
  ticketera: string;
  areaId: number;
}

export interface Provider {
  id: number;
  razon: string;
  ruc: string;
  contacto: string;
  celular: string;
  telefono: string;
  correo: string;
  direccion: string;
  estado: string;
}

export interface Category {
  id: number;
  category: string;
  sunatCode: string;
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

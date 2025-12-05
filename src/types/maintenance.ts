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
  brand: string;
  model: string;
  serialNumber: string;
  areaId: number;
}

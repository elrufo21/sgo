export interface Client {
  id: number;
  nombreRazon: string;
  ruc: string;
  dni: string;
  direccionFiscal: string;
  direccionDespacho: string;
  telefonoMovil: string;
  email: string;
  registradoPor: string;
  estado: "activo" | "inactivo";
}
export interface CuentaBancaria {
  entidadBancaria: string;
  moneda: string;
  tipoCuenta: string;
  numeroCuenta: string;
}

export interface Purchase {
  id: number;
  nombreRazon: string;
  ruc: string;
  contacto: string;
  celular: string;
  email: string;
  direccion: string;
  estado: "activo" | "inactivo";
  cuentasBancarias?: CuentaBancaria[];
}

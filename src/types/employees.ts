export interface Employee {
  id: number;

  company: string;
  area: string;

  code: string;
  password: string;

  nombres: string;
  apellidos: string;

  ruc: string;
  dni: string;

  direccion: string;
  fechaNacimiento: string;

  telefonoMovil: string;
  telefonoAsignado: string;

  correo: string;

  fechaIngreso: string;
  fechaBaja: string;

  estado: "activo" | "inactivo" | "suspendido";

  foto?: string | null;
}

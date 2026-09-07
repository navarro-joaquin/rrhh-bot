export interface Empleado {
  id: number;
  nombre_completo: string;
  telefono: string;
  contrato_vigente: {
    id: number;
    nro_item: string | null;
    tipo: string;
  } | null;
}

export interface Vacacion {
  gestion: number | null;
  dias_disponibles: number;
}

export interface ResumenVacaciones {
  data: Vacacion[];
  meta: { total_dias_disponibles: number };
}

export interface Compensacion {
  gestion: number | null;
  cantidad_horas: number;
  fecha_registro: string | null;
}

export interface ResumenCompensaciones {
  data: Compensacion[];
  meta: { total_horas_disponibles: number };
}

export interface SolicitudVacacion {
  id: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias_solicitados: number;
  estado: string;
}

export interface SolicitudCompensacion {
  id: number;
  fecha_compensacion: string | null;
  horas_solicitadas: number;
  estado: string;
}

export interface Lista<T> {
  data: T[];
}

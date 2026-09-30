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
  dias?: number;
  horas?: number;
  minutos?: number;
  texto?: string;
}

export interface ResumenVacaciones {
  data: Vacacion[];
  meta: {
    total_dias_disponibles: number;
    total_dias?: number;
    total_horas?: number;
    total_minutos?: number;
    total_texto?: string;
  };
}

export interface Compensacion {
  gestion: number | null;
  cantidad_horas: number;
  horas?: number;
  minutos?: number;
  texto?: string;
  fecha_registro: string | null;
}

export interface ResumenCompensaciones {
  data: Compensacion[];
  meta: {
    total_horas_disponibles: number;
    total_horas?: number;
    total_minutos?: number;
    total_texto?: string;
  };
}

export interface SolicitudVacacion {
  id: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias_solicitados: number;
  dias?: number;
  horas?: number;
  minutos?: number;
  texto?: string;
  estado: string;
}

export interface SolicitudCompensacion {
  id: number;
  fecha_compensacion: string | null;
  horas_solicitadas: number;
  horas?: number;
  minutos?: number;
  texto?: string;
  estado: string;
}

export interface Lista<T> {
  data: T[];
}

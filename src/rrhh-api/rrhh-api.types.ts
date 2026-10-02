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
  mes: number;
  cantidad_horas: number;
  horas?: number;
  minutos?: number;
  texto?: string;
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

export interface RegistroCompensacion {
  id: number;
  gestion: number | null;
  mes: number;
  fecha: string | null;
  tipo: string;
  horas: number;
  horas_desglose?: number;
  minutos?: number;
  texto?: string;
  descripcion: string | null;
}

export interface Lista<T> {
  data: T[];
}

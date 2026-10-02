import { Injectable } from '@nestjs/common';
import { EvolutionService } from '../evolution/evolution.service';
import { RrhhApiService } from '../rrhh-api/rrhh-api.service';
import {
  Empleado,
  SolicitudCompensacion,
  SolicitudVacacion,
} from '../rrhh-api/rrhh-api.types';

@Injectable()
export class BotService {
  constructor(
    private readonly rrhhApi: RrhhApiService,
    private readonly evolution: EvolutionService,
  ) {}

  async handle(telefono: string, mensaje: string): Promise<void> {
    const empleado = await this.rrhhApi.getEmpleadoPorTelefono(telefono);

    if (!empleado) {
      await this.evolution.sendText(
        telefono,
        'Tu número no está registrado en el sistema.\nContacta a Recursos Humanos',
      );

      return;
    }

    const respuesta = await this.processMessage(empleado, mensaje.trim());
    await this.evolution.sendText(telefono, respuesta);
  }

  private async processMessage(
    empleado: Empleado,
    mensaje: string,
  ): Promise<string> {
    switch (mensaje) {
      case '1':
        return this.showVacations(empleado.id);
      case '2':
        return this.showCompensations(empleado.id);
      case '3':
        return this.showVacationRequests(empleado.id);
      case '4':
        return this.showCompensationRequests(empleado.id);
      default:
        return this.showMenu(empleado);
    }
  }

  private showMenu(empleado: Empleado): string {
    const item = empleado.contrato_vigente?.nro_item ?? 'Sin ítem vigente';

    return (
      '*Bienvenido*\n' +
      `Nombre: ${empleado.nombre_completo}\n` +
      `Ítem: ${item}\n\n` +
      'Por favor, selecciona una opción:\n' +
      this.menuOptions()
    );
  }

  private async showVacations(empleadoId: number): Promise<string> {
    const vacaciones = await this.rrhhApi.getVacaciones(empleadoId);

    if (vacaciones.data.length === 0) {
      return `No tienes registros de vacaciones\n\n${this.otherOptions()}`;
    }

    const detalle = vacaciones.data
      .map(
        (vacacion) =>
          `* ${vacacion.gestion ?? 'Sin gestión'}: *${vacacion.texto ?? `${this.decimal(vacacion.dias_disponibles)} días`}*`,
      )
      .join('\n');

    const total =
      vacaciones.meta.total_texto ??
      `${this.decimal(vacaciones.meta.total_dias_disponibles)} días`;

    return (
      '*Vacaciones disponibles*\n\n' +
      `${detalle}\n` +
      '-----------------\n' +
      `Total: *${total}*\n\n` +
      this.otherOptions()
    );
  }

  private async showCompensations(empleadoId: number): Promise<string> {
    const compensaciones = await this.rrhhApi.getCompensaciones(empleadoId);
    const total =
      compensaciones.meta.total_texto ??
      `${this.decimal(compensaciones.meta.total_horas_disponibles)} hrs`;

    return (
      'Horas de compensación:\n\n' +
      `Horas disponibles: *${total}*\n\n` +
      this.otherOptions()
    );
  }

  private async showVacationRequests(empleadoId: number): Promise<string> {
    const solicitudes = await this.rrhhApi.getSolicitudesVacaciones(empleadoId);

    if (solicitudes.data.length === 0) {
      return `No tienes registros de solicitudes de vacaciones\n\n${this.otherOptions()}`;
    }

    const detalle = solicitudes.data
      .map((solicitud) => this.formatVacationRequest(solicitud))
      .join('\n');

    return `*Solicitudes de vacaciones*\n\n${detalle}\n\n${this.otherOptions()}`;
  }

  private async showCompensationRequests(empleadoId: number): Promise<string> {
    const solicitudes =
      await this.rrhhApi.getSolicitudesCompensaciones(empleadoId);

    if (solicitudes.data.length === 0) {
      return `No tienes registros de solicitudes de compensación\n\n${this.otherOptions()}`;
    }

    const detalle = solicitudes.data
      .map((solicitud) => this.formatCompensationRequest(solicitud))
      .join('\n');

    return `*Solicitudes de compensación*\n\n${detalle}\n\n${this.otherOptions()}`;
  }

  private formatVacationRequest(solicitud: SolicitudVacacion): string {
    const cantidad =
      solicitud.texto ?? `${this.decimal(solicitud.dias_solicitados)} días`;

    return (
      `* ${this.date(solicitud.fecha_inicio)} - ${this.date(solicitud.fecha_fin)}` +
      ` por ${cantidad}. Estado: ${solicitud.estado}.`
    );
  }

  private formatCompensationRequest(solicitud: SolicitudCompensacion): string {
    const cantidad =
      solicitud.texto ?? `${this.decimal(solicitud.horas_solicitadas)} horas`;

    return (
      `* ${this.date(solicitud.fecha_compensacion)} - ` +
      `${cantidad} solicitadas. ` +
      `Estado: ${solicitud.estado}.`
    );
  }

  private otherOptions(): string {
    return `Selecciona otra opción:\n${this.menuOptions()}`;
  }

  private menuOptions(): string {
    return (
      '1. Días de vacaciones\n' +
      '2. Horas de compensación\n' +
      '3. Vacaciones solicitadas\n' +
      '4. Compensaciones solicitadas'
    );
  }

  private decimal(value: number): string {
    return Number(value).toFixed(1);
  }

  private date(value: string | null): string {
    if (!value) {
      return 'Sin fecha';
    }

    const [year, month, day] = value.split('-');

    return year && month && day ? `${day}/${month}/${year}` : value;
  }
}

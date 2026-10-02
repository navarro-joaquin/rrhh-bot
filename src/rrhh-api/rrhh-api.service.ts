import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { BotTokenProviderService } from './bot-token-provider.service';
import {
  Empleado,
  Lista,
  RegistroCompensacion,
  ResumenCompensaciones,
  ResumenVacaciones,
  SolicitudVacacion,
} from './rrhh-api.types';

@Injectable()
export class RrhhApiService {
  constructor(
    private readonly config: AppConfigService,
    private readonly tokenProvider: BotTokenProviderService,
  ) {}

  async getEmpleadoPorTelefono(telefono: string): Promise<Empleado | null> {
    const response = await this.get<{ data: Empleado }>(
      `/empleados/por-telefono/${encodeURIComponent(telefono)}`,
      [404],
    );

    return response?.data ?? null;
  }

  getVacaciones(empleadoId: number): Promise<ResumenVacaciones> {
    return this.getRequired<ResumenVacaciones>(
      `/empleados/${empleadoId}/vacaciones`,
    );
  }

  getCompensaciones(empleadoId: number): Promise<ResumenCompensaciones> {
    return this.getRequired<ResumenCompensaciones>(
      `/empleados/${empleadoId}/compensaciones`,
    );
  }

  getSolicitudesVacaciones(
    empleadoId: number,
  ): Promise<Lista<SolicitudVacacion>> {
    return this.getRequired<Lista<SolicitudVacacion>>(
      `/empleados/${empleadoId}/solicitudes-vacaciones`,
    );
  }

  getRegistrosCompensaciones(
    empleadoId: number,
  ): Promise<Lista<RegistroCompensacion>> {
    return this.getRequired<Lista<RegistroCompensacion>>(
      `/empleados/${empleadoId}/registros-compensaciones`,
    );
  }

  private async getRequired<T>(path: string): Promise<T> {
    const response = await this.get<T>(path);

    if (response === null) {
      throw new Error(`La API de RR. HH. no devolvió datos para ${path}.`);
    }

    return response;
  }

  private async get<T>(
    path: string,
    nullableStatuses: number[] = [],
  ): Promise<T | null> {
    let token = await this.tokenProvider.getToken();
    let response = await this.request(path, token);

    if (response.status === 401) {
      token = await this.tokenProvider.getToken(true);
      response = await this.request(path, token);
    }

    if (nullableStatuses.includes(response.status)) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `La API de RR. HH. respondió con estado ${response.status}.`,
      );
    }

    const body: unknown = await response.json();

    return body as T;
  }

  private request(path: string, token: string): Promise<Response> {
    return fetch(`${this.config.rrhhApiUrl}/api/v1/bot${path}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(this.config.requestTimeoutMs),
    });
  }
}

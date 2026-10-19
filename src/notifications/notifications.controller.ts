import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { AppConfigService } from '../config/app-config.service';
import { NotificationsService } from './notifications.service';
import { NotificationResult, SendTextRequest } from './notifications.types';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly config: AppConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  @Post('text')
  @HttpCode(200)
  async sendText(
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
    @Headers('x-api-key') apiKey?: string,
  ): Promise<{ ok: true; result: NotificationResult }> {
    this.authorize(authorization, apiKey);

    const data = this.record(body);
    const request: SendTextRequest = {
      telefono: this.string(data, 'telefono'),
      mensaje: this.string(data, 'mensaje', 4096),
      idEvento: this.optionalString(data, 'id_evento'),
    };

    return { ok: true, result: await this.notifications.sendText(request) };
  }

  private authorize(authorization?: string, apiKey?: string): void {
    const expected = this.config.notificationsApiKey;

    if (!expected) {
      throw new ServiceUnavailableException(
        'La API de notificaciones no está habilitada.',
      );
    }

    const bearer = authorization?.replace(/^Bearer\s+/i, '');
    const valid = [bearer, apiKey].some(
      (candidate) => candidate && this.safeEqual(candidate, expected),
    );

    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }
  }

  private safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);

    return left.length === right.length && timingSafeEqual(left, right);
  }

  private record(body: unknown): Record<string, unknown> {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new BadRequestException('El cuerpo debe ser un objeto JSON.');
    }

    return body as Record<string, unknown>;
  }

  private string(
    data: Record<string, unknown>,
    field: string,
    maxLength = 50,
  ): string {
    const value = data[field];

    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`El campo ${field} es obligatorio.`);
    }

    if (value.length > maxLength) {
      throw new BadRequestException(`El campo ${field} es demasiado largo.`);
    }

    return value.trim();
  }

  private optionalString(
    data: Record<string, unknown>,
    field: string,
  ): string | undefined {
    return data[field] === undefined || data[field] === null
      ? undefined
      : this.string(data, field, 200);
  }
}

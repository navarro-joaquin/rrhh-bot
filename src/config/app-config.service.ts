import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  get rrhhApiUrl(): string {
    return this.required('RRHH_API_URL').replace(/\/+$/, '');
  }

  get rrhhBotClientSecret(): string {
    return this.required('RRHH_BOT_CLIENT_SECRET');
  }

  get evolutionApiUrl(): string {
    return this.required('EVOLUTION_API_URL').replace(/\/+$/, '');
  }

  get evolutionApiKey(): string {
    return this.required('EVOLUTION_API_KEY');
  }

  get evolutionInstance(): string {
    return this.required('EVOLUTION_INSTANCE');
  }

  get webhookSecret(): string | undefined {
    return process.env.WEBHOOK_SECRET?.trim() || undefined;
  }

  get requestTimeoutMs(): number {
    const configuredValue = Number(process.env.REQUEST_TIMEOUT_MS ?? 10000);

    return Number.isFinite(configuredValue) && configuredValue > 0
      ? configuredValue
      : 10000;
  }

  private required(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
      throw new Error(`La variable de entorno ${name} es obligatoria.`);
    }

    return value;
  }
}

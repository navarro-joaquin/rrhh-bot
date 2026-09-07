import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class EvolutionService {
  constructor(private readonly config: AppConfigService) {}

  async sendText(to: string, message: string): Promise<void> {
    const instance = encodeURIComponent(this.config.evolutionInstance);
    const number = this.normalizeNumber(to);
    const response = await fetch(
      `${this.config.evolutionApiUrl}/message/sendText/${instance}`,
      {
        method: 'POST',
        headers: {
          apikey: this.config.evolutionApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number, text: message }),
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      },
    );

    if (!response.ok) {
      throw new Error(`Evolution API respondió con estado ${response.status}.`);
    }
  }

  private normalizeNumber(value: string): string {
    const jidUser = value.split('@', 1)[0].split(':', 1)[0];
    const number = jidUser.replace(/\D+/g, '');

    if (!number) {
      throw new Error('No se pudo obtener un número válido del destinatario.');
    }

    return number;
  }
}

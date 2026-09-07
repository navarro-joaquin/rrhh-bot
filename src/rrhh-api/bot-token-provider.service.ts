import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

@Injectable()
export class BotTokenProviderService {
  private cachedToken?: CachedToken;
  private refreshPromise?: Promise<string>;
  private readonly expirationMarginMs = 60 * 1000;

  constructor(private readonly config: AppConfigService) {}

  async getToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.hasValidToken()) {
      return this.cachedToken!.accessToken;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshPromise = this.requestToken();
    this.refreshPromise = refreshPromise;

    try {
      return await refreshPromise;
    } finally {
      if (this.refreshPromise === refreshPromise) {
        this.refreshPromise = undefined;
      }
    }
  }

  private hasValidToken(): boolean {
    return Boolean(
      this.cachedToken &&
      this.cachedToken.expiresAt - this.expirationMarginMs > Date.now(),
    );
  }

  private async requestToken(): Promise<string> {
    const response = await fetch(
      `${this.config.rrhhApiUrl}/api/v1/bot/auth/token`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Bot-Client-Secret': this.config.rrhhBotClientSecret,
        },
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      },
    );

    if (!response.ok) {
      throw new Error(
        `No se pudo renovar el token del bot; Laravel respondió con estado ${response.status}.`,
      );
    }

    const body: unknown = await response.json();
    const token = this.parseToken(body);
    this.cachedToken = token;

    return token.accessToken;
  }

  private parseToken(body: unknown): CachedToken {
    if (!this.isRecord(body) || !this.isRecord(body.data)) {
      throw new Error(
        'Laravel devolvió una respuesta inválida al emitir el token.',
      );
    }

    const accessToken = body.data.access_token;
    const expiresAtValue = body.data.expires_at;

    if (typeof accessToken !== 'string' || typeof expiresAtValue !== 'string') {
      throw new Error('Laravel devolvió un token incompleto.');
    }

    const expiresAt = Date.parse(expiresAtValue);

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      throw new Error('Laravel devolvió una expiración de token inválida.');
    }

    return { accessToken, expiresAt };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}

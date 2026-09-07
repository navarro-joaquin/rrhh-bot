import { Injectable, Logger } from '@nestjs/common';
import { BotService } from '../bot/bot.service';
import { MessageDeduplicatorService } from './message-deduplicator.service';

export type WebhookResult = 'processed' | 'duplicate' | 'ignored';

@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  constructor(
    private readonly bot: BotService,
    private readonly deduplicator: MessageDeduplicatorService,
  ) {}

  async handle(payload: unknown): Promise<WebhookResult> {
    if (!this.isRecord(payload) || payload.event !== 'messages.upsert') {
      return 'ignored';
    }

    const data = payload.data;

    if (!this.isRecord(data) || !this.isRecord(data.key)) {
      return 'ignored';
    }

    const key = data.key;

    if (key.fromMe === true) {
      return 'ignored';
    }

    const telefono = this.firstString(key.remoteJidAlt, key.remoteJid);

    if (!telefono || telefono.includes('@g.us')) {
      return 'ignored';
    }

    const mensaje = this.extractText(data.message);

    if (!mensaje) {
      return 'ignored';
    }

    const messageId = typeof key.id === 'string' ? key.id : undefined;

    if (!messageId) {
      await this.bot.handle(telefono, mensaje);
      this.logger.log('Mensaje de WhatsApp procesado sin identificador.');

      return 'processed';
    }

    const processed = await this.deduplicator.runOnce(messageId, () =>
      this.bot.handle(telefono, mensaje),
    );

    this.logger.log(
      processed
        ? `Mensaje de WhatsApp procesado: ${messageId}`
        : `Mensaje duplicado ignorado: ${messageId}`,
    );

    return processed ? 'processed' : 'duplicate';
  }

  private extractText(message: unknown): string | undefined {
    if (!this.isRecord(message)) {
      return undefined;
    }

    if (typeof message.conversation === 'string') {
      return message.conversation;
    }

    const extended = message.extendedTextMessage;

    return this.isRecord(extended) && typeof extended.text === 'string'
      ? extended.text
      : undefined;
  }

  private firstString(...values: unknown[]): string | undefined {
    return values.find((value): value is string => typeof value === 'string');
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}

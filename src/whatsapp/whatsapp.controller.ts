import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import {
  WebhookResult,
  WhatsappWebhookService,
} from './whatsapp-webhook.service';

@Controller('webhook/whatsapp')
export class WhatsappController {
  constructor(
    private readonly config: AppConfigService,
    private readonly webhook: WhatsappWebhookService,
  ) {}

  @Post('messages-upsert')
  @HttpCode(200)
  async handle(
    @Body() payload: unknown,
    @Headers('apikey') apiKey?: string,
    @Headers('x-webhook-secret') webhookSecret?: string,
  ): Promise<{ ok: true; result: WebhookResult }> {
    this.authorize(apiKey, webhookSecret);

    return {
      ok: true,
      result: await this.webhook.handle(payload),
    };
  }

  private authorize(apiKey?: string, webhookSecret?: string): void {
    const expectedSecret = this.config.webhookSecret;

    if (
      expectedSecret &&
      apiKey !== expectedSecret &&
      webhookSecret !== expectedSecret
    ) {
      throw new UnauthorizedException('Webhook no autorizado.');
    }
  }
}

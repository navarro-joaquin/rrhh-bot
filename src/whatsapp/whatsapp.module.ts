import { Module } from '@nestjs/common';
import { BotModule } from '../bot/bot.module';
import { MessageDeduplicatorService } from './message-deduplicator.service';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { WhatsappController } from './whatsapp.controller';

@Module({
  imports: [BotModule],
  controllers: [WhatsappController],
  providers: [WhatsappWebhookService, MessageDeduplicatorService],
})
export class WhatsappModule {}

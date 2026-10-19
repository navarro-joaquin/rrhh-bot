import { Module } from '@nestjs/common';
import { EvolutionModule } from '../evolution/evolution.module';
import { MessageDeduplicatorService } from '../whatsapp/message-deduplicator.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [EvolutionModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, MessageDeduplicatorService],
})
export class NotificationsModule {}

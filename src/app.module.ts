import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { ConfigModule } from './config/config.module';
import { EvolutionModule } from './evolution/evolution.module';
import { RrhhApiModule } from './rrhh-api/rrhh-api.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule,
    RrhhApiModule,
    EvolutionModule,
    BotModule,
    WhatsappModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

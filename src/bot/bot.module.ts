import { Module } from '@nestjs/common';
import { EvolutionModule } from '../evolution/evolution.module';
import { RrhhApiModule } from '../rrhh-api/rrhh-api.module';
import { BotService } from './bot.service';

@Module({
  imports: [RrhhApiModule, EvolutionModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}

import { Module } from '@nestjs/common';
import { BotTokenProviderService } from './bot-token-provider.service';
import { RrhhApiService } from './rrhh-api.service';

@Module({
  providers: [RrhhApiService, BotTokenProviderService],
  exports: [RrhhApiService],
})
export class RrhhApiModule {}

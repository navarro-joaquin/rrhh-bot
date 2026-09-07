import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): { service: string; status: string } {
    return {
      service: 'rrhh-bot',
      status: 'ok',
    };
  }
}

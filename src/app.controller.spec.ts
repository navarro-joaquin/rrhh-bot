import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('estado del servicio', () => {
    it('indica que el bot está disponible', () => {
      expect(appController.getStatus()).toEqual({
        service: 'rrhh-bot',
        status: 'ok',
      });
    });
  });
});

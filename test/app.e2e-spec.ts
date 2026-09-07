import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { BotService } from './../src/bot/bot.service';
import { AppConfigService } from './../src/config/app-config.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const bot = { handle: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BotService)
      .useValue(bot)
      .overrideProvider(AppConfigService)
      .useValue({ webhookSecret: undefined })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ service: 'rrhh-bot', status: 'ok' });
  });

  it('/webhook/whatsapp/messages-upsert (POST)', async () => {
    bot.handle.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/webhook/whatsapp/messages-upsert')
      .send({
        event: 'messages.upsert',
        data: {
          key: {
            id: 'MESSAGE-1',
            fromMe: false,
            remoteJid: '59170001001@s.whatsapp.net',
          },
          message: { conversation: '1' },
        },
      })
      .expect(200)
      .expect({ ok: true, result: 'processed' });

    expect(bot.handle).toHaveBeenCalledWith('59170001001@s.whatsapp.net', '1');
  });

  afterEach(async () => {
    await app.close();
  });
});

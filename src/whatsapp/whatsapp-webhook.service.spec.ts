import { BotService } from '../bot/bot.service';
import { MessageDeduplicatorService } from './message-deduplicator.service';
import { WhatsappWebhookService } from './whatsapp-webhook.service';

describe('WhatsappWebhookService', () => {
  const bot = { handle: jest.fn() };
  let service: WhatsappWebhookService;

  beforeEach(() => {
    jest.resetAllMocks();
    bot.handle.mockResolvedValue(undefined);
    service = new WhatsappWebhookService(
      bot as unknown as BotService,
      new MessageDeduplicatorService(),
    );
  });

  it('ignora eventos distintos, mensajes propios y grupos', async () => {
    await expect(service.handle({ event: 'connection.update' })).resolves.toBe(
      'ignored',
    );
    await expect(
      service.handle({
        event: 'messages.upsert',
        data: {
          key: { fromMe: true, remoteJid: '59170001001@s.whatsapp.net' },
          message: { conversation: 'hola' },
        },
      }),
    ).resolves.toBe('ignored');
    await expect(
      service.handle({
        event: 'messages.upsert',
        data: {
          key: { fromMe: false, remoteJid: '123@g.us' },
          message: { conversation: 'hola' },
        },
      }),
    ).resolves.toBe('ignored');

    expect(bot.handle).not.toHaveBeenCalled();
  });

  it('procesa mensajes de texto extendido y prioriza remoteJidAlt', async () => {
    await expect(
      service.handle({
        event: 'messages.upsert',
        data: {
          key: {
            id: 'MESSAGE-2',
            fromMe: false,
            remoteJidAlt: '59170001001@s.whatsapp.net',
            remoteJid: 'internal-id@s.whatsapp.net',
          },
          message: { extendedTextMessage: { text: ' 2 ' } },
        },
      }),
    ).resolves.toBe('processed');

    expect(bot.handle).toHaveBeenCalledWith(
      '59170001001@s.whatsapp.net',
      ' 2 ',
    );
  });

  it('ignora un mensaje repetido después de procesarlo correctamente', async () => {
    const payload = {
      event: 'messages.upsert',
      data: {
        key: {
          id: 'MESSAGE-3',
          fromMe: false,
          remoteJid: '59170001001@s.whatsapp.net',
        },
        message: { conversation: '1' },
      },
    };

    await expect(service.handle(payload)).resolves.toBe('processed');
    await expect(service.handle(payload)).resolves.toBe('duplicate');
    expect(bot.handle).toHaveBeenCalledTimes(1);
  });
});

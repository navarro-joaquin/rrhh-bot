import { BadGatewayException } from '@nestjs/common';
import { EvolutionService } from '../evolution/evolution.service';
import { MessageDeduplicatorService } from '../whatsapp/message-deduplicator.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let sendText: jest.Mock;
  let service: NotificationsService;

  beforeEach(() => {
    sendText = jest.fn().mockResolvedValue(undefined);
    service = new NotificationsService(
      { sendText } as unknown as EvolutionService,
      new MessageDeduplicatorService(),
    );
  });

  it('envía el mensaje tal cual al destinatario', async () => {
    await expect(
      service.sendText({ telefono: '59173432404', mensaje: 'Hola' }),
    ).resolves.toBe('sent');
    expect(sendText).toHaveBeenCalledWith('59173432404', 'Hola');
  });

  it('no reenvía un evento con el mismo id_evento', async () => {
    const request = { telefono: '591700', mensaje: 'Hola', idEvento: 'e1' };

    await expect(service.sendText(request)).resolves.toBe('sent');
    await expect(service.sendText(request)).resolves.toBe('duplicate');
    expect(sendText).toHaveBeenCalledTimes(1);
  });

  it('responde 502 si Evolution falla y permite reintentar', async () => {
    sendText.mockRejectedValueOnce(new Error('caído'));
    const request = { telefono: '591700', mensaje: 'Hola', idEvento: 'e2' };

    await expect(service.sendText(request)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    await expect(service.sendText(request)).resolves.toBe('sent');
  });
});

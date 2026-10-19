import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { EvolutionService } from '../evolution/evolution.service';
import { MessageDeduplicatorService } from '../whatsapp/message-deduplicator.service';
import { NotificationResult, SendTextRequest } from './notifications.types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly evolution: EvolutionService,
    private readonly deduplicator: MessageDeduplicatorService,
  ) {}

  sendText(request: SendTextRequest): Promise<NotificationResult> {
    return this.deliver(request.telefono, request.mensaje, request.idEvento);
  }

  private async deliver(
    telefono: string,
    mensaje: string,
    idEvento?: string,
  ): Promise<NotificationResult> {
    const send = async () => {
      try {
        await this.evolution.sendText(telefono, mensaje);
      } catch (error) {
        this.logger.error(
          `No se pudo enviar el mensaje: ${error instanceof Error ? error.message : String(error)}`,
        );

        throw new BadGatewayException('No se pudo enviar el mensaje.');
      }
    };

    if (!idEvento) {
      await send();

      return 'sent';
    }

    const sent = await this.deduplicator.runOnce(`notif:${idEvento}`, send);

    return sent ? 'sent' : 'duplicate';
  }
}

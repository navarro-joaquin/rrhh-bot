export interface SendTextRequest {
  telefono: string;
  mensaje: string;
  idEvento?: string;
}

export type NotificationResult = 'sent' | 'duplicate';

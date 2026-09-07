import { Injectable } from '@nestjs/common';

@Injectable()
export class MessageDeduplicatorService {
  private readonly processed = new Map<string, number>();
  private readonly processing = new Set<string>();
  private readonly retentionMs = 10 * 60 * 1000;

  async runOnce(
    messageId: string,
    action: () => Promise<void>,
  ): Promise<boolean> {
    this.removeExpired();

    if (this.processing.has(messageId) || this.processed.has(messageId)) {
      return false;
    }

    this.processing.add(messageId);

    try {
      await action();
      this.processed.set(messageId, Date.now() + this.retentionMs);

      return true;
    } finally {
      this.processing.delete(messageId);
    }
  }

  private removeExpired(): void {
    const now = Date.now();

    for (const [messageId, expiresAt] of this.processed) {
      if (expiresAt <= now) {
        this.processed.delete(messageId);
      }
    }
  }
}

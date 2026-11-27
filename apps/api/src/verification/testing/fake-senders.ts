import { CodeSender } from '../verification.types';

export interface SentCode {
  userId: string;
  destination: string;
  code: string;
  expiresInMinutes: number;
}

/**
 * Fake mail or SMS adapter for tests. Records every code it "sends" so tests
 * can read it back. Nothing leaves the process.
 */
export class FakeCodeSender implements CodeSender {
  readonly sent: SentCode[] = [];
  /** When true, the next send resolves false, as a provider rejection would. */
  failNext = false;

  async sendCode(input: SentCode): Promise<boolean> {
    if (this.failNext) {
      this.failNext = false;
      return false;
    }
    this.sent.push({ ...input });
    return true;
  }

  lastCode(): string {
    const last = this.sent[this.sent.length - 1];
    if (!last) throw new Error('FakeCodeSender: no code has been sent');
    return last.code;
  }
}

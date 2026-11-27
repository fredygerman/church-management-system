import {
  CompleteChangeResult,
  MAX_ATTEMPTS,
  NewVerificationRow,
  VerificationChannel,
  VerificationRow,
  VerificationStore,
  VerificationUser,
} from '../verification.types';

/** Test double for VerificationStore. Mirrors the Drizzle store's conditional-update semantics. */
export class InMemoryVerificationStore implements VerificationStore {
  readonly users = new Map<string, VerificationUser>();
  readonly rows: VerificationRow[] = [];
  private sequence = 0;

  addUser(user: VerificationUser): void {
    this.users.set(user.id, { ...user });
  }

  async findActiveUser(userId: string): Promise<VerificationUser | null> {
    const user = this.users.get(userId);
    return user ? { ...user } : null;
  }

  async isEmailTakenByOther(email: string, userId: string): Promise<boolean> {
    return [...this.users.values()].some(
      (user) => user.id !== userId && user.email.toLowerCase() === email,
    );
  }

  async isPhoneTakenByOther(phoneE164: string, userId: string): Promise<boolean> {
    return [...this.users.values()].some(
      (user) => user.id !== userId && user.phoneE164 === phoneE164,
    );
  }

  async latestVerification(
    userId: string,
    channel: VerificationChannel,
  ): Promise<VerificationRow | null> {
    const matches = this.rows
      .filter((row) => row.userId === userId && row.channel === channel)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return matches[0] ? { ...matches[0] } : null;
  }

  async countSendsSince(
    scope:
      | { userId: string; channel: VerificationChannel }
      | { channel: VerificationChannel; destination: string },
    since: Date,
  ): Promise<number> {
    return this.rows.filter((row) => {
      if (row.createdAt < since || row.channel !== scope.channel) return false;
      return 'userId' in scope ? row.userId === scope.userId : row.destination === scope.destination;
    }).length;
  }

  async invalidateOpen(userId: string, channel: VerificationChannel, now: Date): Promise<void> {
    for (const row of this.rows) {
      if (row.userId === userId && row.channel === channel && !row.consumedAt) {
        row.consumedAt = now;
      }
    }
  }

  async insert(row: NewVerificationRow): Promise<string> {
    this.sequence += 1;
    const id = `verification-${this.sequence}`;
    this.rows.push({
      id,
      userId: row.userId,
      channel: row.channel,
      destination: row.destination,
      codeHmac: row.codeHmac,
      purpose: row.purpose,
      attempts: 0,
      expiresAt: row.expiresAt,
      consumedAt: null,
      createdAt: row.createdAt,
    });
    return id;
  }

  async invalidate(id: string, now: Date): Promise<void> {
    const row = this.find(id);
    if (row && !row.consumedAt) row.consumedAt = now;
  }

  async incrementAttempts(id: string, now: Date): Promise<number | null> {
    const row = this.find(id);
    if (!row || row.consumedAt || row.expiresAt <= now || row.attempts >= MAX_ATTEMPTS) {
      return null;
    }
    row.attempts += 1;
    return row.attempts;
  }

  async completeEmailChange(input: {
    userId: string;
    verificationId: string;
    email: string;
    now: Date;
  }): Promise<CompleteChangeResult> {
    const row = this.find(input.verificationId);
    if (!row || row.consumedAt || row.expiresAt <= input.now) return 'consumed';
    if (await this.isEmailTakenByOther(input.email, input.userId)) return 'taken';
    row.consumedAt = input.now;
    const user = this.users.get(input.userId);
    if (user) {
      user.email = input.email;
      user.emailVerifiedAt = input.now;
    }
    return 'ok';
  }

  async completePhoneChange(input: {
    userId: string;
    verificationId: string;
    phoneE164: string;
    now: Date;
  }): Promise<CompleteChangeResult> {
    const row = this.find(input.verificationId);
    if (!row || row.consumedAt || row.expiresAt <= input.now) return 'consumed';
    if (await this.isPhoneTakenByOther(input.phoneE164, input.userId)) return 'taken';
    row.consumedAt = input.now;
    const user = this.users.get(input.userId);
    if (user) {
      user.phoneE164 = input.phoneE164;
      user.phoneVerifiedAt = input.now;
    }
    return 'ok';
  }

  private find(id: string): VerificationRow | undefined {
    return this.rows.find((row) => row.id === id);
  }
}

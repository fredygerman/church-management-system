import { Injectable, OnModuleInit } from '@nestjs/common';
import { and, count, desc, eq, gt, gte, isNull, lt, ne, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { contactVerifications, users } from '../database/schema';
import { Database } from '../database/interfaces/database.interfaces';
import {
  CompleteChangeResult,
  MAX_ATTEMPTS,
  NewVerificationRow,
  VerificationChannel,
  VerificationRow,
  VerificationStore,
  VerificationUser,
} from './verification.types';

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Drizzle-backed store. Every state change that must be race-free is one
 * conditional UPDATE, so concurrent guesses cannot exceed MAX_ATTEMPTS and a
 * code cannot be consumed twice.
 */
@Injectable()
export class DrizzleVerificationStore implements VerificationStore, OnModuleInit {
  private db!: Database;

  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit() {
    this.db = await this.databaseService.getDatabase();
  }

  async findActiveUser(userId: string): Promise<VerificationUser | null> {
    const [row] = await this.db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        phoneE164: users.phoneE164,
        emailVerifiedAt: users.emailVerifiedAt,
        phoneVerifiedAt: users.phoneVerifiedAt,
      })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  // Deleted accounts still hold their unique email, so they count as taken.
  async isEmailTakenByOther(email: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(sql`lower(${users.email}) = ${email}`, ne(users.id, userId)))
      .limit(1);
    return Boolean(row);
  }

  async isPhoneTakenByOther(phoneE164: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.phoneE164, phoneE164), ne(users.id, userId)))
      .limit(1);
    return Boolean(row);
  }

  async latestVerification(
    userId: string,
    channel: VerificationChannel,
  ): Promise<VerificationRow | null> {
    const [row] = await this.db
      .select()
      .from(contactVerifications)
      .where(
        and(
          eq(contactVerifications.userId, userId),
          eq(contactVerifications.channel, channel),
        ),
      )
      .orderBy(desc(contactVerifications.createdAt))
      .limit(1);
    return row ?? null;
  }

  async countSendsSince(
    scope:
      | { userId: string; channel: VerificationChannel }
      | { channel: VerificationChannel; destination: string },
    since: Date,
  ): Promise<number> {
    const scopeFilter =
      'userId' in scope
        ? and(
            eq(contactVerifications.userId, scope.userId),
            eq(contactVerifications.channel, scope.channel),
          )
        : and(
            eq(contactVerifications.channel, scope.channel),
            eq(contactVerifications.destination, scope.destination),
          );
    const [result] = await this.db
      .select({ total: count() })
      .from(contactVerifications)
      .where(and(scopeFilter, gte(contactVerifications.createdAt, since)));
    return Number(result?.total ?? 0);
  }

  async invalidateOpen(
    userId: string,
    channel: VerificationChannel,
    now: Date,
  ): Promise<void> {
    await this.db
      .update(contactVerifications)
      .set({ consumedAt: now })
      .where(
        and(
          eq(contactVerifications.userId, userId),
          eq(contactVerifications.channel, channel),
          isNull(contactVerifications.consumedAt),
        ),
      );
  }

  async insert(row: NewVerificationRow): Promise<string> {
    const [created] = await this.db
      .insert(contactVerifications)
      .values({
        userId: row.userId,
        channel: row.channel,
        destination: row.destination,
        codeHmac: row.codeHmac,
        purpose: row.purpose,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
      })
      .returning({ id: contactVerifications.id });
    return created.id;
  }

  async invalidate(id: string, now: Date): Promise<void> {
    await this.db
      .update(contactVerifications)
      .set({ consumedAt: now })
      .where(and(eq(contactVerifications.id, id), isNull(contactVerifications.consumedAt)));
  }

  async incrementAttempts(id: string, now: Date): Promise<number | null> {
    const [updated] = await this.db
      .update(contactVerifications)
      .set({ attempts: sql`${contactVerifications.attempts} + 1` })
      .where(
        and(
          eq(contactVerifications.id, id),
          isNull(contactVerifications.consumedAt),
          gt(contactVerifications.expiresAt, now),
          lt(contactVerifications.attempts, MAX_ATTEMPTS),
        ),
      )
      .returning({ attempts: contactVerifications.attempts });
    return updated ? updated.attempts : null;
  }

  async completeEmailChange(input: {
    userId: string;
    verificationId: string;
    email: string;
    now: Date;
  }): Promise<CompleteChangeResult> {
    return this.completeChange(input, async (tx) => {
      await tx
        .update(users)
        .set({ email: input.email, emailVerifiedAt: input.now })
        .where(eq(users.id, input.userId));
    });
  }

  async completePhoneChange(input: {
    userId: string;
    verificationId: string;
    phoneE164: string;
    now: Date;
  }): Promise<CompleteChangeResult> {
    return this.completeChange(input, async (tx) => {
      await tx
        .update(users)
        .set({ phoneE164: input.phoneE164, phoneVerifiedAt: input.now })
        .where(eq(users.id, input.userId));
    });
  }

  /** Consumes the code and applies the change in one transaction; a unique clash rolls both back. */
  private async completeChange(
    input: { userId: string; verificationId: string; now: Date },
    apply: (tx: Transaction) => Promise<void>,
  ): Promise<CompleteChangeResult> {
    try {
      return await this.db.transaction(async (tx) => {
        const consumed = await tx
          .update(contactVerifications)
          .set({ consumedAt: input.now })
          .where(
            and(
              eq(contactVerifications.id, input.verificationId),
              eq(contactVerifications.userId, input.userId),
              isNull(contactVerifications.consumedAt),
              gt(contactVerifications.expiresAt, input.now),
            ),
          )
          .returning({ id: contactVerifications.id });

        if (consumed.length === 0) {
          return 'consumed' as const;
        }

        await apply(tx);
        return 'ok' as const;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return 'taken';
      }
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  const direct = (error as { code?: string } | null)?.code;
  const wrapped = (error as { cause?: { code?: string } } | null)?.cause?.code;
  return (direct ?? wrapped) === '23505';
}

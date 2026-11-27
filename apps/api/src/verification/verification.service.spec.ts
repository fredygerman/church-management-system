import { HttpException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { VerificationService } from './verification.service';
import { InMemoryVerificationStore } from './testing/in-memory-store';
import { FakeCodeSender } from './testing/fake-senders';
import { hashCode, PLACEHOLDER_SECRET } from './verification.crypto';
import {
  CODE_TTL_MS,
  DAY_MS,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_MS,
  VerificationOptions,
  VerificationUser,
} from './verification.types';

const SECRET = 'service-test-secret-long-enough-for-production-1234';
const USER_ID = 'user-1';
const OTHER_ID = 'user-2';
const PASSWORD = 'correct-horse-battery';

function baseUser(overrides: Partial<VerificationUser> = {}): VerificationUser {
  return {
    id: USER_ID,
    email: 'member@example.org',
    passwordHash: null,
    phoneE164: null,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    ...overrides,
  };
}

async function expectFailure(
  promise: Promise<unknown>,
  status: number,
  code: string,
): Promise<HttpException> {
  const error = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(HttpException);
  const httpError = error as HttpException;
  expect(httpError.getStatus()).toBe(status);
  expect(httpError.getResponse()).toMatchObject({ code });
  return httpError;
}

describe('VerificationService', () => {
  let now: Date;
  let store: InMemoryVerificationStore;
  let mail: FakeCodeSender;
  let sms: FakeCodeSender;
  let options: VerificationOptions;
  let service: VerificationService;
  let loggerSpies: jest.SpyInstance[];

  const advance = (ms: number) => {
    now = new Date(now.getTime() + ms);
  };

  beforeEach(() => {
    now = new Date('2026-11-27T10:00:00.000Z');
    store = new InMemoryVerificationStore();
    mail = new FakeCodeSender();
    sms = new FakeCodeSender();
    options = { hmacSecret: SECRET, isProduction: false, clock: () => now };
    store.addUser(baseUser());
    service = new VerificationService(store, mail, sms, options);

    loggerSpies = (['log', 'warn', 'error', 'debug', 'verbose'] as const).map((method) =>
      jest.spyOn(Logger.prototype, method).mockImplementation(() => undefined),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('email start', () => {
    it('sends the code to the lower-cased new address and returns a 10-minute expiry', async () => {
      const result = await service.startEmail(USER_ID, {
        email: '  New.Member@Example.ORG ',
        purpose: 'change',
      });

      expect(mail.sent).toHaveLength(1);
      expect(mail.sent[0].destination).toBe('new.member@example.org');
      expect(result).toEqual({
        status: 'sent',
        expiresAt: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
      });
      expect(store.users.get(USER_ID).email).toBe('member@example.org');
    });

    it('stores only an HMAC of the code, bound to channel and destination', async () => {
      await service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' });
      const code = mail.lastCode();

      expect(store.rows).toHaveLength(1);
      expect(store.rows[0].codeHmac).toBe(
        hashCode(SECRET, 'email', 'new@example.org', code),
      );
      expect(store.rows[0].codeHmac).not.toBe(code);
      expect(JSON.stringify(store.rows)).not.toContain(code);
    });

    it('allows signup purpose on the account’s own address', async () => {
      await expect(
        service.startEmail(USER_ID, { email: 'member@example.org', purpose: 'signup' }),
      ).resolves.toMatchObject({ status: 'sent' });
    });

    it('rejects a change to the same address with EMAIL_UNCHANGED', async () => {
      await expectFailure(
        service.startEmail(USER_ID, { email: 'MEMBER@example.org', purpose: 'change' }),
        400,
        'EMAIL_UNCHANGED',
      );
    });

    it('lets a passwordless account change email without a password', async () => {
      await expect(
        service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' }),
      ).resolves.toMatchObject({ status: 'sent' });
    });

    it('requires the current password for password accounts', async () => {
      store.addUser(baseUser({ passwordHash: bcrypt.hashSync(PASSWORD, 4) }));

      await expectFailure(
        service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' }),
        403,
        'PASSWORD_REQUIRED',
      );
      await expectFailure(
        service.startEmail(USER_ID, {
          email: 'new@example.org',
          purpose: 'change',
          currentPassword: 'wrong-password',
        }),
        403,
        'INVALID_PASSWORD',
      );
      expect(mail.sent).toHaveLength(0);

      await expect(
        service.startEmail(USER_ID, {
          email: 'new@example.org',
          purpose: 'change',
          currentPassword: PASSWORD,
        }),
      ).resolves.toMatchObject({ status: 'sent' });
    });

    it('returns 409 EMAIL_IN_USE when another user holds the address, ignoring case', async () => {
      store.addUser({ ...baseUser({ id: OTHER_ID, email: 'Taken@Example.org' }) });

      await expectFailure(
        service.startEmail(USER_ID, { email: 'taken@example.org', purpose: 'change' }),
        409,
        'EMAIL_IN_USE',
      );
      expect(mail.sent).toHaveLength(0);
    });

    it('enforces a 60-second resend cooldown with RESEND_COOLDOWN', async () => {
      await service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' });

      const error = await expectFailure(
        service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' }),
        429,
        'RESEND_COOLDOWN',
      );
      expect(error.getResponse()).toMatchObject({ retryAfterSeconds: 60 });

      advance(RESEND_COOLDOWN_MS);
      await expect(
        service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' }),
      ).resolves.toMatchObject({ status: 'sent' });
    });

    it('caps sends at 5 per user per day, then frees the slot after 24 hours', async () => {
      for (let i = 0; i < 5; i += 1) {
        await service.startEmail(USER_ID, { email: `n${i}@example.org`, purpose: 'change' });
        advance(RESEND_COOLDOWN_MS);
      }

      await expectFailure(
        service.startEmail(USER_ID, { email: 'n6@example.org', purpose: 'change' }),
        429,
        'TOO_MANY_REQUESTS',
      );

      advance(DAY_MS);
      await expect(
        service.startEmail(USER_ID, { email: 'n7@example.org', purpose: 'change' }),
      ).resolves.toMatchObject({ status: 'sent' });
    });

    it('caps sends at 5 per destination per day across users', async () => {
      store.addUser(baseUser({ id: OTHER_ID, email: 'other@example.org' }));
      for (let i = 0; i < 5; i += 1) {
        await service.startEmail(OTHER_ID, { email: 'shared@example.org', purpose: 'change' });
        advance(RESEND_COOLDOWN_MS);
      }

      await expectFailure(
        service.startEmail(USER_ID, { email: 'shared@example.org', purpose: 'change' }),
        429,
        'TOO_MANY_REQUESTS',
      );
    });
  });

  describe('email confirm', () => {
    it('sets the lower-cased email, marks it verified, and accepts the code once', async () => {
      await service.startEmail(USER_ID, { email: 'New@Example.org', purpose: 'change' });
      const code = mail.lastCode();

      expect(store.users.get(USER_ID).email).toBe('member@example.org');

      const result = await service.confirmEmail(USER_ID, code);
      expect(result).toEqual({ emailVerified: true, verifiedAt: now.toISOString() });
      expect(store.users.get(USER_ID).email).toBe('new@example.org');
      expect(store.users.get(USER_ID).emailVerifiedAt).toEqual(now);

      await expectFailure(service.confirmEmail(USER_ID, code), 400, 'INVALID_CODE');
    });

    it('reports attemptsRemaining and locks the code on the 5th wrong attempt', async () => {
      await service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' });
      const code = mail.lastCode();
      const wrong = code === '000000' ? '111111' : '000000';

      for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt += 1) {
        const error = await expectFailure(service.confirmEmail(USER_ID, wrong), 400, 'INVALID_CODE');
        expect(error.getResponse()).toMatchObject({ attemptsRemaining: MAX_ATTEMPTS - attempt });
      }

      await expectFailure(service.confirmEmail(USER_ID, wrong), 429, 'TOO_MANY_ATTEMPTS');
      await expectFailure(service.confirmEmail(USER_ID, code), 429, 'TOO_MANY_ATTEMPTS');
      expect(store.users.get(USER_ID).email).toBe('member@example.org');
    });

    it('accepts the correct code on the last permitted attempt', async () => {
      await service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' });
      const code = mail.lastCode();
      const wrong = code === '000000' ? '111111' : '000000';

      for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt += 1) {
        await expectFailure(service.confirmEmail(USER_ID, wrong), 400, 'INVALID_CODE');
      }

      await expect(service.confirmEmail(USER_ID, code)).resolves.toMatchObject({ emailVerified: true });
    });

    it('returns 410 CODE_EXPIRED once the 10-minute TTL has passed', async () => {
      await service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' });
      const code = mail.lastCode();
      advance(CODE_TTL_MS);

      await expectFailure(service.confirmEmail(USER_ID, code), 410, 'CODE_EXPIRED');
      expect(store.users.get(USER_ID).email).toBe('member@example.org');
    });

    it('makes a newer code replace the older one', async () => {
      await service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' });
      const first = mail.lastCode();
      advance(RESEND_COOLDOWN_MS);
      await service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' });
      const second = mail.lastCode();

      if (first !== second) {
        await expectFailure(service.confirmEmail(USER_ID, first), 400, 'INVALID_CODE');
      }
      await expect(service.confirmEmail(USER_ID, second)).resolves.toMatchObject({ emailVerified: true });
    });

    it('returns INVALID_CODE when no code was ever requested', async () => {
      await expectFailure(service.confirmEmail(USER_ID, '123456'), 400, 'INVALID_CODE');
    });

    it('leaves the stored email unchanged when the address is taken before confirm', async () => {
      await service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' });
      const code = mail.lastCode();
      store.addUser(baseUser({ id: OTHER_ID, email: 'new@example.org' }));

      await expectFailure(service.confirmEmail(USER_ID, code), 409, 'EMAIL_IN_USE');
      expect(store.users.get(USER_ID).email).toBe('member@example.org');
    });
  });

  describe('phone', () => {
    it('rejects numbers outside the +255 mobile allow-list with 422 INVALID_PHONE', async () => {
      for (const phone of ['+254712345678', '0812345678', '12345', 'not-a-phone']) {
        await expectFailure(service.startPhone(USER_ID, phone), 422, 'INVALID_PHONE');
      }
      expect(sms.sent).toHaveLength(0);
    });

    it('normalises a local number to E.164 before sending', async () => {
      await service.startPhone(USER_ID, '0712 345 678');

      expect(sms.sent).toHaveLength(1);
      expect(sms.sent[0].destination).toBe('+255712345678');
      expect(mail.sent).toHaveLength(0);
    });

    it('returns 409 PHONE_IN_USE when another user holds the number', async () => {
      store.addUser(baseUser({ id: OTHER_ID, email: 'other@example.org', phoneE164: '+255712345678' }));

      await expectFailure(service.startPhone(USER_ID, '0712345678'), 409, 'PHONE_IN_USE');
    });

    it('stores phoneE164 and phoneVerifiedAt on a correct code', async () => {
      await service.startPhone(USER_ID, '0712345678');
      const code = sms.lastCode();

      const result = await service.confirmPhone(USER_ID, code);
      expect(result).toEqual({ phoneVerified: true, verifiedAt: now.toISOString() });
      expect(store.users.get(USER_ID).phoneE164).toBe('+255712345678');
      expect(store.users.get(USER_ID).phoneVerifiedAt).toEqual(now);
    });

    it('caps sends at 5 per phone per day across users', async () => {
      store.addUser(baseUser({ id: OTHER_ID, email: 'other@example.org' }));
      for (let i = 0; i < 5; i += 1) {
        await service.startPhone(OTHER_ID, '0712345678');
        advance(RESEND_COOLDOWN_MS);
      }

      await expectFailure(service.startPhone(USER_ID, '0712345678'), 429, 'TOO_MANY_REQUESTS');
    });

    it('enforces the attempt lockout on the phone channel too', async () => {
      await service.startPhone(USER_ID, '0712345678');
      const code = sms.lastCode();
      const wrong = code === '000000' ? '111111' : '000000';

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        await expect(service.confirmPhone(USER_ID, wrong)).rejects.toBeInstanceOf(HttpException);
      }
      await expectFailure(service.confirmPhone(USER_ID, code), 429, 'TOO_MANY_ATTEMPTS');
      expect(store.users.get(USER_ID).phoneE164).toBeNull();
    });
  });

  describe('delivery and configuration', () => {
    it('returns 503 DELIVERY_FAILED when the provider rejects, and the code cannot be used', async () => {
      sms.failNext = true;

      await expectFailure(service.startPhone(USER_ID, '0712345678'), 503, 'DELIVERY_FAILED');
      expect(store.rows[0].consumedAt).toEqual(now);
      await expectFailure(service.confirmPhone(USER_ID, '123456'), 400, 'INVALID_CODE');
    });

    it('refuses to issue codes in production with the placeholder or a short secret', async () => {
      for (const hmacSecret of [PLACEHOLDER_SECRET, 'short']) {
        service = new VerificationService(store, mail, sms, { ...options, isProduction: true, hmacSecret });

        await expectFailure(
          service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' }),
          503,
          'VERIFICATION_UNAVAILABLE',
        );
      }
      expect(mail.sent).toHaveLength(0);
    });

    it('issues codes in production with a long real secret', async () => {
      service = new VerificationService(store, mail, sms, { ...options, isProduction: true });

      await expect(
        service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' }),
      ).resolves.toMatchObject({ status: 'sent' });
    });

    it('never logs the code or its hash', async () => {
      await service.startEmail(USER_ID, { email: 'new@example.org', purpose: 'change' });
      const code = mail.lastCode();
      const digest = store.rows[0].codeHmac;
      const wrong = code === '000000' ? '111111' : '000000';
      await expect(service.confirmEmail(USER_ID, wrong)).rejects.toBeInstanceOf(HttpException);
      await service.confirmEmail(USER_ID, code);

      const logged = loggerSpies
        .flatMap((spy) => spy.mock.calls)
        .map((args) => args.map(String).join(' '))
        .join('\n');
      expect(logged).not.toContain(code);
      expect(logged).not.toContain(digest);
      expect(logged).not.toContain(SECRET);
    });
  });
});

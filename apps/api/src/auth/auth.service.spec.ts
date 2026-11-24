import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { refreshTokens } from '../database/schema';
import config from '../config';

// Replace drizzle operators with plain descriptors so the fake DB below can
// evaluate WHERE clauses without a real Postgres connection.
jest.mock('drizzle-orm', () => {
  const actual = jest.requireActual('drizzle-orm');
  return {
    ...actual,
    and: (...conds: unknown[]) => ({ op: 'and', conds }),
    eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
    isNull: (col: unknown) => ({ op: 'isNull', col }),
    gt: (col: unknown, val: unknown) => ({ op: 'gt', col, val }),
  };
});

describe('AuthService refresh token verification', () => {
  let jwtService: { verifyAsync: jest.Mock; sign: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn(), sign: jest.fn().mockReturnValue('signed') };
    service = new AuthService({} as any, jwtService as any);
  });

  it('accepts a verified refresh token payload', async () => {
    const payload = { sub: 'user-id', type: 'refresh' as const };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(service.verifyRefreshToken('token')).resolves.toEqual(payload);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ secret: expect.any(String) }),
    );
  });

  it.each([
    ['missing', undefined],
    ['blank', ''],
  ])('rejects a %s refresh token', async (_label, token) => {
    await expect(service.verifyRefreshToken(token)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it.each(['malformed', 'expired', 'wrong secret'])(
    'rejects a JWT rejected by verification (%s)',
    async (reason) => {
      jwtService.verifyAsync.mockRejectedValue(new Error(reason));

      await expect(service.verifyRefreshToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    },
  );

  it('rejects an access-token payload presented as a refresh token', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id', type: 'access' });

    await expect(service.verifyRefreshToken('token')).rejects.toThrow(UnauthorizedException);
  });
});

type FakeRow = {
  id: string;
  userId: string;
  familyId: string;
  usedAt: Date | null;
  expiresAt: Date;
};

// Minimal in-memory stand-in for the parts of the Drizzle API the auth service uses.
function createFakeDb() {
  const rows: FakeRow[] = [];
  const userUpdates: Array<{ set: Record<string, unknown> }> = [];

  const fieldOf = (col: unknown): keyof FakeRow => {
    if (col === refreshTokens.id) return 'id';
    if (col === refreshTokens.userId) return 'userId';
    if (col === refreshTokens.familyId) return 'familyId';
    if (col === refreshTokens.usedAt) return 'usedAt';
    return 'expiresAt';
  };

  const matches = (cond: any, row: FakeRow): boolean => {
    switch (cond.op) {
      case 'and':
        return cond.conds.every((c: any) => matches(c, row));
      case 'eq':
        return row[fieldOf(cond.col)] === cond.val;
      case 'isNull':
        return row[fieldOf(cond.col)] == null;
      case 'gt':
        return (row[fieldOf(cond.col)] as Date) > cond.val;
      default:
        throw new Error(`unsupported op ${cond.op}`);
    }
  };

  const resultOf = <T>(value: T) => Object.assign(Promise.resolve(value), { returning: () => Promise.resolve(value) });

  return {
    rows,
    userUpdates,
    insert: () => ({
      values: async (v: Omit<FakeRow, 'usedAt'>) => {
        rows.push({ ...v, usedAt: null });
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: (cond: any) => {
          if (table !== refreshTokens) {
            userUpdates.push({ set: values });
            return resultOf([]);
          }
          const hit = rows.filter((row) => matches(cond, row));
          hit.forEach((row) => Object.assign(row, values));
          return resultOf(hit.map((row) => ({ id: row.id })));
        },
      }),
    }),
  };
}

describe('AuthService refresh token rotation', () => {
  const userId = 'user-id';
  const user = { id: userId, email: 'a@example.com', deletedAt: null, tokenVersion: 0 };
  let db: ReturnType<typeof createFakeDb>;
  let jwtService: JwtService;
  let service: AuthService;

  beforeEach(async () => {
    db = createFakeDb();
    jwtService = new JwtService({ secret: config.jwt.secret });
    service = new AuthService({ getDatabase: async () => db } as any, jwtService);
    await service.onModuleInit();
    jest.spyOn(service, 'getProfile').mockResolvedValue(user as any);
    jest.spyOn(service, 'getPreferredMembership').mockResolvedValue(null);
  });

  const decode = (token: string) => jwtService.decode(token) as { jti: string; fid: string };
  const rowFor = (token: string) => db.rows.find((r) => r.id === decode(token).jti)!;

  it('rotates: returns a new pair in the same family and marks the old token used', async () => {
    const first = await service.generateTokens(user);

    const next = await service.rotateRefreshToken(first.refreshToken);

    expect(next.accessToken).toEqual(expect.any(String));
    expect(next.refreshToken).not.toBe(first.refreshToken);
    expect(decode(next.refreshToken).fid).toBe(decode(first.refreshToken).fid);
    expect(rowFor(first.refreshToken).usedAt).toBeInstanceOf(Date);
    expect(rowFor(next.refreshToken).usedAt).toBeNull();
  });

  it('reuse of an already-rotated token returns 401 and revokes the family', async () => {
    const first = await service.generateTokens(user);
    const next = await service.rotateRefreshToken(first.refreshToken);

    await expect(service.rotateRefreshToken(first.refreshToken)).rejects.toThrow(UnauthorizedException);

    expect(rowFor(next.refreshToken).usedAt).toBeInstanceOf(Date);
    await expect(service.rotateRefreshToken(next.refreshToken)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an expired refresh token without consuming its row', async () => {
    const first = await service.generateTokens(user);
    const { jti, fid } = decode(first.refreshToken);
    const expired = jwtService.sign({
      sub: userId,
      type: 'refresh',
      jti,
      fid,
      exp: Math.floor(Date.now() / 1000) - 10,
    });

    await expect(service.rotateRefreshToken(expired)).rejects.toThrow(UnauthorizedException);
    expect(rowFor(first.refreshToken).usedAt).toBeNull();
  });

  it('rejects a refresh token without jti (pre-rotation token) and writes nothing', async () => {
    const legacy = jwtService.sign({ sub: userId, type: 'refresh', tv: 0 }, { expiresIn: 3600 });

    await expect(service.rotateRefreshToken(legacy)).rejects.toThrow(UnauthorizedException);
    expect(db.rows).toHaveLength(0);
  });

  it('logout invalidates every refresh token for the user', async () => {
    const first = await service.generateTokens(user);

    await service.revokeTokens(userId);

    expect(db.userUpdates).toHaveLength(1);
    expect(db.userUpdates[0].set).toHaveProperty('tokenVersion');
    expect(rowFor(first.refreshToken).usedAt).toBeInstanceOf(Date);
    await expect(service.rotateRefreshToken(first.refreshToken)).rejects.toThrow(UnauthorizedException);
  });

  it('starts a new family for a fresh login, separate from an existing one', async () => {
    const a = await service.generateTokens(user);
    const b = await service.generateTokens(user);

    expect(decode(a.refreshToken).fid).not.toBe(decode(b.refreshToken).fid);
  });

  it('rejects a refresh for a soft-deleted user', async () => {
    jest.spyOn(service, 'getProfile').mockResolvedValue({ ...user, deletedAt: new Date() } as any);

    await expect(service.refreshTokensForPayload({ sub: userId, type: 'refresh' }, 'family-id')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a refresh token issued before the user logged out', async () => {
    jest.spyOn(service, 'getProfile').mockResolvedValue({ ...user, tokenVersion: 2 } as any);

    await expect(
      service.refreshTokensForPayload({ sub: userId, type: 'refresh', tv: 1 }, 'family-id'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a refresh when the user no longer exists', async () => {
    jest.spyOn(service, 'getProfile').mockRejectedValue(new NotFoundException('User not found'));

    await expect(
      service.refreshTokensForPayload({ sub: userId, type: 'refresh' }, 'family-id'),
    ).rejects.toThrow(UnauthorizedException);
  });
});

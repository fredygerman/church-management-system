import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const user = { id: 'user-id', deletedAt: null, tokenVersion: 0, role: 'member', churchId: null };
  let queries: number;
  let strategy: JwtStrategy;

  beforeEach(async () => {
    queries = 0;
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              queries += 1;
              return [user];
            },
          }),
        }),
      }),
    };
    strategy = new JwtStrategy({ getDatabase: async () => db } as any);
    await strategy.onModuleInit();
  });

  it('rejects a refresh token presented as a Bearer access token', async () => {
    await expect(
      strategy.validate({ sub: user.id, type: 'refresh', tv: 0 }),
    ).rejects.toThrow(UnauthorizedException);
    expect(queries).toBe(0);
  });

  it('accepts an access token payload', async () => {
    await expect(strategy.validate({ sub: user.id, tv: 0, role: 'member' })).resolves.toEqual(
      expect.objectContaining({ id: user.id }),
    );
  });
});

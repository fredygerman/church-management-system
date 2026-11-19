import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

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

  it('rejects a refresh for a soft-deleted user', async () => {
    jest.spyOn(service, 'getProfile').mockResolvedValue({
      id: 'user-id',
      deletedAt: new Date(),
    } as any);

    await expect(
      service.refreshTokensForPayload({ sub: 'user-id', type: 'refresh' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a refresh token issued before the user logged out', async () => {
    jest.spyOn(service, 'getProfile').mockResolvedValue({
      id: 'user-id',
      deletedAt: null,
      tokenVersion: 2,
    } as any);

    await expect(
      service.refreshTokensForPayload({ sub: 'user-id', type: 'refresh', tv: 1 }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a refresh token whose version matches the user', async () => {
    jest.spyOn(service, 'getProfile').mockResolvedValue({
      id: 'user-id',
      email: 'a@example.com',
      deletedAt: null,
      tokenVersion: 2,
    } as any);
    jest.spyOn(service, 'getPreferredMembership').mockResolvedValue(null);

    await expect(
      service.refreshTokensForPayload({ sub: 'user-id', type: 'refresh', tv: 2 }),
    ).resolves.toEqual({ accessToken: 'signed', refreshToken: 'signed' });
  });

  it('rejects a refresh when the user no longer exists', async () => {
    jest.spyOn(service, 'getProfile').mockRejectedValue(new NotFoundException('User not found'));

    await expect(
      service.refreshTokensForPayload({ sub: 'user-id', type: 'refresh' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

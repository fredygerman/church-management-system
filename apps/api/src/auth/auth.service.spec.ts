import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService refresh token verification', () => {
  let jwtService: { verifyAsync: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
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

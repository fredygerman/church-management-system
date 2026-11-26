import { sameOriginCallbackPath } from './callback-url';

const FRONTEND = 'https://app.mitoyabarakachurch.org';

describe('sameOriginCallbackPath (RM-012)', () => {
  it('keeps a same-origin absolute URL as its path', () => {
    expect(sameOriginCallbackPath(`${FRONTEND}/events?tab=1#top`, FRONTEND)).toBe('/events?tab=1#top');
  });

  it('keeps a plain internal path', () => {
    expect(sameOriginCallbackPath('/member/home', FRONTEND)).toBe('/member/home');
  });

  it.each([
    '//evil.example',
    '//evil.example/path',
    '/\\evil.example',
    'https://evil.example/home',
    'https://app.mitoyabarakachurch.org.evil.example/home',
    'javascript:alert(1)',
    'http://localhost:3000/home',
    '',
    'https://[::1',
  ])('drops %j', (value) => {
    expect(sameOriginCallbackPath(value, FRONTEND)).toBeUndefined();
  });

  it('returns undefined when the callbackUrl is missing', () => {
    expect(sameOriginCallbackPath(undefined, FRONTEND)).toBeUndefined();
  });
});

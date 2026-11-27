import {
  AVATAR_MAX_BYTES,
  buildAvatarKey,
  detectAvatarImageType,
} from './avatar-image';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pad = (n: number) => Buffer.alloc(n, 0x00);

describe('detectAvatarImageType', () => {
  it('detects JPEG from the SOI marker', () => {
    expect(detectAvatarImageType(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), pad(32)]))).toBe('image/jpeg');
  });

  it('detects PNG from its 8-byte signature', () => {
    expect(detectAvatarImageType(Buffer.concat([PNG_SIGNATURE, pad(32)]))).toBe('image/png');
  });

  it('detects WebP from RIFF....WEBP', () => {
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x10, 0, 0, 0]), Buffer.from('WEBP'), pad(16)]);
    expect(detectAvatarImageType(webp)).toBe('image/webp');
  });

  it('rejects an SVG renamed to .png', () => {
    expect(detectAvatarImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
  });

  it('rejects HTML and other content', () => {
    expect(detectAvatarImageType(Buffer.from('<html><script>alert(1)</script></html>'))).toBeNull();
    expect(detectAvatarImageType(Buffer.from('GIF89a' + '\0'.repeat(20)))).toBeNull();
  });

  it('rejects RIFF containers that are not WebP (e.g. WAV)', () => {
    const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x10, 0, 0, 0]), Buffer.from('WAVE'), pad(16)]);
    expect(detectAvatarImageType(wav)).toBeNull();
  });

  it('rejects buffers too short to hold a signature', () => {
    expect(detectAvatarImageType(Buffer.alloc(0))).toBeNull();
    expect(detectAvatarImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(detectAvatarImageType(PNG_SIGNATURE.subarray(0, 4))).toBeNull();
  });
});

describe('buildAvatarKey', () => {
  it('uses avatars/{userId}/{uuid}.{ext} with the extension for the detected type', () => {
    expect(buildAvatarKey('user-1', 'image/jpeg', 'uuid-1')).toBe('avatars/user-1/uuid-1.jpg');
    expect(buildAvatarKey('user-1', 'image/png', 'uuid-1')).toBe('avatars/user-1/uuid-1.png');
    expect(buildAvatarKey('user-1', 'image/webp', 'uuid-1')).toBe('avatars/user-1/uuid-1.webp');
  });
});

describe('AVATAR_MAX_BYTES', () => {
  it('is 5 MB', () => {
    expect(AVATAR_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});

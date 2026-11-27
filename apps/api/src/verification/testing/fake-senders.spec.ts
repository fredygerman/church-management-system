import { FakeCodeSender } from './fake-senders';

describe('FakeCodeSender', () => {
  const input = {
    userId: 'user-1',
    destination: 'member@example.org',
    code: '123456',
    expiresInMinutes: 10,
  };

  it('records each send and reports the latest code', async () => {
    const sender = new FakeCodeSender();
    await expect(sender.sendCode(input)).resolves.toBe(true);
    await sender.sendCode({ ...input, code: '654321' });

    expect(sender.sent).toHaveLength(2);
    expect(sender.lastCode()).toBe('654321');
  });

  it('fails once when failNext is set, then recovers', async () => {
    const sender = new FakeCodeSender();
    sender.failNext = true;

    await expect(sender.sendCode(input)).resolves.toBe(false);
    expect(sender.sent).toHaveLength(0);
    await expect(sender.sendCode(input)).resolves.toBe(true);
    expect(sender.sent).toHaveLength(1);
  });

  it('throws from lastCode when nothing was sent', () => {
    expect(() => new FakeCodeSender().lastCode()).toThrow('no code has been sent');
  });
});

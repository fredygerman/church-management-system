import { AnnouncementScheduler, SCHEDULER_INTERVAL_MS } from './announcement-scheduler'

const NOTHING_DUE = { published: 0, held: 0, failed: 0 }

function buildScheduler(publishDueScheduled: jest.Mock) {
  return new AnnouncementScheduler({ publishDueScheduled } as any)
}

describe('AnnouncementScheduler', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('runs one pass per minute from onModuleInit, and stops after onModuleDestroy', async () => {
    const publishDueScheduled = jest.fn().mockResolvedValue(NOTHING_DUE)
    const scheduler = buildScheduler(publishDueScheduled)

    scheduler.onModuleInit()
    expect(SCHEDULER_INTERVAL_MS).toBe(60_000)
    expect(publishDueScheduled).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(SCHEDULER_INTERVAL_MS)
    expect(publishDueScheduled).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(SCHEDULER_INTERVAL_MS * 2)
    expect(publishDueScheduled).toHaveBeenCalledTimes(3)

    scheduler.onModuleDestroy()
    await jest.advanceTimersByTimeAsync(SCHEDULER_INTERVAL_MS * 5)
    expect(publishDueScheduled).toHaveBeenCalledTimes(3)
  })

  it('does not start a second pass while the first is still running', async () => {
    let finishFirstPass!: () => void
    const publishDueScheduled = jest
      .fn()
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          finishFirstPass = () => resolve(NOTHING_DUE)
        }),
      )
      .mockResolvedValue(NOTHING_DUE)
    const scheduler = buildScheduler(publishDueScheduled)

    const first = scheduler.runPass()
    expect(await scheduler.runPass()).toBe(false)
    expect(publishDueScheduled).toHaveBeenCalledTimes(1)

    finishFirstPass()
    expect(await first).toBe(true)
    expect(await scheduler.runPass()).toBe(true)
    expect(publishDueScheduled).toHaveBeenCalledTimes(2)
  })

  it('logs a failed pass without the error escaping, and runs again on the next tick', async () => {
    const publishDueScheduled = jest
      .fn()
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValue(NOTHING_DUE)
    const scheduler = buildScheduler(publishDueScheduled)
    const errorSpy = jest.spyOn((scheduler as any).logger, 'error').mockImplementation(() => undefined)

    expect(await scheduler.runPass()).toBe(true)
    expect(errorSpy).toHaveBeenCalledWith('Scheduled announcement pass failed', expect.any(String))
    expect(await scheduler.runPass()).toBe(true)
    expect(publishDueScheduled).toHaveBeenCalledTimes(2)
  })
})

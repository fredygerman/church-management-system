// A response is current only while no newer request (or context change) has started since it was sent.
export type RequestGate = {
  /** Starts a request; the returned check is true only while it is still the latest. */
  start: () => () => boolean
  /** Makes every request started so far obsolete, e.g. when the screen unmounts or the context changes. */
  invalidate: () => void
}

export function createRequestGate(): RequestGate {
  let latest = 0
  return {
    start() {
      const ticket = ++latest
      return () => ticket === latest
    },
    invalidate() {
      latest++
    },
  }
}

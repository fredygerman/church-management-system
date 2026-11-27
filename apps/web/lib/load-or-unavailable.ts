export type LoadResult<T> = { status: 'ok'; data: T } | { status: 'unavailable' }

function isRedirect(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) return true
  const message = (error as { message?: unknown } | null)?.message
  return typeof message === 'string' && message.includes('NEXT_REDIRECT')
}

/**
 * Runs a server-side data load. A failed request becomes `unavailable`, so the page can
 * show an UnavailableState instead of an empty list. Next.js redirects are re-thrown.
 */
export async function loadOrUnavailable<T>(load: () => Promise<T>): Promise<LoadResult<T>> {
  try {
    return { status: 'ok', data: await load() }
  } catch (error) {
    if (isRedirect(error)) throw error
    console.error('Dashboard data failed to load:', error)
    return { status: 'unavailable' }
  }
}

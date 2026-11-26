/**
 * Reduce a caller-supplied callbackUrl to a same-origin path on the frontend (RM-012).
 * Only absolute URLs on the FRONTEND_URL origin survive, and only their path,
 * query and hash are kept. Anything else (other hosts, protocol-relative
 * `//host`, `/\host`, javascript:, malformed input) returns undefined.
 */
export function sameOriginCallbackPath(
  callbackUrl: string | undefined,
  frontendUrl: string,
): string | undefined {
  if (!callbackUrl) return undefined;

  let frontend: URL;
  try {
    frontend = new URL(frontendUrl);
  } catch {
    return undefined;
  }

  let candidate: URL;
  try {
    candidate = new URL(callbackUrl, frontend.origin);
  } catch {
    return undefined;
  }

  if (candidate.origin !== frontend.origin) return undefined;
  if (candidate.protocol !== 'http:' && candidate.protocol !== 'https:') return undefined;

  return `${candidate.pathname}${candidate.search}${candidate.hash}`;
}

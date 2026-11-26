/**
 * Fail-fast check for signing secrets in production (RM-005 helper, owner decision V-01).
 * Only NODE_ENV=production is enforced; development and test never throw.
 * Wiring: call assertProductionSecrets() at bootstrap (lane 02 owns config/index.ts and main.ts).
 * Error messages name the variables only, never their values.
 */

/** Committed fallbacks from config/index.ts. A production process still on these is compromised. */
const COMMITTED_DEFAULTS = new Set([
  'your-super-secret-jwt-key-change-this-in-production',
  'your-super-secret-session-key-change-this-in-production',
]);

const REQUIRED_SECRET_VARS = ['JWT_SECRET', 'SESSION_SECRET'] as const;

export function findInsecureProductionSecrets(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.NODE_ENV !== 'production') return [];

  return REQUIRED_SECRET_VARS.filter((name) => {
    const value = env[name]?.trim();
    return !value || COMMITTED_DEFAULTS.has(value);
  });
}

export function assertProductionSecrets(env: NodeJS.ProcessEnv = process.env): void {
  const insecure = findInsecureProductionSecrets(env);
  if (insecure.length > 0) {
    throw new Error(
      `Refusing to start in production: unset or default secret(s): ${insecure.join(', ')}`,
    );
  }
}

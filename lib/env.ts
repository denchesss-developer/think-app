/**
 * Safe helper to retrieve public environment variables on both client and server.
 */
export function getClientEnv(key: string, defaultValue = ''): string {
  const val = process.env[key];
  if (!val) {
    return defaultValue;
  }
  return val;
}

/**
 * Safe helper to retrieve server-only environment variables.
 * Returns the default value if executed on the client-side to prevent leaks.
 */
export function getServerEnv(key: string, defaultValue = ''): string {
  if (typeof window !== 'undefined') {
    return defaultValue;
  }
  const val = process.env[key];
  if (!val) {
    return defaultValue;
  }
  return val;
}

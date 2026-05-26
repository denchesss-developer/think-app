const PREFIX = '[Think]'

export function logInfo(msg: string, ...args: unknown[]) {
  console.log(`${PREFIX} ${msg}`, ...args)
}

export function logWarn(msg: string, ...args: unknown[]) {
  console.warn(`${PREFIX} ${msg}`, ...args)
}

export function logError(msg: string, ...args: unknown[]) {
  console.error(`${PREFIX} ${msg}`, ...args)
}

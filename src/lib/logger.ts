
export function logInfo(msg: string, meta: Record<string, any> = {}) {
  console.log(JSON.stringify({ level: 'info', msg, ...meta }));
}
export function logWarn(msg: string, meta: Record<string, any> = {}) {
  console.warn(JSON.stringify({ level: 'warn', msg, ...meta }));
}
export function logError(msg: string, meta: Record<string, any> = {}) {
  console.error(JSON.stringify({ level: 'error', msg, ...meta }));
}

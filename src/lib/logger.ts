
import { getENV } from './config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMeta {
    [key: string]: any;
}

function log(level: LogLevel, message: string, meta?: LogMeta) {
    const ENV = getENV();
    if (ENV.NODE_ENV === 'test') return; // Don't log during tests

    const logObject = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
    };
    
    // In production, we'd want structured JSON logs. In dev, pretty-printing is nice.
    if (ENV.NODE_ENV === 'production') {
        console[level === 'info' || level === 'debug' ? 'log' : level](JSON.stringify(logObject));
    } else {
         console[level === 'info' || level === 'debug' ? 'log' : level](`[${level.toUpperCase()}] ${message}`, meta || '');
    }
}


export const logger = {
    info: (message: string, meta?: LogMeta) => log('info', message, meta),
    warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
    error: (message: string, meta?: LogMeta) => log('error', message, meta),
    debug: (message: string, meta?: LogMeta) => {
        const ENV = getENV();
        if (ENV.NODE_ENV !== 'production') {
            log('debug', message, meta);
        }
    },
};

import pino from 'pino';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';

dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  redact: { paths: ['req.headers.authorization', 'req.headers.cookie'], censor: '[REDACTED]' }
});

export const httpLogger = pinoHttp({
  logger,
  autoLogging: { ignore: req => req.url === '/api/health' }
});
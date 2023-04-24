import { LoggerService as LS, LogLevel } from '@nestjs/common';

import 'winston-mongodb';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

// @Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements LS {
  private logger: winston.Logger;
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.logger = winston.createLogger({
      // level: 'warn',
      transports: [
        new winston.transports.Console({
          level: 'debug',
          // stderrLevels: ['warn'],
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('DU_CHAT_NEW', {
              prettyPrint: true,
            }),
          ),
          // format: winston.format.json(),
        }),
        new winston.transports.MongoDB({
          db: process.env.LOGGER_DATABASE_HOST,
          collection: 'chat_logs',
          level: 'info',
          metaKey: 'meta',
          expireAfterSeconds: 86400 * 30 * 6,
          options: {
            useUnifiedTopology: true,
          },
        }),
      ],
    });
  }

  log(message: string, meta?: Record<string, any>) {
    this.logger.info(`${this.serviceName}:${message}`, { meta });
  }

  error(message: string, meta?: Record<string, any>) {
    this.logger.error(`${this.serviceName}:${message}`, { meta });
  }
  warn(message: string, meta?: Record<string, any>) {
    this.logger.warn(`${this.serviceName}:${message}`, { meta });
  }
  debug(message: string, meta?: Record<string, any>) {
    this.logger.debug(message, { meta });
  }
  verbose(message: string, meta?: Record<string, any>) {
    this.logger.verbose(message, { meta });
  }

  setLogLevels?(levels: LogLevel[]) {
    console.log(levels);
    // throw new Error('Method not implemented.');
  }
}

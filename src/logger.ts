import * as IO from 'fp-ts/lib/IO';
import { Logger as WinstonLogger } from 'winston';

export interface Logger {
  error(message: string): IO.IO<void>;
  info(message: string): IO.IO<void>;
  debug(message: string): IO.IO<void>;
}

class LoggerImpl implements Logger {
  winston: WinstonLogger;

  constructor(winston: WinstonLogger) {
    this.winston = winston;
  }

  error = (message: string): IO.IO<void> => () => {
    this.winston.error(message);
  };

  info = (message: string): IO.IO<void> => () => {
    this.winston.info(message);
  };

  debug = (message: string): IO.IO<void> => () => {
    this.winston.debug(message);
  };
}

export const createLogger = (winston: WinstonLogger): Logger => new LoggerImpl(winston);

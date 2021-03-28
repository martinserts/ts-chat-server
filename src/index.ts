import { createChatServer } from './server';
import Winston = require('winston');
import { createLogger } from './logger';

const int = (def: number, s?: string): number => {
  if (s) {
    const n = parseInt(s);
    return isNaN(n) ? def : n;
  } else return def;
};

const winston = Winston.createLogger({
  level: 'debug',
  format: Winston.format.json(),
  transports: [
    new Winston.transports.Console({
      format: Winston.format.simple(),
    }),
  ],
});

const logger = createLogger(winston);
const config = {
  port: int(8822, process.env.PORT),
  inactivityTimeout: int(3 * 60 * 1000, process.env.TIMEOUT),
};

logger.info(`Starting server with config: ${JSON.stringify(config)}`)();

const server = createChatServer(logger, config);
server.start();

process.on('SIGINT', server.shutdown);
process.on('SIGTERM', server.shutdown);

import { createLogger } from './logger';
import { Logger as WinstonLogger } from 'winston';

describe('logger', () => {
  beforeEach(() => jest.clearAllMocks());

  const error = jest.fn();
  const info = jest.fn();
  const debug = jest.fn();
  const winstonLogger: WinstonLogger = ({ error, info, debug } as unknown) as WinstonLogger;
  const logger = createLogger(winstonLogger);

  it('should delegate error call to winston', () => {
    logger.error('message')();
    expect(error).toBeCalledWith('message');
  });

  it('should delegate info call to winston', () => {
    logger.info('message')();
    expect(info).toBeCalledWith('message');
  });

  it('should delegate debug call to winston', () => {
    logger.debug('message')();
    expect(debug).toBeCalledWith('message');
  });
});

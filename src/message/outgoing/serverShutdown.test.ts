import { ServerShutdown } from './serverShutdown';

describe('ServerShutdown', () => {
  it('should serialize the message', () => {
    expect(new ServerShutdown('reason').serialize()).toBe('{"command":"Shutdown","reason":"reason"}');
  });
});

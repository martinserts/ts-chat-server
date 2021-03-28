import { ConnectionClosed } from './connectionClosed';

describe('ConnectionClosed', () => {
  it('should serialize the message', () => {
    expect(new ConnectionClosed('Ubiquiti', 'reason').serialize()).toBe(
      '{"command":"ConnectionClosed","nickname":"Ubiquiti","reason":"reason"}',
    );
  });
});

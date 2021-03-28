import { OutgoingTell } from './outgoingTell';

describe('OutgoingTell', () => {
  it('should serialize the message', () => {
    expect(new OutgoingTell('Ubiquiti', 'message').serialize()).toBe(
      '{"command":"Tell","nickname":"Ubiquiti","message":"message"}',
    );
  });
});

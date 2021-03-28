import { UserJoined } from './userJoined';

describe('UserJoined', () => {
  it('should serialize the message', () => {
    expect(new UserJoined('Ubiquiti').serialize()).toBe('{"command":"Join","nickname":"Ubiquiti"}');
  });
});

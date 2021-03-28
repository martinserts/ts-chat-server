import * as E from 'fp-ts/lib/Either';
import { MessageKind } from './incomingMessage';
import { tellParser } from './tellMessage';

describe('tellParser', () => {
  it('should respond to TELL commands', () => {
    expect(tellParser.command).toBe('TELL');
  });

  describe('parse', () => {
    it('should fail, if there is no message in the payload', () => {
      expect(tellParser.parse({})).toStrictEqual(E.left('Message not found'));
    });

    it('should fail, if message is longer than 200 characters', () => {
      const message = 'x'.repeat(201);
      expect(tellParser.parse({ message })).toStrictEqual(E.left('Maximum message length is 200'));
    });

    it('should return TellMessage on success', () => {
      expect(tellParser.parse({ message: 'Ubiquiti' })).toStrictEqual(
        E.right({ _tag: MessageKind.Tell, message: 'Ubiquiti' }),
      );
    });
  });
});

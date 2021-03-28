import * as E from 'fp-ts/lib/Either';
import { MessageKind } from './incomingMessage';
import { nicknameParser } from './nicknameMessage';

describe('nicknameParser', () => {
  it('should respond to NICKNAME commands', () => {
    expect(nicknameParser.command).toBe('NICKNAME');
  });

  describe('parse', () => {
    it('should fail, if there is no nickname in the payload', () => {
      expect(nicknameParser.parse({})).toStrictEqual(E.left('Nickname not found'));
    });

    test.each(['AB', 'Longerthan15characers', 'Invalid chars'])('should fail for invalid input %p', (nickname) => {
      expect(nicknameParser.parse({ nickname })).toStrictEqual(
        E.left('Nickname must consist of 3-15 alphanumeric characters'),
      );
    });

    it('should return NicknameMessage on success', () => {
      expect(nicknameParser.parse({ nickname: 'Ubiquiti' })).toStrictEqual(
        E.right({ _tag: MessageKind.Nickname, nickname: 'Ubiquiti' }),
      );
    });
  });
});

import { mocked } from 'ts-jest/utils';
import * as E from 'fp-ts/lib/Either';
import { getStringValue, MessageKind, parseIncomingData } from './incomingMessage';
import { getParsers } from './parsers';
import { nicknameParser } from './nicknameMessage';

jest.mock('./parsers');

describe('incomingMessage', () => {
  describe('getStringValue', () => {
    it('should fail, if key is not found', () => {
      expect(getStringValue('key', 'Not found')({})).toStrictEqual(E.left('Not found'));
    });

    it('should return the value otherwise', () => {
      expect(getStringValue('key', 'Not found')({ key: 'value' })).toStrictEqual(E.right('value'));
    });
  });

  describe('parseIncomingData', () => {
    const mockedGetParsers = mocked(getParsers, true);
    beforeEach(() => mockedGetParsers.mockReturnValue([nicknameParser]));

    it('should fail, if input is invalid Json', () => {
      expect(parseIncomingData('Invalid')).toStrictEqual(E.left({ error: 'Invalid Json' }));
    });

    it('should fail, if input is a valid Json, but not an object', () => {
      expect(parseIncomingData('[1,2,3]')).toStrictEqual(E.left({ error: 'Not a JsonRecord' }));
    });
    it('should fail, if input is missing correlationId', () => {
      expect(parseIncomingData('{}')).toStrictEqual(
        E.left({ error: 'Missing correlationId', correlationId: undefined }),
      );
    });

    it('should fail, if input is missing command', () => {
      expect(parseIncomingData('{"correlationId": "321"}')).toStrictEqual(
        E.left({ error: 'Command key not found', correlationId: '321' }),
      );
    });

    it('should fail, if parser for a command cannot be found', () => {
      mockedGetParsers.mockReturnValue([]);
      expect(
        parseIncomingData('{"command": "NICKNAME", "nickname": "Ubiquiti", "correlationId": "321"}'),
      ).toStrictEqual(E.left({ error: 'Invalid command: NICKNAME', correlationId: '321' }));
    });

    it('should fail, if parser cannot parse the data', () => {
      const parser = {
        command: 'NICKNAME',
        parse: () => E.left('Failed'),
      };
      mockedGetParsers.mockReturnValue([parser]);
      expect(
        parseIncomingData('{"command": "NICKNAME", "nickname": "Ubiquiti", "correlationId": "321"}'),
      ).toStrictEqual(E.left({ error: 'Failed', correlationId: '321' }));
    });

    it('should return message with correlationId on success', () => {
      expect(
        parseIncomingData('{"command": "NICKNAME", "nickname": "Ubiquiti", "correlationId": "321"}'),
      ).toStrictEqual(E.right({ _tag: MessageKind.Nickname, nickname: 'Ubiquiti', correlationId: '321' }));
    });
  });
});

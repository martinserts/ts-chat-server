import { chain, Either, JsonRecord, left, right } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { getStringValue, MessageKind, MessageParser } from './incomingMessage';

export interface NicknameMessage {
  readonly _tag: MessageKind.Nickname;
  nickname: string;
}

const validateNickname = (nickname: string): Either<string, NicknameMessage> =>
  /^[A-Za-z0-9]{3,15}$/.test(nickname)
    ? right({ _tag: MessageKind.Nickname, nickname })
    : left('Nickname must consist of 3-15 alphanumeric characters');

export const nicknameParser: MessageParser = {
  command: 'NICKNAME',
  parse(data: JsonRecord): Either<string, NicknameMessage> {
    return pipe(data, getStringValue('nickname', 'Nickname not found'), chain(validateNickname));
  },
};

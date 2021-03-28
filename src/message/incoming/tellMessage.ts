import { chain, Either, JsonRecord, left, right } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { getStringValue, MessageKind, MessageParser } from './incomingMessage';

const MaxMessageLength = 200;

export interface TellMessage {
  readonly _tag: MessageKind.Tell;
  message: string;
}

function validateMessage(message: string): Either<string, TellMessage> {
  return message.length > MaxMessageLength
    ? left(`Maximum message length is ${MaxMessageLength}`)
    : right({ _tag: MessageKind.Tell, message });
}

export const tellParser: MessageParser = {
  command: 'TELL',
  parse(data: JsonRecord): Either<string, TellMessage> {
    return pipe(data, getStringValue('message', 'Message not found'), chain(validateMessage));
  },
};

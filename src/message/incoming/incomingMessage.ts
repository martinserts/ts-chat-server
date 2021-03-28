import { chain, Either, fromNullable, Json, JsonRecord, left, map, mapLeft, parseJSON, right } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { NicknameMessage } from './nicknameMessage';
import { getParsers } from './parsers';
import { TellMessage } from './tellMessage';

export enum MessageKind {
  Nickname,
  Tell,
}
export interface MessageBase {
  correlationId: string;
}
export type Message = NicknameMessage | TellMessage;
export type MessageWithBase = Message & MessageBase;
export interface Failure {
  error: string;
  correlationId?: string;
}
export interface MessageParser {
  command: string;
  parse(data: Json, correlationId?: string): Either<string, Message>;
}

export const getStringValue = (key: string, notFoundMessage: string) => (json: JsonRecord): Either<string, string> =>
  mapLeft<Failure, string>(({ error }) => error)(getStringValueWithFailure(key, notFoundMessage)(json));

export const getStringValueWithFailure = (key: string, notFoundMessage: string, correlationId?: string) => (
  json: JsonRecord,
): Either<Failure, string> => {
  const value = json[key];
  return typeof value === 'string' ? right(value) : left({ error: notFoundMessage, correlationId });
};

const castAsJsonRecord = (json: Json): Either<Failure, JsonRecord> =>
  json && typeof json === 'object' && !('length' in json) ? right(json) : left({ error: 'Not a JsonRecord' });

const asJsonRecord = (data: string): Either<Failure, JsonRecord> =>
  pipe(
    parseJSON(data, () => ({ error: 'Invalid Json' })),
    chain(castAsJsonRecord),
  );

const findParser = (correlationId?: string) => (command: string): Either<Failure, MessageParser> => {
  const parser = getParsers().find((parser) => parser.command === command);
  return fromNullable({ error: `Invalid command: ${command}`, correlationId })(parser);
};

export const parseIncomingData = (data: string): Either<Failure, MessageWithBase> =>
  pipe(
    asJsonRecord(data),
    chain((jsonRecord) =>
      pipe(
        jsonRecord,
        getStringValueWithFailure('correlationId', 'Missing correlationId'),
        chain((correlationId) =>
          pipe(
            jsonRecord,
            getStringValueWithFailure('command', 'Command key not found', correlationId),
            chain(findParser(correlationId)),
            chain((parser) =>
              mapLeft<string, Failure>((e) => ({ error: e, correlationId }))(parser.parse(jsonRecord, correlationId)),
            ),
            map((message) => ({ ...message, correlationId })),
          ),
        ),
      ),
    ),
  );

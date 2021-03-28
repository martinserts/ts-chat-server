import { getOrElse, JsonRecord, stringifyJSON } from 'fp-ts/lib/Either';
import { identity } from 'fp-ts/lib/function';

export abstract class OutgoingMessage {
  jsonRecord: JsonRecord;

  constructor(jsonRecord: JsonRecord) {
    this.jsonRecord = jsonRecord;
  }

  serialize = (): string => getOrElse(identity)(stringifyJSON(this.jsonRecord, () => '{}'));
}

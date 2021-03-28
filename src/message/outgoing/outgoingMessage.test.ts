import * as E from 'fp-ts/lib/Either';
import { OutgoingMessage } from './outgoingMessage';

class SimpleMessage extends OutgoingMessage {
  constructor(jsonRecord: E.JsonRecord) {
    super(jsonRecord);
  }
}

describe('OutgoingMessage', () => {
  it('should serialize the message', () => {
    expect(new SimpleMessage({ a: 1 }).serialize()).toBe('{"a":1}');
  });
});

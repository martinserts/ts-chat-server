import { fromNullable, some } from 'fp-ts/lib/Option';
import { compact } from 'fp-ts/lib/Record';
import { OutgoingMessage } from './outgoingMessage';

export class ErrorResponse extends OutgoingMessage {
  constructor(errorCode: string, reason?: string, correlationId?: string) {
    super(
      compact({ errorCode: some(errorCode), reason: fromNullable(reason), correlationId: fromNullable(correlationId) }),
    );
  }
}

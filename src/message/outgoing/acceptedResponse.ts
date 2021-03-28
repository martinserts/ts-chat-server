import { OutgoingMessage } from './outgoingMessage';

export class AcceptedResponse extends OutgoingMessage {
  constructor(correlationId: string) {
    super({ command: 'Accepted', correlationId });
  }
}

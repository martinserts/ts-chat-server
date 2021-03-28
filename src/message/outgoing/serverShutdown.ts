import { OutgoingMessage } from './outgoingMessage';

export class ServerShutdown extends OutgoingMessage {
  constructor(reason: string) {
    super({ command: 'Shutdown', reason });
  }
}

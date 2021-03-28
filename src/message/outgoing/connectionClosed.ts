import { OutgoingMessage } from './outgoingMessage';

export class ConnectionClosed extends OutgoingMessage {
  constructor(nickname: string, reason: string) {
    super({ command: 'ConnectionClosed', nickname, reason });
  }
}

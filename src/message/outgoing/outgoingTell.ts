import { OutgoingMessage } from './outgoingMessage';

export class OutgoingTell extends OutgoingMessage {
  constructor(nickname: string, message: string) {
    super({ command: 'Tell', nickname, message });
  }
}

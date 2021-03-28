import { OutgoingMessage } from './outgoingMessage';

export class UserJoined extends OutgoingMessage {
  constructor(nickname: string) {
    super({ command: 'Join', nickname });
  }
}

import * as E from 'fp-ts/lib/Either';
import * as T from 'fp-ts/lib/Task';
import WebSocket from 'ws';
import {
  Failure,
  MessageBase,
  MessageKind,
  MessageWithBase,
  parseIncomingData,
} from './message/incoming/incomingMessage';
import { AcceptedResponse } from './message/outgoing/acceptedResponse';
import { ErrorResponse } from './message/outgoing/errorResponse';
import { OutgoingMessage } from './message/outgoing/outgoingMessage';
import { OutgoingTell } from './message/outgoing/outgoingTell';
import { Broadcast, NicknameAvailable, RemoveUser } from './server';
import { NicknameMessage } from './message/incoming/nicknameMessage';
import { TellMessage } from './message/incoming/tellMessage';
import { pipe } from 'fp-ts/lib/function';
import { ConnectionClosed } from './message/outgoing/connectionClosed';
import { UserJoined } from './message/outgoing/userJoined';
import { Logger } from './logger';
import { createInactivityHandler, InactivityHandler } from './inactivityHandler';

export interface User {
  sendMessage(message: OutgoingMessage): T.Task<void>;
  getNickname(): string | undefined;
}

interface UserState {
  webSocket: WebSocket;
  nickname?: string;
  disconnecting: boolean;
}

type AcceptedOrError = AcceptedResponse | ErrorResponse;

class UserImpl implements User {
  state: UserState;

  logger: Logger;
  broadcast: Broadcast;
  nicknameAvailable: NicknameAvailable;
  removeUser: RemoveUser;
  inactivityHandler: InactivityHandler;

  constructor(
    logger: Logger,
    webSocket: WebSocket,
    inactivityTimeout: number,
    broadcast: Broadcast,
    nicknameAvailable: NicknameAvailable,
    removeUser: RemoveUser,
  ) {
    this.state = { webSocket, disconnecting: false };
    this.logger = logger;
    this.broadcast = broadcast;
    this.nicknameAvailable = nicknameAvailable;
    this.removeUser = removeUser;
    this.inactivityHandler = createInactivityHandler(this.forceDisconnect, inactivityTimeout);
    this.inactivityHandler.enabled = true;

    webSocket.on('close', this.onConnectionLost());
    webSocket.on('message', async (data: string) => {
      await this.onIncomingData(data)();
    });
  }

  sendMessage = (message: OutgoingMessage): T.Task<void> => () =>
    new Promise((resolve) => {
      this.state.webSocket.send(message.serialize(), () => {
        resolve();
      });
    });

  getNickname = () => this.state.nickname;

  private onConnectionLost = () => async () => {
    this.inactivityHandler.enabled = false;
    this.removeUser();
    if (this.state.nickname) {
      const message = this.state.disconnecting
        ? `${this.state.nickname} was disconnected due to inactivity`
        : `${this.state.nickname} left the chat, connection lost`;
      await this.broadcast(new ConnectionClosed(this.state.nickname, message))();
    }
  };

  private onIncomingData = (data: string) => async () => {
    this.inactivityHandler.restart();
    return await pipe(parseIncomingData(data), this.processIncomingMessage, T.chain(this.sendMessage))();
  };

  private forceDisconnect = (): void => {
    this.state.disconnecting = true;
    this.state.webSocket.terminate();
  };

  private processIncomingMessage = (parsedMessage: E.Either<Failure, MessageWithBase>): T.Task<AcceptedOrError> => {
    if (E.isLeft(parsedMessage)) {
      return T.of(new ErrorResponse('failed', parsedMessage.left.error, parsedMessage.left.correlationId));
    } else {
      const msg = parsedMessage.right;
      switch (msg._tag) {
        case MessageKind.Nickname:
          return this.onNicknameMessage(msg);
        case MessageKind.Tell:
          return this.onTellMessage(msg);
      }
    }
  };

  private onNicknameMessage = (msg: NicknameMessage & MessageBase): T.Task<AcceptedOrError> => async () => {
    if (this.state.nickname) {
      return new ErrorResponse('nicknameSelected', 'Nickname can be selected only once', msg.correlationId);
    } else if (!this.nicknameAvailable(msg.nickname)) {
      return new ErrorResponse('nicknameTaken', `Nickname ${msg.nickname} is already taken`, msg.correlationId);
    } else {
      this.state.nickname = msg.nickname;
      await this.broadcast(new UserJoined(this.state.nickname))();
      return new AcceptedResponse(msg.correlationId);
    }
  };

  private onTellMessage = (msg: TellMessage & MessageBase): T.Task<AcceptedOrError> => async () => {
    if (this.state.nickname) {
      await this.broadcast(new OutgoingTell(this.state.nickname, msg.message))();
      return new AcceptedResponse(msg.correlationId);
    } else {
      return new ErrorResponse(
        'missingNickname',
        'Tell is available only after a nickname is specified',
        msg.correlationId,
      );
    }
  };
}

export const createUser = (
  logger: Logger,
  webSocket: WebSocket,
  inactivityTimeout: number,
  broadcast: Broadcast,
  nicknameAvailable: NicknameAvailable,
  removeUser: RemoveUser,
): User => new UserImpl(logger, webSocket, inactivityTimeout, broadcast, nicknameAvailable, removeUser);

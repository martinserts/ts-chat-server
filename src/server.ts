import WebSocket = require('ws');
import Uuid = require('uuid');
import * as T from 'fp-ts/lib/Task';
import * as IO from 'fp-ts/lib/IO';
import { createUser, User } from './user';
import { pipe } from 'fp-ts/lib/pipeable';
import { constVoid } from 'fp-ts/lib/function';
import { OutgoingMessage } from './message/outgoing/outgoingMessage';
import { ServerShutdown } from './message/outgoing/serverShutdown';
import { Logger } from './logger';

export interface ChatServer {
  start(): void;
  shutdown(): Promise<void>;
}

export interface ServerConfig {
  port: number;
  inactivityTimeout: number;
}
export type Broadcast = (message: OutgoingMessage) => T.Task<void>;
export type NicknameAvailable = (nickname: string) => boolean;
export type RemoveUser = IO.IO<void>;

class ChatServerImpl implements ChatServer {
  config: ServerConfig;
  logger: Logger;
  webSocketServer?: WebSocket.Server;
  users: Record<string, User>;

  constructor(logger: Logger, config: ServerConfig) {
    this.logger = logger;
    this.config = config;
    this.users = {};
  }

  start = () => {
    this.logger.info('Starting websocket server')();
    this.webSocketServer = new WebSocket.Server({ port: this.config.port });
    this.webSocketServer.on('connection', (ws: WebSocket): void =>
      pipe(
        this.onIncomingConnection(ws),
        IO.chain((guid) => this.logger.debug(`Accepted a new client with guid ${guid}`)),
      )(),
    );
    this.webSocketServer.on('error', (error: Error): void => {
      this.logger.error(`${error.name}: ${error.message}`)();
    });
  };

  private onIncomingConnection = (ws: WebSocket): IO.IO<string> => () => {
    const guid = Uuid.v4();
    const removeUser = () => {
      delete this.users[guid];
      this.logger.debug(`Removed user with guid ${guid}`)();
    };
    const user = createUser(
      this.logger,
      ws,
      this.config.inactivityTimeout,
      this.broadcast,
      this.nicknameAvailable,
      removeUser,
    );
    this.users[guid] = user;
    return guid;
  };

  shutdown = async () => {
    this.logger.info('Shutting down websocket server')();
    await this.broadcast(new ServerShutdown('Shutting down'))();
    this.webSocketServer?.close();
  };

  private broadcast = (message: OutgoingMessage) =>
    pipe(
      T.traverseArray<User, void>((user) => user.sendMessage(message))(Object.values(this.users)),
      T.map(constVoid),
    );

  private nicknameAvailable = (nickname: string) =>
    !Object.values(this.users).some((user) => user.getNickname() === nickname);
}

export const createChatServer = (logger: Logger, config: ServerConfig): ChatServer =>
  new ChatServerImpl(logger, config);

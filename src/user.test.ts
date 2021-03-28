import WebSocket from 'ws';
import * as E from 'fp-ts/lib/Either';
import { Logger } from './logger';
import { OutgoingMessage } from './message/outgoing/outgoingMessage';
import { createUser, User } from './user';
import { UserJoined } from './message/outgoing/userJoined';
import { OutgoingTell } from './message/outgoing/outgoingTell';
import { ConnectionClosed } from './message/outgoing/connectionClosed';

class SimpleMessage extends OutgoingMessage {
  constructor(jsonRecord: E.JsonRecord) {
    super(jsonRecord);
  }
}

describe('user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    user = createUser(logger, webSocket, inactivityTimeout, broadcast, nicknameAvailable, removeUser);
  });

  const logger: Logger = {
    error: () => jest.fn(),
    info: () => jest.fn(),
    debug: () => jest.fn(),
  };
  type WsCallback = (...args: unknown[]) => Promise<void>;
  const wsCallbacks: Record<string, WsCallback> = {};
  const webSocketOn = (messageType: string, f: WsCallback): void => {
    wsCallbacks[messageType] = f;
  };
  const webSocketSend = jest.fn().mockImplementation((data: unknown, cb: () => void) => {
    cb();
  });
  const webSocket: WebSocket = ({
    on: webSocketOn,
    terminate: jest.fn(),
    send: webSocketSend,
  } as unknown) as WebSocket;
  const inactivityTimeout = 1000;
  const broadcast = jest.fn();
  const nicknameAvailable = jest.fn();
  const removeUser = jest.fn();

  let user: User;

  it('should be able to send a messsage', async () => {
    const data = { a: 1 };
    await user.sendMessage(new SimpleMessage(data))();

    expect(webSocketSend).toBeCalled();
    expect(JSON.parse(webSocketSend.mock.calls[0][0])).toStrictEqual(data);
  });

  it('should be able to fetch the nickname', async () => {
    expect(user.getNickname()).toBeUndefined();

    nicknameAvailable.mockReturnValue(true);
    broadcast.mockReturnValue(jest.fn());

    const nicknameMessage = { command: 'NICKNAME', nickname: 'Ubiquiti', correlationId: '321' };
    await wsCallbacks['message'](JSON.stringify(nicknameMessage));
    expect(user.getNickname()).toBe('Ubiquiti');
    expect(broadcast).toBeCalled();
    expect(broadcast.mock.calls[0][0]).toBeInstanceOf(UserJoined);
  });

  it('should allow to set the nickname only once', async () => {
    nicknameAvailable.mockReturnValue(true);
    broadcast.mockReturnValue(jest.fn());

    const nicknameMessage = { command: 'NICKNAME', nickname: 'Ubiquiti', correlationId: '321' };
    await wsCallbacks['message'](JSON.stringify(nicknameMessage));
    expect(webSocketSend).toBeCalled();
    expect(JSON.parse(webSocketSend.mock.calls[0][0])).toStrictEqual({ command: 'Accepted', correlationId: '321' });

    webSocketSend.mockClear();
    const nicknameMessage2 = { command: 'NICKNAME', nickname: 'Ubiquitii2', correlationId: '321' };
    await wsCallbacks['message'](JSON.stringify(nicknameMessage2));
    expect(webSocketSend).toBeCalled();
    expect(JSON.parse(webSocketSend.mock.calls[0][0])).toStrictEqual({
      errorCode: 'nicknameSelected',
      reason: 'Nickname can be selected only once',
      correlationId: '321',
    });
  });

  it('should reject nickname change, if it is already taken', async () => {
    expect(user.getNickname()).toBeUndefined();

    nicknameAvailable.mockReturnValue(false);
    const nicknameMessage = { command: 'NICKNAME', nickname: 'Ubiquiti', correlationId: '321' };
    await wsCallbacks['message'](JSON.stringify(nicknameMessage));

    expect(webSocketSend).toBeCalled();
    expect(JSON.parse(webSocketSend.mock.calls[0][0])).toStrictEqual({
      errorCode: 'nicknameTaken',
      reason: 'Nickname Ubiquiti is already taken',
      correlationId: '321',
    });

    expect(user.getNickname()).toBeUndefined();
  });

  it('should reject a tell, if nickname is not selected', async () => {
    const tellMessage = { command: 'TELL', message: 'Hello!', correlationId: '321' };
    await wsCallbacks['message'](JSON.stringify(tellMessage));
    expect(webSocketSend).toBeCalled();
    expect(JSON.parse(webSocketSend.mock.calls[0][0])).toStrictEqual({
      errorCode: 'missingNickname',
      reason: 'Tell is available only after a nickname is specified',
      correlationId: '321',
    });
  });

  it('should broadcast tell otherwise', async () => {
    nicknameAvailable.mockReturnValue(true);
    broadcast.mockReturnValue(jest.fn());

    const nicknameMessage = { command: 'NICKNAME', nickname: 'Ubiquiti', correlationId: '321' };
    await wsCallbacks['message'](JSON.stringify(nicknameMessage));

    broadcast.mockClear();
    const tellMessage = { command: 'TELL', message: 'Hello!', correlationId: '321' };
    await wsCallbacks['message'](JSON.stringify(tellMessage));

    expect(broadcast).toBeCalled();
    expect(broadcast.mock.calls[0][0]).toBeInstanceOf(OutgoingTell);
  });

  it('should return an error, if incoming data is invalid', async () => {
    await wsCallbacks['message']('INVALID');
    expect(webSocketSend).toBeCalled();
    expect(JSON.parse(webSocketSend.mock.calls[0][0])).toMatchObject({
      errorCode: 'failed',
    });
  });

  it('should remove the user, when connection is closed', async () => {
    await wsCallbacks['close']();
    expect(removeUser).toBeCalled();
  });

  it('should broadcast message, that user has diconnected, if he had a nickname', async () => {
    const nicknameMessage = { command: 'NICKNAME', nickname: 'Ubiquiti', correlationId: '321' };
    await wsCallbacks['message'](JSON.stringify(nicknameMessage));

    broadcast.mockClear();
    await wsCallbacks['close']();
    expect(removeUser).toBeCalled();
    expect(broadcast).toBeCalled();
    expect(broadcast.mock.calls[0][0]).toBeInstanceOf(ConnectionClosed);
  });

  it('should force a disconnect of the user on inactivity', () => {
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), inactivityTimeout);
    expect(webSocket.terminate).not.toBeCalled();

    jest.advanceTimersByTime(inactivityTimeout);

    expect(webSocket.terminate).toBeCalled();
  });

  it('should keep user online, if there is any interaction', async () => {
    expect(webSocket.terminate).not.toBeCalled();

    jest.advanceTimersByTime(inactivityTimeout - 1);

    const nicknameMessage = { command: 'NICKNAME', nickname: 'Ubiquiti', correlationId: '321' };
    await wsCallbacks['message'](JSON.stringify(nicknameMessage));

    jest.advanceTimersByTime(inactivityTimeout - 1);

    const tellMessage = { command: 'TELL', message: 'Hello!', correlationId: '321' };
    await wsCallbacks['message'](JSON.stringify(tellMessage));

    jest.advanceTimersByTime(inactivityTimeout - 1);

    expect(webSocket.terminate).not.toBeCalled();
  });
});

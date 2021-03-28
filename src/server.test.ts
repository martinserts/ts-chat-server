import * as WebSocket from 'ws';
import { mocked } from 'ts-jest/utils';
import { ChatServer, createChatServer } from './server';
import { Logger } from './logger';
import { createUser, User } from './user';
import { ErrorResponse } from './message/outgoing/errorResponse';
import { ServerShutdown } from './message/outgoing/serverShutdown';

jest.mock('ws');
jest.mock('./user');

describe('server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatServer = createChatServer(logger, serverConfig);
  });

  const mockedServer = mocked(WebSocket.Server, true);
  const mockedCreateUser = mocked(createUser, true);
  const info = jest.fn().mockImplementation(() => jest.fn());
  const debug = jest.fn().mockImplementation(() => jest.fn());
  const logger: Logger = {
    error: () => jest.fn(),
    info,
    debug,
  };
  const serverConfig = {
    port: 8080,
    inactivityTimeout: 500,
  };
  let chatServer: ChatServer;

  describe('start', () => {
    it('should start a webSocket server', () => {
      const on = jest.fn();
      const server = ({ on } as unknown) as WebSocket.Server;
      mockedServer.mockImplementation(() => server);

      chatServer.start();
      expect(info).toBeCalledWith('Starting websocket server');
      expect(mockedServer).toBeCalledWith({ port: 8080 });
      expect(on).toBeCalledWith('connection', expect.any(Function));
    });
  });

  it('should create a user on new connection and remove, when it is closed', async () => {
    const on = jest.fn();
    const server = ({ on } as unknown) as WebSocket.Server;
    mockedServer.mockImplementation(() => server);

    chatServer.start();

    const onClient = jest.fn();
    const webSocket = ({ on: onClient, terminate: jest.fn() } as unknown) as WebSocket;
    const onConnectionCallback = on.mock.calls[0][1] as (ws: WebSocket) => void;

    const getNickname = jest.fn();
    const sendMessage = jest.fn().mockImplementation(() => jest.fn());
    const user = ({ sendMessage, getNickname } as unknown) as User;
    mockedCreateUser.mockReturnValue(user);

    onConnectionCallback(webSocket);
    expect(mockedCreateUser).toBeCalled();
    const broadcast = mockedCreateUser.mock.calls[0][3];
    const nicknameAvailable = mockedCreateUser.mock.calls[0][4];
    const removeUser = mockedCreateUser.mock.calls[0][5];

    getNickname.mockReturnValue('Ubiquiti');
    expect(nicknameAvailable('Dummy')).toBeTruthy();
    expect(nicknameAvailable('Ubiquiti')).toBeFalsy();

    const message = new ErrorResponse('CODE');
    await broadcast(message)();

    expect(sendMessage).toBeCalledWith(message);

    debug.mockClear();
    removeUser();
    expect(debug).toBeCalledWith(expect.stringContaining('Removed user with guid'));

    sendMessage.mockClear();
    await broadcast(new ErrorResponse('CODE'))();
    expect(sendMessage).not.toBeCalled();
  });

  describe('shutdown', () => {
    it('should broadcast shutdown message and stop the server', async () => {
      const on = jest.fn();
      const close = jest.fn();
      const server = ({ on, close } as unknown) as WebSocket.Server;
      mockedServer.mockImplementation(() => server);

      chatServer.start();

      const onClient = jest.fn();
      const webSocket = ({ on: onClient, terminate: jest.fn() } as unknown) as WebSocket;
      const onConnectionCallback = on.mock.calls[0][1] as (ws: WebSocket) => void;

      const sendMessage = jest.fn().mockImplementation(() => jest.fn());
      const user = ({ sendMessage, getNickname: jest.fn() } as unknown) as User;
      mockedCreateUser.mockReturnValue(user);

      onConnectionCallback(webSocket);

      await chatServer.shutdown();

      expect(info).toBeCalledWith('Shutting down websocket server');
      expect(sendMessage).toBeCalledWith(expect.any(ServerShutdown));
      expect(close).toBeCalled();
    });
  });
});

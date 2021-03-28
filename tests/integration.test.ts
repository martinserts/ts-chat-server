import { Logger } from '../src/logger';
import WebSocket = require('ws');
import { ChatServer, createChatServer } from '../src/server';

interface Response {
  command: string;
  nickname?: string;
  message?: string;
  correlationId?: string;
}

describe('server', () => {
  beforeAll(() => {
    chatServer = createChatServer(logger, serverConfig);
    chatServer.start();
  });

  afterAll(async () => {
    await chatServer.shutdown();
  });

  const logger: Logger = {
    error: () => jest.fn(),
    info: () => jest.fn(),
    debug: () => jest.fn(),
  };
  const serverConfig = {
    port: 8033,
    inactivityTimeout: 5000,
  };
  let chatServer: ChatServer;

  it('should accept websocket connections', () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${serverConfig.port}`);
      ws.on('open', () => {
        ws.close();
        resolve(true);
      });
      ws.on('error', () => {
        reject();
      });
    });
  });

  it('should be able to enter the chat and send a message', async (done) => {
    const ws = new WebSocket(`ws://localhost:${serverConfig.port}`);
    ws.on('open', () => {
      ws.send(JSON.stringify({ command: 'NICKNAME', nickname: 'Ubiquiti', correlationId: '1' }));
    })
      .on('message', (msg) => {
        try {
          if (typeof msg === 'string') {
            const json: Response = JSON.parse(msg);
            switch (json.command) {
              case 'Join':
                expect(json.nickname).toBe('Ubiquiti');
                ws.send(JSON.stringify({ command: 'TELL', message: 'Hello!', correlationId: '2' }));
                break;
              case 'Accepted':
                expect(['1', '2'].some((correlationId) => json.correlationId === correlationId)).toBeTruthy();
                break;
              case 'Tell':
                expect(json.nickname).toBe('Ubiquiti');
                expect(json.message).toBe('Hello!');
                ws.close();
                break;
              default:
                throw `Invalid command ${json.command} received`;
            }
          } else throw 'invalid message type';
        } catch (error) {
          done(error);
        }
      })
      .on('close', () => {
        done();
      })
      .on('error', (error) => {
        done(error);
      });
  });
});

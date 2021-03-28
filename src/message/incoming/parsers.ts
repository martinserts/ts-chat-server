import { MessageParser } from './incomingMessage';
import { nicknameParser } from './nicknameMessage';
import { tellParser } from './tellMessage';

export const getParsers = (): MessageParser[] => [nicknameParser, tellParser];

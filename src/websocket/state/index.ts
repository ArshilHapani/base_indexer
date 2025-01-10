/**
 * @fileoverview tokens state for websocket
 */

import type { Token } from '@/utils/types/external';
import { WebSocket } from 'ws';

import type { WsMessage } from '..';

export const tokens: Token[] = [];

export const sendedTokens = new Map<WebSocket, Set<string>>();

export const channels = new Map<WsMessage['channel'], Set<WebSocket>>();

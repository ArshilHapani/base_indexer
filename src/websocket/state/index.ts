/**
 * @fileoverview tokens state for websocket
 */

import type { Token } from '@/utils/types/external';
import { WebSocket } from 'ws';

export const tokens: Token[] = [];

export const sendedTokens = new Map<WebSocket, Set<string>>();

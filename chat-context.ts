/**
 * @fileoverview App-wide context for the J Agent chat.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext } from '@lit/context';
import { FunctionCall } from '@google/genai';

export type Message = {
    role: 'user' | 'model';
    text: string;
    toolCalls?: FunctionCall[];
    timestamp: string;
};

export type ChatContext = {
    messages: Message[];
    sendMessage: (text: string) => Promise<void>;
    isLoading: boolean;
};

export const chatContext = createContext<ChatContext>('chat-context');

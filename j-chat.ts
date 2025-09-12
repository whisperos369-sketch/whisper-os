/**
 * @fileoverview A real-time chat component to interact with J Agent.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {css, html, LitElement, svg} from 'lit';
import {customElement, state, query} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {consume} from '@lit/context';
import {chatContext, ChatContext} from '@/chat-context.ts';
import {FunctionCall} from '@google/genai';
import { hapticFeedback } from '@/utils.ts';
import { sharedStyles } from '@/shared-styles.ts';

// Type definitions for Web Speech API to fix compile-time error.
interface SpeechRecognitionAlternative {
    readonly transcript: string;
}
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: SpeechRecognitionAlternative;
    readonly length: number;
}
interface SpeechRecognitionResultList {
    readonly [index: number]: SpeechRecognitionResult;
    readonly length: number;
}
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    start(): void;
    stop(): void;
}
declare var SpeechRecognition: { new(): SpeechRecognition };
declare var webkitSpeechRecognition: { new(): SpeechRecognition };

@customElement('j-chat')
export class JChat extends LitElement {
    @state() private isOpen = false;
    @state() private isRecording = false;
    @state() private manualStop = false;
    @state() private commandProcessed = false;
    @state() private lastModelMessageText = '';
    @state() private wasLoading = false;
    @state() private isSpeechEnabled = localStorage.getItem('j-chat-speech-enabled') === 'true';

    @consume({context: chatContext, subscribe: true})
    @state()
    private chatContext?: ChatContext;

    @query('#chat-input') private chatInput!: HTMLInputElement;
    @query('.chat-history') private chatHistory!: HTMLElement;

    private recognition: SpeechRecognition | null = null;
    private synth: SpeechSynthesis | null = null;

    static styles = [
      sharedStyles,
      css`
      :host {
        position: fixed;
        bottom: calc(var(--player-height, 90px) + 24px);
        right: 24px;
        z-index: 1000;
      }
      .chat-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--accent-primary-gradient);
        color: var(--text-on-accent);
        border: none;
        box-shadow: 0 4px 20px var(--shadow-color);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .chat-toggle:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 25px var(--glow-color);
      }
      .chat-toggle svg {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .chat-toggle.open svg {
        transform: rotate(45deg);
      }

      .chat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 500px;
        background: var(--bg-panel);
        backdrop-filter: var(--backdrop-blur);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        
        /* Animation */
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
      }
      .chat-window.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .chat-header {
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
        font-weight: 600;
        color: var(--text-primary);
        flex-shrink: 0;
      }
      .chat-history {
        flex-grow: 1;
        overflow-y: auto;
        padding: var(--spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }
      .message {
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius);
        max-width: 80%;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .user-message {
        background-color: var(--accent-primary);
        color: var(--text-on-accent);
        align-self: flex-end;
        border-radius: 12px 12px 2px 12px;
      }
      .model-message {
        background-color: var(--bg-input);
        color: var(--text-secondary);
        align-self: flex-start;
        border-radius: 12px 12px 12px 2px;
      }
      .loading-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
      }
      .loading-indicator .spinner {
          width: 18px;
          height: 18px;
          color: var(--text-secondary);
      }
      .loading-indicator span {
          font-size: 0.9rem;
          color: var(--text-tertiary);
      }
      .chat-input-area {
        padding: var(--spacing-md);
        border-top: 1px solid var(--border-color);
        display: flex;
        gap: var(--spacing-sm);
        flex-shrink: 0;
      }
      .chat-input-area input {
        flex-grow: 1;
      }
    `];

    // FIX: Removed incorrect 'override' modifier.
    // FIX: Cast window to 'any' to access non-standard SpeechRecognition APIs.
    firstUpdated() {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
            this.recognition = new SpeechRecognitionAPI();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.onresult = this.handleRecognitionResult.bind(this);
            this.recognition.onend = this.handleRecognitionEnd.bind(this);
        }
        if ('speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
        }
    }

    // FIX: Removed incorrect 'override' modifier.
    updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('chatContext') || this.wasLoading) {
            this.chatHistory?.scrollTo({ top: this.chatHistory.scrollHeight, behavior: 'smooth' });
            
            const isLoading = this.chatContext?.isLoading ?? false;
            if (this.wasLoading && !isLoading) {
                const lastMessage = this.chatContext?.messages[this.chatContext.messages.length - 1];
                if (lastMessage?.role === 'model' && lastMessage.text !== this.lastModelMessageText) {
                    this.speak(lastMessage.text);
                    this.lastModelMessageText = lastMessage.text;
                }
            }
            this.wasLoading = isLoading;
        }
    }

    private _toggleChat() {
        hapticFeedback();
        this.isOpen = !this.isOpen;
    }

    private handleSendMessage(e: KeyboardEvent) {
        if (e.key === 'Enter' && this.chatInput.value.trim() !== '' && !this.chatContext?.isLoading) {
            this.chatContext?.sendMessage(this.chatInput.value.trim());
            this.chatInput.value = '';
        }
    }

    private toggleRecording() {
        hapticFeedback();
        if (this.isRecording) {
            this.manualStop = true;
            this.recognition?.stop();
        } else {
            this.manualStop = false;
            this.commandProcessed = false;
            this.recognition?.start();
            this.isRecording = true;
        }
    }

    private handleRecognitionResult(event: SpeechRecognitionEvent) {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        if (finalTranscript.trim() && !this.commandProcessed) {
            this.commandProcessed = true; // Prevents multiple sends from the same utterance
            this.chatContext?.sendMessage(finalTranscript.trim());
            this.manualStop = true;
            this.recognition?.stop();
        }
    }

    private handleRecognitionEnd() {
        this.isRecording = false;
        if (!this.manualStop) {
            this.recognition?.start();
        }
    }

    private speak(text: string) {
        if (!this.synth || !this.isSpeechEnabled) return;
        this.synth.cancel(); // Cancel any previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        this.synth.speak(utterance);
    }
    
    private _toggleSpeechOutput(e: Event) {
        const checked = (e.target as HTMLInputElement).checked;
        this.isSpeechEnabled = checked;
// FIX: Corrected String(checked) to checked.toString() to resolve callable expression error.
        localStorage.setItem('j-chat-speech-enabled', checked.toString());
        if (!checked) {
            this.synth?.cancel();
        }
    }

    render() {
        const { messages, isLoading } = this.chatContext ?? { messages: [], isLoading: false };

        return html`
            <div class="chat-container">
                <div class="chat-window ${classMap({ open: this.isOpen })}">
                    <div class="chat-header">J Agent</div>
                    <div class="chat-history">
                        ${messages.map(msg => html`
                            <div class="message ${msg.role}-message">${msg.text}</div>
                        `)}
                        ${isLoading ? html`
                            <div class="model-message loading-indicator">
                                <svg class="spinner" viewBox="0 0 50 50" width="18" height="18"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>
                                <span>Typing...</span>
                            </div>` : ''}
                    </div>
                    <div class="chat-input-area">
                        <input id="chat-input" type="text" placeholder="Ask J Agent..." @keydown=${this.handleSendMessage} ?disabled=${isLoading}>
                        <button class="icon-button ${classMap({ active: this.isRecording })}" @click=${this.toggleRecording} title="Voice Command">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/></svg>
                        </button>
                    </div>
                </div>
                <button class="chat-toggle ${classMap({ open: this.isOpen })}" @click=${this._toggleChat} title=${this.isOpen ? 'Close Chat' : 'Open Chat'}>
                    <svg viewBox="0 0 24 24" width="32" height="32"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </button>
            </div>
        `;
    }
}
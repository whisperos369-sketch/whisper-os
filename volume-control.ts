/**
 * @fileoverview A reusable component for volume controls.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { hapticFeedback } from '@/utils.ts';

@customElement('volume-control')
export class VolumeControl extends LitElement {
    @property({ type: Number })
    volume = 1;

    @property({ type: Boolean })
    muted = false;

    static styles = css`
        .volume-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .volume-slider {
            width: 80px;
            -webkit-appearance: none;
            height: 6px;
            background: var(--bg-input);
            border-radius: 5px;
            outline: none;
            padding: 0;
            transition: opacity 0.2s;
        }
        .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            background: var(--accent-primary);
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid var(--bg-panel);
        }
        .volume-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: var(--accent-primary);
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid var(--bg-panel);
        }
        
        .volume-button {
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            transition: background-color 0.2s, color 0.2s;
            padding: 0;
        }
        .volume-button:hover:not(:disabled) {
            background-color: var(--bg-input);
            color: var(--text-primary);
        }
    `;

    private _handleVolumeChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const newVolume = parseFloat(target.value);
        (this as LitElement).dispatchEvent(new CustomEvent('volume-change', {
            bubbles: true,
            composed: true,
            detail: { volume: newVolume }
        }));
    }

    private _toggleMute() {
        hapticFeedback();
        (this as LitElement).dispatchEvent(new CustomEvent('mute-toggle', {
            bubbles: true,
            composed: true
        }));
    }

    private _getVolumeIcon() {
        if (this.muted || this.volume === 0) {
            return svg`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
        } else if (this.volume < 0.5) {
            return svg`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>`;
        } else {
            return svg`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
        }
    }

    render() {
        return html`
            <div class="volume-container">
                <button class="volume-button" @click=${this._toggleMute} aria-label=${this.muted ? "Unmute" : "Mute"}>
                    ${this._getVolumeIcon()}
                </button>
                <input
                    type="range"
                    class="volume-slider"
                    min="0"
                    max="1"
                    step="0.01"
                    .value=${String(this.volume)}
                    @input=${this._handleVolumeChange}
                    @mousedown=${() => hapticFeedback(5)}
                    @mouseup=${() => hapticFeedback(5)}
                >
            </div>
        `;
    }
}
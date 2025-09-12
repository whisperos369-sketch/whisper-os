/**
 * @fileoverview The "LoRA Training" utility component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, css, nothing } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';

import { sharedStyles } from './shared-styles.ts';
import { StudioModule } from './studio-module.ts';
import { appContext, Lora } from './context.ts';

import './file-link-input.ts';

// Basic placeholder types
interface LogEntry {
    level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    msg: string;
}

type LoraTrainingType = 'sound' | 'vocal';

@customElement('lora-training-utility')
export class LoraTrainingUtility extends StudioModule {
    private appContextConsumer = new ContextConsumer(this, { context: appContext, subscribe: true });

    @state() private isDragOver = false;
    @state() private datasetFiles: File[] = [];
    @state() private datasetUrl = '';
    @state() private trainingLogs: LogEntry[] = [];
    @state() private trainingType: LoraTrainingType = 'sound';
    @state() private isProcessingFiles = false;

    @state() private showTestModal = false;
    @state() private testingLora: Lora | null = null;
    @state() private isGeneratingTestSample = false;
    @state() private testLoraTemperature = 0.7;
    @state() private testLoraGuidanceScale = 7.5;

    @query('#lora-training-section') private loraTrainingSection!: HTMLElement;

    static styles = [
        sharedStyles,
        css`
            .drop-zone {
                border: 2px dashed var(--border-color);
                border-radius: 12px;
                padding: 2rem;
                text-align: center;
                cursor: pointer;
            }
            .drop-zone.dragover {
                border-color: var(--accent-primary);
                background-color: var(--bg-hover);
            }
            .logs {
                font-family: monospace;
                font-size: 0.75rem;
                max-height: 150px;
                overflow-y: auto;
                background: var(--bg-panel);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 0.5rem;
            }
            .log-entry + .log-entry {
                margin-top: 0.25rem;
            }
        `,
    ];

    private _handleDragOver(e: DragEvent) {
        e.preventDefault();
        this.isDragOver = true;
    }

    private _handleDragLeave(e: DragEvent) {
        e.preventDefault();
        this.isDragOver = false;
    }

    private _handleDrop(e: DragEvent) {
        e.preventDefault();
        this.isDragOver = false;
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length) {
            this.datasetFiles = files;
            this.trainingLogs.push({ level: 'INFO', msg: `Added ${files.length} file(s)` });
        }
    }

    private _handleFileInput(e: Event) {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length) {
            this.datasetFiles = Array.from(files);
            this.trainingLogs.push({ level: 'INFO', msg: `Selected ${files.length} file(s)` });
        }
    }

    private _startTraining() {
        if (!this.datasetFiles.length && !this.datasetUrl) {
            this.trainingLogs.push({ level: 'ERROR', msg: 'No dataset provided' });
            return;
        }
        this.trainingLogs.push({ level: 'INFO', msg: 'Starting training (stub)...' });
        setTimeout(() => {
            this.trainingLogs.push({ level: 'SUCCESS', msg: 'Training complete' });
            this.requestUpdate();
        }, 1000);
    }

    private _renderLogs() {
        return html`
            <div class="logs">
                ${this.trainingLogs.map(l => html`<div class="log-entry ${l.level.toLowerCase()}">${l.msg}</div>`)}
            </div>
        `;
    }

    render() {
        return html`
            <section id="lora-training-section">
                <div
                    class="drop-zone ${this.isDragOver ? 'dragover' : ''}"
                    @dragover=${this._handleDragOver}
                    @dragleave=${this._handleDragLeave}
                    @drop=${this._handleDrop}
                    @click=${() => this.shadowRoot?.getElementById('file-input')?.click()}
                >
                    <p>${this.datasetFiles.length ? `${this.datasetFiles.length} file(s) selected` : 'Drop dataset files here or click to browse'}</p>
                    <input id="file-input" type="file" multiple hidden @change=${this._handleFileInput} />
                </div>

                <file-link-input
                    label="Dataset URL"
                    .value=${this.datasetUrl}
                    @value-changed=${(e: CustomEvent<string>) => { this.datasetUrl = e.detail; }}
                ></file-link-input>

                <div class="mt-2">
                    <label>
                        <input type="radio" name="ttype" value="sound" ?checked=${this.trainingType === 'sound'} @change=${() => (this.trainingType = 'sound')} />
                        Sound
                    </label>
                    <label class="ml-4">
                        <input type="radio" name="ttype" value="vocal" ?checked=${this.trainingType === 'vocal'} @change=${() => (this.trainingType = 'vocal')} />
                        Vocal
                    </label>
                </div>

                <button class="button mt-4" @click=${this._startTraining}>Train</button>

                ${this.trainingLogs.length ? this._renderLogs() : nothing}
            </section>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'lora-training-utility': LoraTrainingUtility;
    }
}


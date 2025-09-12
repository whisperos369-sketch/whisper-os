/**
 * @fileoverview The "LoRA Lab" module for training custom models.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, svg, css, LitElement } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';
import { classMap } from 'lit/directives/class-map.js';

import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';
import { appContext, Lora } from '@/context.ts';
import { taskService } from '@/task-service.ts';
import { beatAgent } from '@/beat-agent.ts';
import '@/file-link-input.ts';

type LoraTrainingType = 'sound' | 'vocal';

@customElement('lora-lab-module')
export class LoraLabModule extends StudioModule {
    private appContextConsumer = new ContextConsumer(this, {context: appContext, subscribe: true});

    @state() private isDragOver = false;
    @state() private datasetFiles: File[] = [];
    @state() private trainingType: LoraTrainingType = 'sound';
    @state() private isProcessingFiles = false;
    
    // LoRA Test Modal State
    @state() private showTestModal = false;
    @state() private testingLora: Lora | null = null;
    @state() private testLoraTemperature = 0.7;
    @state() private testLoraGuidanceScale = 7.5;
    
    @query('#lora-training-section') private loraTrainingSection!: HTMLElement;

    private _triggerFileInputClick() {
        // FIX: Cast `this` to `LitElement` to access `shadowRoot`.
        (this as LitElement).shadowRoot?.querySelector<HTMLInputElement>('#dataset-upload')?.click();
    }

    private async _handleTrain() {
        this.errorMessage = '';
        
        // FIX: Cast `this` to `LitElement` to access `shadowRoot`.
        const nameInput = (this as LitElement).shadowRoot!.querySelector('#lora-name-input') as HTMLInputElement;
        // FIX: Cast `this` to `LitElement` to access `shadowRoot`.
        const epochsInput = (this as LitElement).shadowRoot!.querySelector<HTMLInputElement>('#lora-epochs-input');
        const totalEpochs = parseInt(epochsInput?.value ?? '10', 10);
        const modelName = nameInput.value;
        
        const task = async () => {
            await new Promise(r => setTimeout(r, totalEpochs * 500)); // Simulate training time
            
            const newLora: Lora = { name: modelName, epochs: totalEpochs, type: this.trainingType };
            
            // FIX: Cast `this` to `LitElement` to access `dispatchEvent`.
            (this as LitElement).dispatchEvent(new CustomEvent('add-or-update-lora', { detail: newLora, bubbles: true, composed: true }));
            // FIX: Cast `this` to `LitElement` to access `dispatchEvent`.
            (this as LitElement).dispatchEvent(new CustomEvent('show-toast', { detail: { message: `LoRA "${newLora.name}" training complete!`, type: 'success'}, bubbles: true, composed: true }));
            
            return newLora;
        };
        
        const stages = [
            { message: 'Initializing & Validating Dataset...', duration: 2000 },
            ...Array.from({ length: totalEpochs }, (_, i) => ({ message: `Training Epoch ${i + 1}/${totalEpochs}`, duration: 500 })),
            { message: 'Finalizing and saving model...', duration: 1500 }
        ];

        await this._performTask(`Train LoRA: ${modelName}`, stages, task);
    }
    
    private async _processAndAddFiles(files: FileList | File[]) {
        const audioContext = this.appContextConsumer.value?.audioContext;
        if (!audioContext) {
            this.errorMessage = 'Audio context not available for file validation.';
            return;
        }

        this.isProcessingFiles = true;
        this.statusMessage = 'Validating audio files...';
        this.errorMessage = '';

        const newFiles: File[] = [];
        let invalidFileCount = 0;

        for (const file of Array.from(files)) {
            try {
                if (file.size > 50 * 1024 * 1024) throw new Error('File is too large (> 50MB)');
                const arrayBuffer = await file.arrayBuffer();
                await audioContext.decodeAudioData(arrayBuffer);
                newFiles.push(file);
            } catch (err) {
                console.error(`Error processing file ${file.name}:`, err);
                invalidFileCount++;
            }
        }
        
        this.datasetFiles = [...this.datasetFiles, ...newFiles];
        if (invalidFileCount > 0) {
            this.errorMessage = `${invalidFileCount} file(s) could not be loaded.`;
        }
        this.isProcessingFiles = false;
        this.statusMessage = '';
    }

    private _handleTestLora(lora: Lora) {
        this.testingLora = lora;
        this.showTestModal = true;
    }

    private _closeTestModal() {
        this.showTestModal = false;
        this.testingLora = null;
    }

    private async _handleGenerateTestSample() {
        const appContext = this.appContextConsumer.value;
        if (!appContext?.audioContext || !this.testingLora) return;

        const task = async () => {
            const buffer = await beatAgent.generateInstrumental({
                audioContext: appContext.audioContext!,
                duration: 5,
                bpm: 120,
                keySignature: 'C Major',
                instrumentalDescriptions: {
                    drums: `a test drum beat`,
                    bassline: `a test bassline`,
                    melody: `a test melody with the characteristic sound of ${this.testingLora!.name}`,
                    pads: `test pads`,
                }
            });
            appContext.updateTrack({ title: `Test: ${this.testingLora!.name}`, artist: 'LoRA Lab', duration: 5, audioBuffer: buffer });
            this._closeTestModal();
        };
        
        await this._performTask(`Generate LoRA Test Sample`, [{message: 'Generating test sample...', duration: 3000}], task);
    }

    private _renderTestModal() {
        if (!this.showTestModal || !this.testingLora) return null;
        return html`
            <div class="modal-overlay" @click=${this._closeTestModal}>
                <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
                    <div class="modal-header">
                        <h3>Test Model: ${this.testingLora.name}</h3>
                        <button class="close-button" @click=${this._closeTestModal}>&times;</button>
                    </div>
                    <p class="sub-label">Generate a short audio sample to hear the character of this sound model.</p>
                    <div class="row">
                        <div class="slider-container">
                            <label>Temperature: ${this.testLoraTemperature.toFixed(2)}</label>
                            <input type="range" min="0" max="1.5" step="0.01" .value=${String(this.testLoraTemperature)} @input=${(e: Event) => this.testLoraTemperature = parseFloat((e.target as HTMLInputElement).value)}>
                        </div>
                        <div class="slider-container">
                            <label>Guidance Scale: ${this.testLoraGuidanceScale.toFixed(1)}</label>
                            <input type="range" min="1" max="20" step="0.5" .value=${String(this.testLoraGuidanceScale)} @input=${(e: Event) => this.testLoraGuidanceScale = parseFloat((e.target as HTMLInputElement).value)}>
                        </div>
                    </div>
                    <div class="modal-footer" style="text-align: right; margin-top: 1rem;">
                        <button @click=${this._handleGenerateTestSample} ?disabled=${this.isLoading} class="primary">
                            ${this.isLoading ? 'Generating...' : 'Generate Sample'}
                        </button>
                    </div>
                    ${this.renderProgressIndicator()}
                </div>
            </div>
        `;
    }

    static styles = [ sharedStyles, css`/* Styles here */` ];
    
    render() {
        const trainedLoras = this.appContextConsumer.value?.trainedLoras ?? [];
        return html`
            <div class="panel">
                <h2 class="page-title">LoRA Lab</h2>
                <div class="control-group">
                    <h3>My Trained Models</h3>
                    ${trainedLoras.map(lora => html`
                        <div class="lora-item">
                            <span><strong>${lora.name}</strong> <span class="sub-label">(${lora.type || 'sound'})</span></span>
                            <div class="lora-item-actions">
                                <button @click=${() => this._handleTestLora(lora)}>Test</button>
                            </div>
                        </div>
                    `)}
                </div>
                <div id="lora-training-section" class="control-group">
                    <h3>Model Training</h3>
                    <div class="well">
                        <div class="row">
                            <div>
                                <label>Model Name</label>
                                <input id="lora-name-input" type="text" placeholder="my_custom_sound">
                            </div>
                            <div>
                                <label>Epochs</label>
                                <input id="lora-epochs-input" type="number" value="10">
                            </div>
                        </div>
                        <div style="margin-top: 1rem;">
                            <label>Training Dataset</label>
                            <file-link-input .showRadioToggle=${false} @file-change=${(e: CustomEvent) => this.datasetFiles = e.detail.file ? [e.detail.file] : []}></file-link-input>
                        </div>
                        <div style="text-align: right; margin-top: 1.5rem;">
                            <button class="primary" @click=${this._handleTrain} ?disabled=${this.isLoading || this.datasetFiles.length === 0}>Start Training</button>
                        </div>
                    </div>
                    ${this.renderProgressIndicator()}
                </div>
                ${this._renderTestModal()}
            </div>
        `;
    }
}

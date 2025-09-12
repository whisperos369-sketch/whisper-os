/**
 * @fileoverview The "Presets" mode component for streamlined creation.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ContextConsumer } from '@lit/context';

import { sharedStyles } from './shared-styles.ts';
import { StudioModule } from './studio-module.ts';
import { PRESETS, Preset, PresetId } from './presets.ts';
import { MOODS, STANDARD_VOCAL_MODELS } from './data.ts';
import { appContext } from './context.ts';
import { aiService } from '@/ai-service.ts';
import type { AutoMashupPlan } from './schema.ts';
import { beatAgent } from './beat-agent.ts';

// Import the new file input component
import './file-link-input.ts';

@customElement('presets-mode')
export class PresetsMode extends StudioModule {
    private appContextConsumer = new ContextConsumer(this, {context: appContext, subscribe: true});

    @state() private selectedPreset: PresetId | null = null;
    
    // State for inputs
    @state() private prompt = '';
    @state() private vibe = 'Chill';
    @state() private leadVoice = STANDARD_VOCAL_MODELS[0];
    @state() private fileA: File | null = null;
    @state() private fileB: File | null = null;
    @state() private isFetchingFileA = false;
    @state() private isFetchingFileB = false;
    
    // State for results
    @state() private mashupPlan: AutoMashupPlan | null = null;

    static override styles = [
        sharedStyles,
        css`
            .presets-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
            }
            .preset-card {
                border: 2px solid var(--border-color);
                border-radius: 12px;
                padding: 1.5rem;
                cursor: pointer;
                transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s, box-shadow 0.2s;
                position: relative;
                background-color: var(--bg-panel);
            }
            .preset-card:hover {
                border-color: var(--accent-primary-hover);
                transform: translateY(-4px);
            }
            .preset-card.selected {
                border-color: var(--accent-primary);
                background-color: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-panel));
                box-shadow: 0 0 15px var(--glow-color);
            }
            .preset-card h4 {
                margin: 0 0 0.8rem 0;
                color: var(--text-primary);
            }
            .preset-card p {
                font-size: 0.85rem;
                line-height: 1.6;
                color: var(--text-secondary);
                margin: 0;
            }
            .form-container {
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 1px solid var(--border-color);
            }
            .mashup-plan {
                margin-top: 1.5rem;
            }
            .mashup-plan pre {
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 0.85rem;
                line-height: 1.6;
                color: var(--text-secondary);
                background-color: var(--bg-input);
                padding: 0.8rem;
                border-radius: 8px;
                border: 1px solid var(--border-color);
            }
        `
    ];
    
    firstUpdated() {
        this._updatePrimaryAction();
    }

    updated(changedProperties: Map<string, unknown>) {
        if (
            changedProperties.has('selectedPreset') ||
            changedProperties.has('prompt') ||
            changedProperties.has('fileA') ||
            changedProperties.has('fileB') ||
            changedProperties.has('isLoading')
        ) {
            this._updatePrimaryAction();
        }
    }

    private _updatePrimaryAction() {
        let disabled = this.isLoading || !this.selectedPreset;
        if (this.selectedPreset === 'viral-hook' && !this.prompt) disabled = true;
        if (this.selectedPreset === 'full-cover' && (!this.fileA || !this.prompt)) disabled = true;
        if (this.selectedPreset === 'mashup' && (!this.fileA || !this.fileB)) disabled = true;
        
        (this as LitElement).dispatchEvent(new CustomEvent('primary-action-update', {
            detail: {
                label: 'Generate',
                action: this._runSelectedPreset.bind(this),
                disabled,
            },
            bubbles: true,
            composed: true,
        }));
    }

    public triggerQuickDrop(prompt: string, vibe: string, leadVoice: string) {
        this.selectedPreset = 'viral-hook';
        this.prompt = prompt;
        this.vibe = vibe;
        this.leadVoice = leadVoice;
        (this as LitElement).requestUpdate(); // Ensure UI reflects the changes
        this._runSelectedPreset();
    }

    private async _runSelectedPreset() {
        const appContext = this.appContextConsumer.value;
        if (!appContext?.audioContext || !this.selectedPreset) return;

        this.mashupPlan = null;
        this.errorMessage = '';
        
        const task = async () => {
            switch (this.selectedPreset) {
                case 'viral-hook':
                    const hookResult = await aiService.runQuickDrop(
                        this.prompt, this.vibe, this.leadVoice, [], appContext.explicitContentFilter, {} as any, 'social'
                    );
                    const hookBuffer = await beatAgent.generateInstrumental({
                        audioContext: appContext.audioContext!,
                        duration: 40,
                        bpm: hookResult.bpm,
                        keySignature: 'C Minor', // Mock key
                        instrumentalDescriptions: {
                            drums: `a ${hookResult.genre} drum beat`,
                            bassline: `a ${hookResult.genre} bassline`,
                            melody: `a catchy melody for a song about ${this.prompt}`,
                            pads: 'atmospheric pads',
                        }
                    });
                    appContext.updateTrack({
                        title: hookResult.title,
                        artist: 'Preset Engine',
                        duration: hookBuffer.duration,
                        audioBuffer: hookBuffer,
                    });
                    break;
                case 'full-cover':
                    const coverBuffer = await beatAgent.generateInstrumental({
                        audioContext: appContext.audioContext!,
                        duration: 120, // Mock duration for a full song
                        bpm: 120, // Mock BPM
                        keySignature: 'A Minor', // Mock key
                        instrumentalDescriptions: {
                            drums: `a drum beat for a ${this.prompt} cover`,
                            bassline: `a bassline for a ${this.prompt} cover`,
                            melody: `a melody for a ${this.prompt} cover`,
                            pads: `pads for a ${this.prompt} cover`,
                        }
                    });
                     appContext.updateTrack({
                        title: `${this.fileA?.name} (${this.prompt} Cover)`,
                        artist: 'Preset Engine',
                        duration: coverBuffer.duration,
                        audioBuffer: coverBuffer,
                    });
                    break;
                case 'mashup':
                    const plan = await aiService.runAutoMashup(this.fileA!, this.fileB!);
                    this.mashupPlan = plan;
                    // Mock audio generation for mashup
                    const mashupBuffer = await beatAgent.generateInstrumental({
                         audioContext: appContext.audioContext!,
                         duration: 90,
                         bpm: plan!.adjustments.targetBpm,
                         keySignature: plan!.adjustments.targetKey,
                         instrumentalDescriptions: {
                             drums: 'mashup drums',
                             bassline: 'mashup bassline',
                             melody: 'mashup melody',
                             pads: 'mashup pads',
                         }
                    });
                    appContext.updateTrack({
                        title: `Mashup: ${this.fileA?.name} vs ${this.fileB?.name}`,
                        artist: 'Preset Engine',
                        duration: mashupBuffer.duration,
                        audioBuffer: mashupBuffer,
                    });
                    break;
            }
        };

        const presetInfo = PRESETS.find(p => p.id === this.selectedPreset);
        await this._performTask(`Preset: ${presetInfo?.title}`, [{ message: 'Generating with preset...', duration: 4000 }], task);
    }
    
    private _handleSelectPreset(id: PresetId) {
        this.selectedPreset = (this.selectedPreset === id) ? null : id;
        // Reset inputs
        this.prompt = '';
        this.vibe = 'Chill';
        this.leadVoice = STANDARD_VOCAL_MODELS[0];
        this.fileA = null;
        this.fileB = null;
        this.isFetchingFileA = false;
        this.isFetchingFileB = false;
        this.mashupPlan = null;
    }

    private _renderInputs(preset: Preset) {
        const vocalLoras = this.appContextConsumer.value?.trainedLoras.filter(l => l.type === 'vocal') ?? [];
        const allVocalModels = [...STANDARD_VOCAL_MODELS, ...vocalLoras.map(l => l.name)];

        const renderPrompt = () => html`
            <div>
                <label for="preset-prompt">Creative Prompt</label>
                <textarea id="preset-prompt" .value=${this.prompt} @input=${(e: Event) => this.prompt = (e.target as HTMLTextAreaElement).value} placeholder="e.g., a cinematic trap beat about exploring a new city"></textarea>
            </div>
        `;

        const renderVibe = () => html`
            <div>
                <label for="preset-vibe">Vibe</label>
                <select id="preset-vibe" .value=${this.vibe} @change=${(e: Event) => this.vibe = (e.target as HTMLSelectElement).value}>
                    ${MOODS.map(m => html`<option value=${m}>${m}</option>`)}
                </select>
            </div>
        `;

        const renderLeadVoice = () => html`
            <div>
                <label for="preset-lead-voice">Lead Voice</label>
                <select id="preset-lead-voice" .value=${this.leadVoice} @change=${(e: Event) => this.leadVoice = (e.target as HTMLSelectElement).value}>
                    ${allVocalModels.map(m => html`<option value=${m}>${m}</option>`)}
                </select>
            </div>
        `;
        
        const renderFileA = () => html`
            <div>
                <label>Source A (Acapella for Cover/Mashup)</label>
                <file-link-input @file-change=${(e: CustomEvent) => { this.fileA = e.detail.file; this.isFetchingFileA = e.detail.isLoading; }}></file-link-input>
            </div>
        `;
        
        const renderFileB = () => html`
            <div>
                <label>Source B (Instrumental for Mashup)</label>
                <file-link-input @file-change=${(e: CustomEvent) => { this.fileB = e.detail.file; this.isFetchingFileB = e.detail.isLoading; }}></file-link-input>
            </div>
        `;

        return html`
            <div class="row" style="grid-template-columns: 1fr;">
                ${preset.inputs.includes('prompt') ? renderPrompt() : ''}
                ${preset.inputs.includes('vibe') ? renderVibe() : ''}
                ${preset.inputs.includes('lead-voice') ? renderLeadVoice() : ''}
                ${preset.inputs.includes('file-a') ? renderFileA() : ''}
                ${preset.inputs.includes('file-b') ? renderFileB() : ''}
            </div>
        `;
    }
    
    render() {
        const selectedPresetData = PRESETS.find(p => p.id === this.selectedPreset);
        return html`
            <div class="panel">
                <h2 class="page-title">Presets</h2>
                <div class="control-group">
                    <h3>Choose a Workflow</h3>
                    <p class="sub-label">Select a preset to begin a streamlined creation process with a specific goal in mind.</p>
                    <div class="presets-grid">
                        ${PRESETS.map(preset => html`
                            <div class="preset-card ${classMap({selected: this.selectedPreset === preset.id})}" @click=${() => this._handleSelectPreset(preset.id)}>
                                <h4>${preset.title}</h4>
                                <p>${preset.description}</p>
                            </div>
                        `)}
                    </div>
                </div>

                ${selectedPresetData ? html`
                    <div class="control-group form-container">
                        <h3>Configure: ${selectedPresetData.title}</h3>
                        ${this._renderInputs(selectedPresetData)}
                    </div>
                ` : ''}

                ${this.renderProgressIndicator()}
                ${this.renderErrorMessage()}

                ${this.mashupPlan ? html`
                    <div class="control-group mashup-plan">
                        <h3>Mashup Plan</h3>
                        <pre>${JSON.stringify(this.mashupPlan, null, 2)}</pre>
                    </div>
                ` : ''}
            </div>
        `;
    }
}
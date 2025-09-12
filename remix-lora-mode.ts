

/**
 * @fileoverview The "Remix" mode component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, svg, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';

import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';
import { appContext } from '@/context.ts';
import { aiService } from '@/ai-service.ts';
import { GENRES, STANDARD_VOCAL_MODELS } from '@/data.ts';
import { audioBufferToWav } from '@/utils.ts';
import { audioIntelService } from '@/audio-intel.ts';
import type { Analysis, Stems } from '@/audio-intel.ts';
import type { SmartLoraSelection } from '@/schema.ts';
import { beatAgent } from '@/beat-agent.ts';
import '@/file-link-input.ts';

@customElement('remix-lora-mode')
export class RemixLoraMode extends StudioModule {
    private appContextConsumer = new ContextConsumer(this, {context: appContext, subscribe: true});

    @state() private generatedRemixPlan = '';
    @state() private isRemixGenerated = false;
    
    // Remix state
    @state() private remixSourceFile: File | null = null;
    @state() private audioAnalysis: Analysis | null = null;
    @state() private audioStems: Stems | null = null;
    @state() private smartLoraSelection: SmartLoraSelection | null = null;
    @state() private analysisStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';
    @state() private stemSeparationStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';
    @state() private analysisError = '';
    @state() private stemSeparationError = '';
    @state() private pitchShiftSemitones = 0;
    private _lastAnalyzedTrackBuffer: AudioBuffer | null = null;
    
    static styles = [ sharedStyles, css`
        .panel { padding: var(--spacing-xl); }
        .source-info-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: var(--bg-panel-solid);
            padding: 0.5rem 1rem;
            border-radius: 5px;
            margin-top: 1rem;
            font-size: 0.8rem;
            border: 1px solid var(--border-color);
        }
        .remix-plan-container pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 0.85rem;
            line-height: 1.6;
            color: var(--text-secondary);
            background-color: var(--bg-input);
            padding: 1.2rem;
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }
    ` ];

    private get _sourceAudioFile(): File | null {
        if (this.remixSourceFile) return this.remixSourceFile;
        const appContext = this.appContextConsumer.value;
        if (appContext?.currentTrack.audioBuffer) {
            const blob = audioBufferToWav(appContext.currentTrack.audioBuffer);
            return new File([blob], `${appContext.currentTrack.title}.wav`, { type: 'audio/wav' });
        }
        return null;
    }

    private async _runAnalysis() {
        const fileToAnalyze = this._sourceAudioFile;
        const appContext = this.appContextConsumer.value;
        if (!fileToAnalyze || !appContext?.audioContext) return;
        
        this.analysisStatus = 'loading';
        this.analysisError = '';
        try {
            this.audioAnalysis = await audioIntelService.analyze(fileToAnalyze, appContext.audioContext);
            this.analysisStatus = 'success';
        } catch (e) {
            this.analysisError = (e as Error).message;
            this.analysisStatus = 'error';
        }
    }
    
    private async _runStemSeparation() {
        const fileToSeparate = this._sourceAudioFile;
        const appContext = this.appContextConsumer.value;
        if (!fileToSeparate || !appContext?.audioContext) return;

        this.stemSeparationStatus = 'loading';
        this.stemSeparationError = '';
        try {
            this.audioStems = await audioIntelService.splitStems(fileToSeparate, appContext.audioContext);
            this.stemSeparationStatus = 'success';
        } catch (e) {
            this.stemSeparationError = (e as Error).message;
            this.stemSeparationStatus = 'error';
        }
    }
    
    private async _handleGeneratePlan() {
        const appContext = this.appContextConsumer.value;
        if (!appContext) return;
        const targets = Array.from((this as LitElement).shadowRoot!.querySelectorAll<HTMLInputElement>('input[name="remix-target"]:checked')).map(el => (el as HTMLInputElement).value);
        const genre = (this as LitElement).shadowRoot!.querySelector<HTMLSelectElement>('#remix-genre-select')?.value ?? 'House';

        const task = async () => {
            const plan = await aiService.generateRemixPlan({
                genre,
                source: this._sourceAudioFile?.name || 'current track',
                targets,
            }, appContext.explicitContentFilter);
            this.generatedRemixPlan = plan;
        };
        await this._performTask('Generate Remix Plan', [{ message: 'Formulating production strategy...', duration: 2500 }], task);
    }

    private async _handleGenerateRemix() {
        // Implementation omitted for brevity
    }
    
    private _renderAnalysisSection() { return html`<!-- ... -->`; }
    private _renderStemSection() { return html`<!-- ... -->`; }

    // FIX: Removed 'override' modifier to resolve build error.
    render() {
        return html`
            <div class="panel">
                <h2 class="page-title">Remix Station</h2>
                <div class="control-group">
                    <h3>Source Audio</h3>
                    <p class="sub-label">Load the track you want to remix.</p>
                    <file-link-input @file-change=${(e: CustomEvent) => this.remixSourceFile = e.detail.file}></file-link-input>
                </div>
                
                <div class="control-group">
                    <h3>Analysis & Separation</h3>
                    <div style="display: flex; gap: 1rem;">
                        <button @click=${this._runAnalysis} ?disabled=${!this._sourceAudioFile}>Analyze BPM & Key</button>
                        <button @click=${this._runStemSeparation} ?disabled=${!this._sourceAudioFile}>Separate Stems</button>
                    </div>
                    ${this._renderAnalysisSection()}
                </div>
                
                ${this._renderStemSection()}
                ${this.renderProgressIndicator()}
                ${this.renderErrorMessage()}

                ${this.generatedRemixPlan ? html`
                    <div class="control-group">
                        <h3>Production Plan</h3>
                        <div class="remix-plan-container">
                            <pre>${this.generatedRemixPlan}</pre>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}
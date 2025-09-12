


/**
 * @fileoverview The "Stem Mixer" utility component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, svg, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';
import { classMap }from 'lit/directives/class-map.js';

import { sharedStyles } from './shared-styles.js';
import { StudioModule } from './studio-module.js';
import { appContext } from './context.js';
import { audioBufferToWav } from './utils.js';
// Import the stem separation service
import { audioIntelService } from './audio-intel.js';
import type { Stems } from './audio-intel.js';
import { taskService } from './task-service.js';
import { AIError } from './ai-service.js';
import { mixingAgent, MixGoal } from './mixing-agent.js';

export type StemTrack = {
    file: File;
    buffer: AudioBuffer;
    sourceNode?: AudioBufferSourceNode;
    gainNode: GainNode;
    panNode: StereoPannerNode;
    volume: number;
    pan: number;
    muted: boolean;
    pitchShift: number;
};

@customElement('stem-mixer-utility')
export class StemMixerUtility extends StudioModule {
    private appContextConsumer = new ContextConsumer(this, { context: appContext, subscribe: true });

    @state() private stems: StemTrack[] = [];
    @state() private isPlaying = false;
    @state() private soloedStemIndex: number | null = null;
    @state() private masterVolume = 1;
    
    // Export Modal State
    @state() private showExportModal = false;
    @state() private exportType: 'mixdown' | 'stems' = 'mixdown';
    @state() private mixGoal: MixGoal = 'punchy';
    @state() private exportFormat: 'wav' | 'mp3' = 'wav';
    @state() private exportQuality: '128' | '192' | '320' = '320';
    @state() private exportedFile: { url: string; name: string } | null = null;

    static styles = [
      sharedStyles,
      css`
        .mixer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .stem-mixer-grid {
            margin-top: 1rem;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            overflow: hidden;
        }
        .stem-track {
            display: grid; 
            /* Name | Mute/Solo | Volume | Pan | Pitch | Remove */
            grid-template-columns: 1.5fr auto 1.2fr 1.2fr 1.2fr auto;
            align-items: center; 
            gap: 1.5rem; 
            padding: 1rem 1.5rem; 
            background-color: var(--bg-panel);
            transition: opacity 0.3s ease, background-color 0.3s ease;
        }
        .stem-track:not(:last-child) {
            border-bottom: 1px solid var(--border-color); 
        }
        .stem-track-name {
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .stem-track-buttons {
            display: flex;
            gap: 0.5rem;
        }
        .slider-container label {
            display: block;
            margin-bottom: 0.3rem;
            font-size: 0.75rem;
            color: var(--text-secondary);
            white-space: nowrap;
            cursor: pointer;
        }
        .stem-actions {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
        }
        /* Visual states for muted/soloed tracks */
        .stem-track.muted {
            opacity: 0.5;
        }
        .stem-track.soloed-out {
            opacity: 0.4;
            background-color: var(--bg-sidebar);
        }
        .stem-track.soloed {
            background-color: color-mix(in srgb, var(--accent-primary) 10%, transparent);
        }
      `
    ];

    private _updatePrimaryAction() {
        (this as LitElement).dispatchEvent(new CustomEvent('primary-action-update', {
            detail: {
                label: 'Export Mixdown',
                action: this._openExportModal.bind(this),
                disabled: this.stems.length === 0 || this.isLoading,
            },
            bubbles: true,
            composed: true,
        }));
    }

    firstUpdated() {
        this._updatePrimaryAction();
    }
    
    private async _handleFileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0 || !this.appContextConsumer.value?.audioContext) return;
        
        await this._loadMultipleStems(files);
        // Reset file input to allow re-selection of the same file
        input.value = '';
    }
    
    private async _handleSeparateFileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file || !this.appContextConsumer.value?.audioContext) return;

        await this._separateAndLoadTrack(file);
        input.value = '';
    }

    private async _loadMultipleStems(files: FileList) {
        this.isLoading = true;
        this.statusMessage = `Loading ${files.length} stems...`;
        
        const newStems: StemTrack[] = [];
        for (const file of Array.from(files)) {
            try {
                const audioContext = this.appContextConsumer.value!.audioContext!;
                const arrayBuffer = await file.arrayBuffer();
                const buffer = await audioContext.decodeAudioData(arrayBuffer);
                
                const gainNode = audioContext.createGain();
                const panNode = audioContext.createStereoPanner();
                gainNode.connect(panNode).connect(audioContext.destination);

                const newStem: StemTrack = {
                    file,
                    buffer,
                    gainNode,
                    panNode,
                    volume: 1,
                    pan: 0,
                    muted: false,
                    pitchShift: 0,
                };
                newStems.push(newStem);
            } catch (err) {
                console.error(`Error decoding file ${file.name}:`, err);
                this.errorMessage = `Could not load stem: ${file.name}. It may be a corrupted or unsupported file.`;
            }
        }
        
        this.stems = [...this.stems, ...newStems];
        this.isLoading = false;
        this.statusMessage = '';
        this._updatePrimaryAction();
    }
    
    private async _separateAndLoadTrack(file: File) {
        const audioContext = this.appContextConsumer.value?.audioContext;
        if (!audioContext) return;

        // Stop any playback and clear existing stems for a new project.
        if (this.isPlaying) this._stopAll();
        this.stems = [];
        this.soloedStemIndex = null;
        (this as LitElement).requestUpdate();

        const task = async () => {
            const separatedStems: Stems = await audioIntelService.splitStems(file, audioContext);
            const loadedStems: StemTrack[] = [];
            const originalName = file.name.replace(/\.[^/.]+$/, "");

            const stemOrder: (keyof Stems)[] = ['vocal', 'drums', 'bass', 'other'];

            for (const stemName of stemOrder) {
                const buffer = separatedStems[stemName];
                if (buffer) {
                    const gainNode = audioContext.createGain();
                    const panNode = audioContext.createStereoPanner();
                    gainNode.connect(panNode).connect(audioContext.destination);
                    
                    const stemFile = new File([], `${originalName} (${stemName}).wav`, { type: 'audio/wav' });
                    
                    const newStem: StemTrack = {
                        file: stemFile,
                        buffer,
                        gainNode,
                        panNode,
                        volume: 1,
                        pan: 0,
                        muted: false,
                        pitchShift: 0,
                    };
                    loadedStems.push(newStem);
                }
            }

            if (loadedStems.length === 0) {
                throw new Error("Stem separation did not produce any audio. The source might be silent or incompatible.");
            }
            
            this.stems = loadedStems;
        };

        await this._performTask(
            `Separate Stems: ${file.name}`,
            [{ message: 'Separating track into stems...', duration: 4000 }],
            task
        );
        this._updatePrimaryAction();
    }
    
    private _togglePlay() {
        if (this.isPlaying) {
            this._stopAll();
        } else {
            this._playAll();
        }
    }
    
    private _playAll() {
        const audioContext = this.appContextConsumer.value?.audioContext;
        if (!audioContext || this.stems.length === 0) return;

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const startTime = audioContext.currentTime;
        let longestDuration = 0;
        let longestStemSource: AudioBufferSourceNode | null = null;
        
        this._updateAllGains(); // Ensure gains are correct before playing

        this.stems = this.stems.map((stem, index) => {
            // Only create a source if the stem is audible (not muted or soloed out)
            const isAudible = !stem.muted && (this.soloedStemIndex === null || this.soloedStemIndex === index);
            
            if (isAudible) {
                const sourceNode = audioContext.createBufferSource();
                sourceNode.buffer = stem.buffer;
                sourceNode.detune.value = stem.pitchShift * 100; // Apply pitch shift
                sourceNode.connect(stem.gainNode);
                sourceNode.start(startTime);

                if (stem.buffer.duration > longestDuration) {
                    longestDuration = stem.buffer.duration;
                    longestStemSource = sourceNode;
                }
                
                return { ...stem, sourceNode };
            }
            // Ensure non-playing stems have no sourceNode reference
            return { ...stem, sourceNode: undefined };
        });

        if (longestStemSource) {
            this.isPlaying = true;
            longestStemSource.onended = () => {
                // Natural end of playback
                if(this.isPlaying) {
                    this.isPlaying = false;
                    // Clean up all sourceNode references from state
                    this.stems = this.stems.map(s => ({...s, sourceNode: undefined}));
                }
            };
        } else {
            // No audible stems were started, so we are not playing.
            this.isPlaying = false;
        }
    }

    private _stopAll() {
        this.stems.forEach(stem => {
            if (stem.sourceNode) {
                stem.sourceNode.onended = null; // Prevent natural end handler from firing on manual stop
                try {
                    stem.sourceNode.stop();
                    stem.sourceNode.disconnect();
                } catch(e) {
                    // Ignore errors if node is already stopped
                }
            }
        });
        this.stems = this.stems.map(s => ({...s, sourceNode: undefined})); // Clear source nodes from state
        this.isPlaying = false;
    }

    private _updateAllGains() {
        const audioContext = this.appContextConsumer.value?.audioContext;
        if (!audioContext) return;

        this.stems.forEach((stem, index) => {
            let targetGain = stem.volume * this.masterVolume;
            
            // A track is silent if it is muted OR if another track is soloed (and this one isn't)
            if (stem.muted || (this.soloedStemIndex !== null && this.soloedStemIndex !== index)) {
                targetGain = 0;
            }
            
            // Use a ramp to avoid clicks
            stem.gainNode.gain.linearRampToValueAtTime(targetGain, audioContext.currentTime + 0.02);
        });
    }

    private _toggleMute(indexToMute: number) {
        const stem = this.stems[indexToMute];
        if (stem) {
            stem.muted = !stem.muted;
            (this as LitElement).requestUpdate('stems');
            this._updateAllGains();
        }
    }

    private _toggleSolo(indexToSolo: number) {
        const isDisablingSolo = this.soloedStemIndex === indexToSolo;
        this.soloedStemIndex = isDisablingSolo ? null : indexToSolo;
        this._updateAllGains();
    }
    
    private _handleVolumeChange(index: number, e: Event) {
        const volume = parseFloat((e.target as HTMLInputElement).value);
        this.stems[index].volume = volume;
        this._updateAllGains();
        (this as LitElement).requestUpdate('stems');
    }
    
    private _handlePanChange(index: number, e: Event) {
        const audioContext = this.appContextConsumer.value?.audioContext;
        if (!audioContext) return;
        const pan = parseFloat((e.target as HTMLInputElement).value);
        this.stems[index].pan = pan;
        this.stems[index].panNode.pan.setValueAtTime(pan, audioContext.currentTime);
        (this as LitElement).requestUpdate('stems');
    }

    private _handlePitchChange(index: number, e: Event) {
        const pitchShift = parseInt((e.target as HTMLInputElement).value);
        this.stems[index].pitchShift = pitchShift;
        (this as LitElement).requestUpdate('stems'); // Update the UI label

        // If the track is currently playing, update the detune value live
        const stem = this.stems[index];
        if (stem.sourceNode) {
            const audioContext = this.appContextConsumer.value?.audioContext;
            if (audioContext) {
                // Use a very short ramp to avoid audio clicks/pops
                stem.sourceNode.detune.linearRampToValueAtTime(pitchShift * 100, audioContext.currentTime + 0.02);
            }
        }
    }

    private _resetPitch(index: number) {
        const stem = this.stems[index];
        if (stem) {
            stem.pitchShift = 0;
            if (stem.sourceNode) {
                const audioContext = this.appContextConsumer.value?.audioContext;
                if (audioContext) {
                     stem.sourceNode.detune.linearRampToValueAtTime(0, audioContext.currentTime + 0.02);
                }
            }
            (this as LitElement).requestUpdate('stems');
        }
    }

    private _formatVolume(value: number): string {
        if (value === 0) return '-inf dB';
        const dB = 20 * Math.log10(value);
        return `${dB.toFixed(1)} dB`;
    }

    private _formatPan(value: number): string {
        if (value === 0) return 'Center';
        const percentage = Math.abs(value * 100).toFixed(0);
        return `${percentage}% ${value < 0 ? 'L' : 'R'}`;
    }

    private _formatPitch(value: number): string {
        if (value === 0) return 'Center';
        return `${value > 0 ? '+' : ''}${value} st`;
    }
    
    private _removeStem(indexToRemove: number) {
        this.stems = this.stems.filter((_, index) => index !== indexToRemove);
        this._updatePrimaryAction();
    }
    
    private _openExportModal() {
        this.showExportModal = true;
        this.exportedFile = null; // Reset on open
    }

    private _closeExportModal() {
        this.showExportModal = false;
    }

    private async _handleStartExport() {
        if (this.exportType === 'mixdown') {
            await this._runAiMixdown();
        } else {
            await this._exportIndividualStems();
        }
    }
    
    private async _runAiMixdown() {
        const audioContext = this.appContextConsumer.value?.audioContext;
        if (!audioContext || this.stems.length === 0) return;

        const task = async () => {
            const mixedBuffer = await mixingAgent.runAiMixdown(this.stems, this.mixGoal, this.masterVolume);
            const wavBlob = audioBufferToWav(mixedBuffer);
            
            const url = URL.createObjectURL(wavBlob);
            const fileName = `stem_mixdown_${this.mixGoal}_${new Date().toISOString().slice(0, 10)}.${this.exportFormat}`;
            this.exportedFile = { url, name: fileName };
        };

        await this._performTask(
            `AI Mixdown`,
            [], // Stages are now managed by the agent
            task
        );
    }
    
    private _triggerDownload(blob: Blob, fileName: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
    
    private async _exportIndividualStems() {
        const audioContext = this.appContextConsumer.value?.audioContext;
        if (!audioContext || this.stems.length === 0) return;

        this.isLoading = true;
        const taskId = taskService.addTask(
            'Export Individual Stems',
            this.stems.map(s => ({ message: `Exporting ${s.file.name}`}))
        );
        this.currentTaskId = taskId;

        try {
            for (let i = 0; i < this.stems.length; i++) {
                const stem = this.stems[i];
                const statusMessage = `Exporting stem ${i + 1}/${this.stems.length}: ${stem.file.name}`;
                
                const taskState = taskService.getTask(taskId)!;
                taskState.stages[i].status = 'running';
                taskService.updateTask(taskId, {
                    status: 'running',
                    statusMessage,
                    stages: taskState.stages,
                    progress: ((i + 1) / this.stems.length) * 100
                });

                const offlineCtx = new OfflineAudioContext(stem.buffer.numberOfChannels, stem.buffer.length, stem.buffer.sampleRate);
                const source = offlineCtx.createBufferSource();
                source.buffer = stem.buffer;
                source.detune.value = stem.pitchShift * 100;
                const gain = offlineCtx.createGain();
                gain.gain.value = stem.volume * this.masterVolume;
                const panner = offlineCtx.createStereoPanner();
                panner.pan.value = stem.pan;
                source.connect(gain).connect(panner).connect(offlineCtx.destination);
                source.start(0);

                const renderedBuffer = await offlineCtx.startRendering();
                const wavBlob = audioBufferToWav(renderedBuffer);
                const originalName = stem.file.name.replace(/\.[^/.]+$/, "");
                this._triggerDownload(wavBlob, `${originalName}.${this.exportFormat}`);
                
                taskState.stages[i].status = 'complete';
                await new Promise(r => setTimeout(r, 200));
            }

            taskService.updateTask(taskId, { status: 'complete', statusMessage: 'All stems exported.'});
            this.exportedFile = { url: '#', name: 'All stems have been downloaded individually.' };
        } catch(e) {
            const message = (e as Error).message;
            this.errorMessage = message;
            taskService.updateTask(taskId, { status: 'failed', error: message });
        } finally {
            this.isLoading = false;
            this.currentTaskId = null;
        }
    }

    private _renderExportModal() {
        if (!this.showExportModal) return null;

        return html`
            <div class="modal-overlay" @click=${this._closeExportModal}>
                <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
                    <div class="modal-header">
                        <h3>Export Mix</h3>
                        <button class="close-button" @click=${this._closeExportModal}>&times;</button>
                    </div>

                    ${!this.isLoading && !this.exportedFile ? html`
                        <div class="export-form" style="display: flex; flex-direction: column; gap: 1rem;">
                            <div>
                                <label>Export Type</label>
                                <div class="radio-group" style="grid-template-columns: 1fr 1fr;">
                                    <label>
                                        <input type="radio" name="export-type" value="mixdown" .checked=${this.exportType === 'mixdown'} @change=${() => this.exportType = 'mixdown'}>
                                        AI Mixdown
                                    </label>
                                    <label>
                                        <input type="radio" name="export-type" value="stems" .checked=${this.exportType === 'stems'} @change=${() => this.exportType = 'stems'}>
                                        Individual Stems
                                    </label>
                                </div>
                            </div>
                            
                            ${this.exportType === 'mixdown' ? html`
                                <div>
                                    <label>Mix Goal</label>
                                    <div class="radio-group">
                                        <label title="More compression, especially on drums, for a powerful sound.">
                                            <input type="radio" name="mix-goal" value="punchy" .checked=${this.mixGoal === 'punchy'} @change=${() => this.mixGoal = 'punchy'}>
                                            Punchy & Loud
                                        </label>
                                        <label title="Wider stereo image and more reverb for an immersive feel.">
                                            <input type="radio" name="mix-goal" value="wide" .checked=${this.mixGoal === 'wide'} @change=${() => this.mixGoal = 'wide'}>
                                            Wide & Atmospheric
                                        </label>
                                        <label title="Subtle EQ adjustments to ensure each element has its own space.">
                                            <input type="radio" name="mix-goal" value="clear" .checked=${this.mixGoal === 'clear'} @change=${() => this.mixGoal = 'clear'}>
                                            Clean & Clear
                                        </label>
                                    </div>
                                </div>
                            ` : ''}

                            <div class="row">
                                <div>
                                    <label for="export-format">Audio Format</label>
                                    <select id="export-format" .value=${this.exportFormat} @change=${(e: Event) => this.exportFormat = (e.target as HTMLSelectElement).value as 'wav' | 'mp3'}>
                                        <option value="wav">WAV (Lossless)</option>
                                        <option value="mp3">MP3 (Compressed)</option>
                                    </select>
                                </div>
                                ${this.exportFormat === 'mp3' ? html`
                                    <div>
                                        <label for="export-quality">MP3 Quality</label>
                                        <select id="export-quality" .value=${this.exportQuality} @change=${(e: Event) => this.exportQuality = (e.target as HTMLSelectElement).value as '128' | '192' | '320'}>
                                            <option value="320">320 kbps (High Quality)</option>
                                            <option value="192">192 kbps (Standard)</option>
                                            <option value="128">128 kbps (Small File)</option>
                                        </select>
                                        <p class="sub-label" style="margin-top: 0.5rem;">Note: MP3 encoding is simulated and will download a WAV file.</p>
                                    </div>
                                ` : ''}
                            </div>
                            <div style="text-align: right; border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem;">
                                <button @click=${this._handleStartExport}>Start Export</button>
                            </div>
                        </div>
                    ` : ''}

                    ${this.isLoading ? this.renderProgressIndicator() : ''}

                    ${this.exportedFile ? html`
                        <div class="export-complete" style="text-align: center; display: flex; flex-direction: column; gap: 1rem; align-items: center;">
                            <h4>Export Complete!</h4>
                            ${this.exportType === 'mixdown' ? html`
                                <p class="sub-label">Your mixed file is ready for download.</p>
                                <a href=${this.exportedFile.url} download=${this.exportedFile.name} class="button primary">
                                    Download: ${this.exportedFile.name}
                                </a>
                            ` : html`
                                <p class="sub-label">${this.exportedFile.name}</p>
                            `}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <div class="panel">
                <h2 class="page-title">Stem Mixer</h2>
                <div class="control-group">
                    <h3>Load Audio</h3>
                    <p class="sub-label">Start a new project by separating a full track, or add individual stem files to your current mix.</p>
                    <div class="row">
                        <div>
                            <label for="separate-upload">Separate Full Track</label>
                            <input id="separate-upload" type="file" @change=${this._handleSeparateFileSelect} accept="audio/*">
                            <p class="sub-label" style="margin-top: 0.5rem;">Clears current mixer and separates the track into new stems.</p>
                        </div>
                        <div>
                            <label for="stem-upload">Add Individual Stems</label>
                            <input id="stem-upload" type="file" @change=${this._handleFileSelect} multiple accept="audio/*">
                            <p class="sub-label" style="margin-top: 0.5rem;">Adds one or more audio files as new tracks to the mixer.</p>
                        </div>
                    </div>
                    
                    ${this.renderProgressIndicator()}
                    ${this.renderErrorMessage()}
                </div>
                
                ${this.stems.length > 0 ? html`
                    <div class="control-group">
                        <div class="mixer-header">
                            <h3>Mixer</h3>
                             <button @click=${this._togglePlay} class="button">
                                ${this.isPlaying 
                                    ? svg`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
                                    : svg`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`}
                                <span style="margin-left: 0.5rem;">${this.isPlaying ? 'Stop' : 'Play All'}</span>
                            </button>
                        </div>
                        <div class="stem-mixer-grid">
                            ${this.stems.map((stem, index) => html`
                                <div class=${classMap({
                                    'stem-track': true,
                                    'muted': stem.muted,
                                    'soloed': this.soloedStemIndex === index,
                                    'soloed-out': this.soloedStemIndex !== null && this.soloedStemIndex !== index,
                                })}>
                                    <div class="stem-track-name" title=${stem.file.name}>${stem.file.name}</div>
                                    
                                    <div class="stem-track-buttons">
                                        <button
                                            class="icon-button ${classMap({active: stem.muted})}"
                                            @click=${() => this._toggleMute(index)}
                                            title="Mute Stem">${svg`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`}</button>
                                        <button 
                                            class="icon-button ${classMap({active: this.soloedStemIndex === index})}"
                                            @click=${() => this._toggleSolo(index)} 
                                            title="Solo Stem">${svg`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 1a9 9 0 0 0-9 9v7c0 1.66 1.34 3 3 3h1v-4h-2v-3a7 7 0 0 1 14 0v3h-2v4h1c1.66 0 3-1.34 3-3v-7a9 9 0 0 0-9-9z"/></svg>`}</button>
                                    </div>
                                    
                                    <div class="slider-container">
                                        <label for="volume-${index}">Volume: ${this._formatVolume(stem.volume)}</label>
                                        <input type="range" id="volume-${index}" min="0" max="1.5" step="0.01" .value=${String(stem.volume)} @input=${(e: Event) => this._handleVolumeChange(index, e)}>
                                    </div>
                                    
                                     <div class="slider-container">
                                        <label for="pan-${index}">Pan: ${this._formatPan(stem.pan)}</label>
                                        <input type="range" id="pan-${index}" min="-1" max="1" step="0.01" .value=${String(stem.pan)} @input=${(e: Event) => this._handlePanChange(index, e)}>
                                    </div>

                                    <div class="slider-container">
                                        <label for="pitch-${index}" @dblclick=${() => this._resetPitch(index)} title="Double-click to reset">Pitch: ${this._formatPitch(stem.pitchShift)}</label>
                                        <input type="range" id="pitch-${index}" min="-12" max="12" step="1" .value=${String(stem.pitchShift)} @input=${(e: Event) => this._handlePitchChange(index, e)}>
                                    </div>

                                    <div class="stem-actions">
                                        <button class="icon-button" @click=${() => this._removeStem(index)} title="Remove Stem">
                                            ${svg`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`}
                                        </button>
                                    </div>
                                </div>
                            `)}
                        </div>
                    </div>
                ` : ''}
                
                ${this._renderExportModal()}
            </div>
        `;
    }
}
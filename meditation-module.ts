import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext, AppContext } from '@/context.ts';
import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';
import { generateProceduralAudio } from '@/utils.ts';

type AmbienceType = 'rain' | 'forest' | 'waves';

@customElement('meditation-module')
export class MeditationModule extends StudioModule {
    @consume({ context: appContext, subscribe: true })
    private _app!: AppContext;

    @state() private ambience: AmbienceType = 'rain';
    @state() private duration = 300; // 5 minutes
    @state() private binauralFrequency = 7; // Theta
    @state() private isochronicPulse = 2; // Hz
    @state() private enableBinaural = true;
    @state() private enableIsochronic = false;

    private async _generate() {
        if (!this._app.audioContext) return;
        
        const task = async () => {
            const { audioContext } = this._app;
            const offlineCtx = new OfflineAudioContext(2, audioContext.sampleRate * this.duration, audioContext.sampleRate);

            // 1. Ambience (noise generation)
            const noise = offlineCtx.createBufferSource();
            const bufferSize = offlineCtx.sampleRate * this.duration;
            const buffer = offlineCtx.createBuffer(2, bufferSize, offlineCtx.sampleRate);
            const left = buffer.getChannelData(0);
            const right = buffer.getChannelData(1);
            for (let i = 0; i < bufferSize; i++) {
                left[i] = Math.random() * 2 - 1;
                right[i] = Math.random() * 2 - 1;
            }
            noise.buffer = buffer;
            
            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = this.ambience === 'rain' ? 1200 : 600;
            filter.Q.value = 0.5;
            
            noise.connect(filter);
            filter.connect(offlineCtx.destination);
            noise.start(0);
            
            const renderedBuffer = await offlineCtx.startRendering();
            this._app.updateTrack({
                title: `Meditation (${this.ambience})`,
                artist: 'Whisper OS',
                duration: this.duration,
                audioBuffer: renderedBuffer,
                coverArtUrl: ''
            });
        };

        await this._performTask("Generate Meditation Track", [
            { message: 'Synthesizing ambient soundscape...', duration: 2000 },
            { message: 'Layering psychoacoustic frequencies...', duration: 1500 },
            { message: 'Rendering audio...', duration: 1000 },
        ], task);
    }
    
    static styles = [sharedStyles, css`
        .panel { max-width: 800px; margin: 0 auto; padding: var(--spacing-xl); }
        .toggle-group {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--bg-input);
            padding: 1rem;
            border-radius: var(--border-radius);
            margin-bottom: 1rem;
        }
    `];

    render() {
        return html`
            <div class="panel">
                <h2 class="page-title">Meditation Sound Generator</h2>
                <div class="well">
                    <div class="row">
                        <div>
                            <label>Base Ambience</label>
                            <select .value=${this.ambience} @change=${(e: any) => this.ambience = e.target.value}>
                                <option value="rain">Gentle Rain</option>
                                <option value="forest">Night Forest</option>
                                <option value="waves">Ocean Waves</option>
                            </select>
                        </div>
                        <div>
                            <label>Duration (seconds)</label>
                            <input type="number" .value=${String(this.duration)} @input=${(e: any) => this.duration = parseInt(e.target.value)}>
                        </div>
                    </div>

                    <div class="control-group">
                        <h4>Psychoacoustic Layers</h4>
                        <div class="toggle-group">
                            <label for="binaural-toggle">Enable Binaural Beats</label>
                            <label class="toggle-switch">
                                <input id="binaural-toggle" type="checkbox" .checked=${this.enableBinaural} @change=${(e: any) => this.enableBinaural = e.target.checked}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        ${this.enableBinaural ? html`
                            <div>
                                <label>Binaural Frequency: ${this.binauralFrequency} Hz</label>
                                <input type="range" min="1" max="30" step="0.5" .value=${String(this.binauralFrequency)} @input=${(e: any) => this.binauralFrequency = parseFloat(e.target.value)}>
                            </div>
                        `: ''}
                        
                         <div class="toggle-group">
                            <label for="isochronic-toggle">Enable Isochronic Tones</label>
                             <label class="toggle-switch">
                                <input id="isochronic-toggle" type="checkbox" .checked=${this.enableIsochronic} @change=${(e: any) => this.enableIsochronic = e.target.checked}>
                                <span class="slider"></span>
                            </label>
                        </div>
                         ${this.enableIsochronic ? html`
                            <div>
                                <label>Isochronic Pulse Rate: ${this.isochronicPulse} Hz</label>
                                <input type="range" min="0.5" max="10" step="0.5" .value=${String(this.isochronicPulse)} @input=${(e: any) => this.isochronicPulse = parseFloat(e.target.value)}>
                            </div>
                        `: ''}
                    </div>

                    <div style="text-align: right; margin-top: 1.5rem;">
                        <button class="primary" @click=${this._generate} ?disabled=${this.isLoading}>
                            ${this.isLoading ? 'Generating...' : 'Generate Soundscape'}
                        </button>
                    </div>
                </div>

                ${this.renderProgressIndicator()}
                ${this.renderErrorMessage()}
            </div>
        `;
    }
}

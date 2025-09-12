// vocal-studio-module.ts
import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {consume} from '@lit/context';
import {appContext, AppContext} from '@/context.ts';
import { aiService } from '@/ai-service.ts';
import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';

type VocalMode = 'rvc' | 'tts';

@customElement('vocal-studio-module')
export class VocalStudioModule extends StudioModule {
  @consume({context: appContext, subscribe: true})
  private _app!: AppContext;
  
  @state() private mode: VocalMode = 'tts';
  @state() private url?: string;

  // RVC State
  @state() private rvcTargetVoice = 'aria';
  @state() private rvcSourceFile: File | null = null;
  @state() private semitones = 0;
  @state() private formantPreservation = 0.5;
  
  // TTS State
  @state() private ttsModel: 'bark' | 'so-vits-svc' = 'bark';
  @state() private ttsText = '';

  private _handleRvcFileChange(e: Event) {
      const input = e.target as HTMLInputElement;
      this.rvcSourceFile = input.files?.[0] || null;
  }

  private async _generate() {
      if (this.mode === 'rvc') {
          await this._convertRvc();
      } else {
          await this._generateTts();
      }
  }

  private async _convertRvc() {
    if (!this.rvcSourceFile) {
      this.errorMessage = 'Please upload an audio file to convert.';
      return;
    }
    const task = async () => {
      const pseudoUrl = `localfile://${this.rvcSourceFile!.name}`;
      const res = await aiService.rvcConvert({
        audio_url: pseudoUrl,
        target_voice: this.rvcTargetVoice,
      });
      this.url = res.url;
      if(this._app.songState) {
        const newStems = { ...this._app.songState.audio.stems, 'vocal_rvc': res.url };
        this._app.updateCurrentSong({ audio: { ...this._app.songState.audio, stems: newStems } });
      }
      return res;
    };
    await this._performTask('RVC Vocal Conversion', [{ message: 'RVC model is processing...', duration: 4000 }], task);
  }

  private async _generateTts() {
    if (!this.ttsText.trim()) {
        this.errorMessage = "Please enter some text to generate.";
        return;
    }
    const task = async () => {
        const res = await aiService.generateVoice({
            text: this.ttsText,
            model: this.ttsModel,
        });
        this.url = res.url;
        if(this._app.songState) {
            const newStems = { ...this._app.songState.audio.stems, [`vocal_${this.ttsModel}`]: res.url };
            this._app.updateCurrentSong({ audio: { ...this._app.songState.audio, stems: newStems } });
        }
        return res;
    };
    await this._performTask(`TTS with ${this.ttsModel}`, [{ message: 'Synthesizing voice...', duration: 3000 }], task);
  }
  
  static styles = [sharedStyles, css`
    .panel { max-width: 800px; margin: 0 auto; padding: var(--spacing-xl); }
    audio { width:100%; margin-top: 1rem; }
    .slider-label { display: flex; justify-content: space-between; align-items: center; }
  `];
  
  updated(changedProperties: Map<string, any>) {
      if (changedProperties.has('_app') && this._app.songState?.lyrics) {
          // Pre-fill TTS text with project lyrics if it's empty
          if (!this.ttsText) {
            this.ttsText = this._app.songState.lyrics;
          }
      }
  }

  render() {
    if (!this._app?.songState) return html`<p>Loading...</p>`;
    
    const isRvcDisabled = this.mode === 'rvc' && !this.rvcSourceFile;
    const isTtsDisabled = this.mode === 'tts' && !this.ttsText.trim();
    
    return html`
      <div class="panel">
        <h2 class="page-title">Vocal Studio</h2>

        <div class="control-group">
            <label>Vocal Generation Mode</label>
            <div class="radio-group">
                <label>
                    <input type="radio" name="vocal-mode" value="tts" .checked=${this.mode === 'tts'} @change=${() => this.mode = 'tts'}>
                    <span>Text-to-Speech</span>
                </label>
                <label>
                    <input type="radio" name="vocal-mode" value="rvc" .checked=${this.mode === 'rvc'} @change=${() => this.mode = 'rvc'}>
                    <span>Voice Conversion (RVC)</span>
                </label>
            </div>
        </div>

        <div class="well">
            ${this.mode === 'tts' ? html`
                <div>
                    <label>Model</label>
                    <select .value=${this.ttsModel} @change=${(e: any) => this.ttsModel = e.target.value}>
                        <option value="bark">Bark (Expressive)</option>
                        <option value="so-vits-svc">SO-VITS-SVC (High Quality)</option>
                    </select>
                </div>
                <div style="margin-top: 1rem;">
                    <label>Text</label>
                    <textarea .value=${this.ttsText} @input=${(e: any) => this.ttsText = e.target.value} rows="6"></textarea>
                </div>
            ` : html`
                 <div>
                    <label for="vocal-upload">Source Vocal</label>
                    <input id="vocal-upload" type="file" accept="audio/*" @change=${this._handleRvcFileChange} ?disabled=${this.isLoading}>
                </div>
                <div style="margin-top: 1rem;">
                    <label>Target Voice Model</label>
                    <select .value=${this.rvcTargetVoice} @change=${(e:any)=>this.rvcTargetVoice=e.target.value} ?disabled=${this.isLoading}>
                        <option value="aria">Aria</option>
                        <option value="titan">Titan</option>
                    </select>
                </div>
                <div class="row" style="margin-top: 1rem;">
                    <div>
                        <div class="slider-label">
                            <label for="semitones-slider">Pitch Shift</label>
                            <span>${this.semitones > 0 ? '+' : ''}${this.semitones} st</span>
                        </div>
                        <input id="semitones-slider" type="range" min="-12" max="12" step="1" .value=${String(this.semitones)} @input=${(e:any) => this.semitones = Number(e.target.value)} ?disabled=${this.isLoading}>
                    </div>
                    <div>
                        <div class="slider-label">
                            <label for="formant-slider">Formant Preservation</label>
                            <span>${this.formantPreservation.toFixed(2)}</span>
                        </div>
                        <input id="formant-slider" type="range" min="0" max="1" step="0.01" .value=${String(this.formantPreservation)} @input=${(e:any) => this.formantPreservation = Number(e.target.value)} ?disabled=${this.isLoading}>
                    </div>
                </div>
            `}
             <div style="text-align: right; margin-top: 1.5rem;">
                <button @click=${this._generate} ?disabled=${this.isLoading || isRvcDisabled || isTtsDisabled} class="primary">${this.isLoading?'Generating…':'Generate Vocal'}</button>
            </div>
        </div>

        ${this.renderProgressIndicator()}
        ${this.renderErrorMessage()}

        ${this.url ? html`
            <div class="control-group" style="margin-top: 2rem;">
                <h4>Generated Vocal</h4>
                <audio controls src=${this.url}></audio>
            </div>
        ` : ''}
      </div>
    `;
  }
}
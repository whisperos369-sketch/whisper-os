// remix-lab-module.ts
import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {consume} from '@lit/context';
import {appContext, AppContext} from '@/context.ts';
import type { SongState } from '@/sections.ts';
import { aiService } from '@/ai-service.ts';
import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';

@customElement('remix-lab-module')
export class RemixLabModule extends StudioModule {
  @consume({context: appContext, subscribe: true})
  private _app!: AppContext;

  @state() private files: File[] = [];
  @state() private backend = 'htdemucs';
  @state() private preset = 'balanced';
  @state() private stems = 4;
  @state() private masterBpm?: number;
  @state() private masterKey?: string;
  @state() private template = 'mashup_ab';
  @state() private crossfadeBars = 8;
  @state() private snapToDownbeat = true;
  @state() private url?: string;
  @state() private separatedStems: Record<string, string> | null = null;
  
  static styles = [sharedStyles, css`
    .stems-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-lg);
        margin-top: var(--spacing-md);
    }
    .stem-player {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }
    .stem-player audio {
        width: 100%;
    }
  `];

  private _getProject(): SongState | null {
      return this._app?.songState ?? null;
  }

  private _pick = (e:any)=> this.files = Array.from(e.target.files||[]);

  private async _separate() {
    if (!this.files.length) {
        this.errorMessage = "Please select an audio file to separate.";
        return;
    }
    this.separatedStems = null; // Clear previous results

    const task = async () => {
      const result = await aiService.separate({ 
          files: this.files, 
          backend: this.backend, 
          preset: this.preset, 
          stems: this.stems, 
          sr: 44100 
      });
      
      const project = this._getProject();
      if (project) {
        this._app.updateCurrentSong({ 
            audio: { ...project.audio, stems: { ...project.audio.stems, ...result.stems } } 
        });
      }
      this.separatedStems = result.stems;
      this._app.showToast('Stem separation complete!', 'success');
      return result;
    };

    await this._performTask('Separating Stems', [
        { message: 'Uploading audio...', duration: 1000 },
        { message: `Initializing ${this.backend} model...`, duration: 2000 },
        { message: 'Processing audio chunks...', duration: 5000 },
        { message: 'Finalizing stems...', duration: 1500 },
    ], task);
  }

  private async _alignArrange() {
    const project = this._getProject();
    if (!project) return;

    const task = async () => {
        const plan = await aiService.alignArrange({
          projectId: project.id,
          masterBpm: this.masterBpm ?? project.meta.bpm,
          masterKey: this.masterKey ?? project.meta.key,
          template: this.template,
          transitions: ['filter_sweep','echo_out'],
          snapToDownbeat: this.snapToDownbeat,
          crossfadeBars: this.crossfadeBars,
        });
        this.url = plan.url;
        
        const newVersion = { id: crypto.randomUUID(), label: `Remix ${project.versions.length+1}`, url: plan.url, createdAt: Date.now() };
        this._app.updateCurrentSong({
            versions: [...project.versions, newVersion],
            audio: { ...project.audio, latestMix: plan.url }
        });

        return plan;
    };

    await this._performTask('Align & Arrange', [
        { message: 'Analyzing tracks...', duration: 1000 },
        { message: 'Generating arrangement...', duration: 2000 },
        { message: 'Rendering mashup...', duration: 3000 },
    ], task);
  }

  private _renderStems() {
    if (!this.separatedStems) return '';
    return html`
      <div class="control-group">
        <h4>Separated Stems</h4>
        <div class="stems-grid">
          ${Object.entries(this.separatedStems).map(([name, url]) => html`
            <div class="stem-player">
              <label>${name.charAt(0).toUpperCase() + name.slice(1)}</label>
              <audio controls src=${url}></audio>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  // FIX: Removed 'override' modifier to fix build error.
  render(){
    const project = this._getProject();
    if (!project) return html`<div class="panel"><p>Loading...</p></div>`;

    return html`
      <div class="panel">
        <h2 class="page-title">Remix & Mashup Lab</h2>

        <div class="control-group">
            <h3>1. Separate Stems</h3>
            <p class="sub-label">Upload a full track to separate it into stems like vocals, drums, and bass.</p>
            <input type="file" accept="audio/*" multiple @change=${this._pick} ?disabled=${this.isLoading}/>
            
            <div class="row" style="margin-top: 1.5rem;">
                <div>
                    <label>Backend</label>
                    <select .value=${this.backend} @change=${(e:any)=>this.backend=e.target.value}>
                        <option>htdemucs</option><option>mdx</option><option>open-unmix</option><option>spleeter</option>
                    </select>
                </div>
                <div>
                    <label>Preset</label>
                    <select .value=${this.preset} @change=${(e:any)=>this.preset=e.target.value}>
                        <option>fast</option><option selected>balanced</option><option>quality</option>
                    </select>
                </div>
                <div>
                    <label>Stems</label>
                    <select .value=${String(this.stems)} @change=${(e:any)=>this.stems=Number(e.target.value)}>
                        <option>4</option><option>6</option><option>8</option>
                    </select>
                </div>
            </div>

            <div style="margin-top: 1.5rem;">
                <button @click=${this._separate} ?disabled=${this.isLoading || !this.files.length} class="primary">Separate Stems</button>
            </div>
        </div>
        ${this.renderProgressIndicator()}
        ${this.renderErrorMessage()}
        ${this._renderStems()}
        <div class="control-group">
            <h3>2. Align & Arrange</h3>
            <p class="sub-label">Set a master tempo and key, then use a template to arrange the separated stems into a new remix.</p>
            <div class="row">
                <div>
                    <label>Master BPM</label>
                    <input type="number" .value=${String(this.masterBpm??'')} @change=${(e:any)=>this.masterBpm=Number(e.target.value)||undefined}/>
                </div>
                <div>
                    <label>Master Key</label>
                    <select .value=${this.masterKey??''} @change=${(e:any)=>this.masterKey=e.target.value||undefined}>
                        <option value=""></option>${['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(k=>html`<option>${k}</option>`)}
                    </select>
                </div>
                <div>
                    <label>Template</label>
                    <select .value=${this.template} @change=${(e:any)=>this.template=e.target.value}>
                        <option value="mashup_ab">A↔B Mashup</option>
                        <option value="club_extended">Club Extended</option>
                        <option value="radio_edit">Radio Edit</option>
                        <option value="acapella_over_beat">Acapella over Beat</option>
                    </select>
                </div>
            </div>
            <div class="row">
                 <div>
                    <label>Crossfade Bars</label>
                    <input type="number" min="0" max="32" .value=${String(this.crossfadeBars)} @change=${(e:any)=>this.crossfadeBars=Number(e.target.value)}/>
                </div>
                <div>
                    <label style="margin-bottom: 1.2rem;">Options</label>
                    <label><input type="checkbox" .checked=${this.snapToDownbeat} @change=${(e:any)=>this.snapToDownbeat=e.target.checked}/> Snap to downbeat</label>
                </div>
            </div>
            <div style="margin-top: 1.5rem;">
                <button @click=${this._alignArrange}>Align & Arrange</button>
            </div>
            ${this.url ? html`<audio controls src=${this.url} style="width: 100%; margin-top: 1rem;"></audio>` : ''}
        </div>
      </div>
    `;
  }
}
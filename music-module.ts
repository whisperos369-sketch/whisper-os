// music-module.ts
import {css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {consume} from '@lit/context';
import {appContext, AppContext} from '@/context.ts';
import type { SongState } from '@/sections.ts';
import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';
import { aiService } from '@/ai-service.ts';

@customElement('music-module')
export class MusicModule extends StudioModule {
  @consume({context: appContext, subscribe: true})
  private _app!: AppContext;
  
  @state() private prompt = 'dark cinematic hip-hop, heavy 808s, halftime groove';
  @state() private url?: string;
  @state() private duration = 12;

  // Chunked rendering state
  @state() private useChunkedRendering = false;
  @state() private segmentSeconds = 8;
  @state() private crossfadeMs = 300;
  @state() private maxSegments = 6;

  private _updateGenerator(key: keyof SongState['generators'], value: any) {
    if (!this._app.songState) return;
    const newGenerators = { ...this._app.songState.generators, [key]: value };
    this._app.updateCurrentSong({ generators: newGenerators });
  }

  private async _generate() {
    if (!this._app || !this._app.songState) return;
    this.url = undefined;

    if (this.useChunkedRendering) {
        await this._generateChunked();
    } else {
        await this._generateSingle();
    }
  }

  private async _generateSingle() {
      const task = async () => {
        const { generators } = this._app.songState!;
        const res = await aiService.musicGen({
          prompt: this.prompt,
          duration: this.duration,
          model: generators.baseModel,
          temperature: generators.temperature,
          top_k: generators.topK,
          top_p: generators.topP,
        });

        this.url = res.url;
        const newVersion = {id: crypto.randomUUID(), label:`MusicGen ${this._app.songState!.versions.length+1}`, url:res.url, createdAt:Date.now()};
      
        const updates: Partial<SongState> = {
            audio: { ...this._app.songState!.audio, latestMix: res.url },
            versions: [...this._app.songState!.versions, newVersion],
        };
        if (res.note) {
            this._app.showToast(res.note, 'info');
        }
        this._app.updateCurrentSong(updates);

        return res;
      };
      
      await this._performTask('Generate Instrumental (Single Shot)', [
          { message: `Requesting model...`, duration: 1000 },
          { message: 'Generating audio waveform...', duration: 8000 },
          { message: 'Finalizing audio...', duration: 2000 },
      ], task);
  }

  private async _generateChunked() {
      const targetDuration = this.segmentSeconds * this.maxSegments;
      const task = async () => {
        const { generators } = this._app.songState!;
        const res = await aiService.generateMusicChunked({
          prompt: this.prompt,
          segmentSeconds: this.segmentSeconds,
          crossfadeMs: this.crossfadeMs,
          maxSegments: this.maxSegments,
          model: generators.baseModel,
          temperature: generators.temperature,
          top_k: generators.topK,
          top_p: generators.topP,
        });

        this.url = res.url;
        const newVersion = {id: crypto.randomUUID(), label:`MusicGen Chunked ${this._app.songState!.versions.length+1}`, url:res.url, createdAt:Date.now()};
        
        const updates: Partial<SongState> = {
            audio: { ...this._app.songState!.audio, latestMix: res.url },
            versions: [...this._app.songState!.versions, newVersion],
        };
        this._app.updateCurrentSong(updates);
        this._app.showToast(res.note || `Chunked render complete (${res.segments} segments).`, 'success');
        return res;
      };
      
      await this._performTask(`Generate Instrumental (Chunked, ~${targetDuration}s)`, [
          { message: `Requesting model...`, duration: 1000 },
          { message: 'Generating audio segments...', duration: 15000 },
          { message: 'Stitching and crossfading...', duration: 3000 },
      ], task);
  }

  static styles = [sharedStyles, css`
    .panel {
        padding: var(--spacing-xl);
        max-width: 800px;
        margin: 0 auto;
    }
    audio { 
      width:100%; 
      margin-top: 1rem; 
      filter: var(--shadow-color) 0 0 10px;
    }
  `];

  render() {
    if (!this._app?.songState) return html`<p>Loading...</p>`;
    const { generators } = this._app.songState;
    
    return html`
      <div class="panel">
        <h2 class="page-title">Music Generation</h2>
        <div class="well">
            <div class="row" style="grid-template-columns: 1fr;">
              <div>
                <label>Prompt</label>
                <textarea .value=${this.prompt} @input=${(e:any)=>this.prompt=e.target.value} rows="3" ?disabled=${this.isLoading}></textarea>
              </div>
              <div class="row">
                <div>
                  <label>Duration (seconds)</label>
                  <input type="number" .value=${String(this.duration)} @input=${(e:any)=>this.duration=Number(e.target.value)} ?disabled=${this.isLoading || this.useChunkedRendering}>
                  ${this.useChunkedRendering ? html`<p class="sub-label">Disabled (using chunked settings)</p>`: ''}
                </div>
                 <div>
                    <label>Base Model</label>
                    <select .value=${generators.baseModel} @change=${(e: any) => this._updateGenerator('baseModel', e.target.value)} ?disabled=${this.isLoading}>
                        <option value="facebook/musicgen-small">MusicGen Small</option>
                        <option value="facebook/musicgen-medium">MusicGen Medium</option>
                        <option value="facebook/musicgen-large">MusicGen Large</option>
                        <option value="facebook/musicgen-melody">MusicGen Melody</option>
                    </select>
                </div>
              </div>
            </div>

            <details style="margin-top: 1.5rem; background: transparent; border: none;">
                <summary style="padding: 0; font-weight: normal; color: var(--text-secondary); font-size: 0.9rem;">Advanced</summary>
                <div class="group" style="border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1rem; margin-top: 0.5rem;">
                    <label>
                        <input type="checkbox" .checked=${this.useChunkedRendering} @change=${(e:any) => this.useChunkedRendering = e.target.checked}>
                        Use Chunked Rendering (for long tracks)
                    </label>
                    <p class="sub-label">Generates audio in segments to avoid memory limits. Ideal for tracks > 30s.</p>
                    <div class="row" style="margin-top: 1rem; filter: ${!this.useChunkedRendering ? 'opacity(0.5)' : 'none'};">
                        <div>
                            <label>Segment (s)</label>
                            <input type="number" .value=${String(this.segmentSeconds)} @input=${(e:any)=>this.segmentSeconds=Number(e.target.value)} ?disabled=${this.isLoading || !this.useChunkedRendering}>
                        </div>
                         <div>
                            <label>Crossfade (ms)</label>
                            <input type="number" .value=${String(this.crossfadeMs)} @input=${(e:any)=>this.crossfadeMs=Number(e.target.value)} ?disabled=${this.isLoading || !this.useChunkedRendering}>
                        </div>
                         <div>
                            <label>Max Segments</label>
                            <input type="number" .value=${String(this.maxSegments)} @input=${(e:any)=>this.maxSegments=Number(e.target.value)} ?disabled=${this.isLoading || !this.useChunkedRendering}>
                        </div>
                    </div>
                    <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                      <div class="row">
                          <div>
                              <label>Temperature: ${generators.temperature.toFixed(2)}</label>
                              <input 
                                  type="range" min="0" max="1.5" step="0.01" 
                                  .value=${String(generators.temperature)} 
                                  @input=${(e: any) => this._updateGenerator('temperature', Number(e.target.value))} 
                                  ?disabled=${this.isLoading}>
                          </div>
                          <div>
                              <label>Top-P: ${generators.topP.toFixed(2)}</label>
                              <input 
                                  type="range" min="0" max="1" step="0.01" 
                                  .value=${String(generators.topP)} 
                                  @input=${(e: any) => this._updateGenerator('topP', Number(e.target.value))} 
                                  ?disabled=${this.isLoading}>
                          </div>
                      </div>
                      <div class="row" style="margin-top: 1rem;">
                          <div>
                              <label>Top-K</label>
                              <input 
                                  type="number" 
                                  .value=${String(generators.topK)} 
                                  @input=${(e: any) => this._updateGenerator('topK', Number(e.target.value))} 
                                  ?disabled=${this.isLoading}>
                          </div>
                      </div>
                    </div>
                </div>
            </details>
            
            <div style="text-align: right; margin-top: 1.5rem;">
                <button @click=${this._generate} ?disabled=${this.isLoading} class="primary">
                    ${this.isLoading ? 'Generating...' : 'Generate Instrumental'}
                </button>
            </div>
        </div>
        
        ${this.renderProgressIndicator()}
        ${this.renderErrorMessage()}
        
        ${this.url ? html`
            <div class="control-group" style="margin-top: 2rem;">
                <h4>Generated Track</h4>
                <audio controls src=${this.url}></audio>
            </div>
        `:''}
      </div>
    `;
  }
}

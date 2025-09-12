// spice-and-mastering-module.ts
import {html, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {consume} from '@lit/context';
import {appContext, AppContext} from '@/context.ts';
import type { SongState } from '@/sections.ts';
import { aiService } from '@/ai-service.ts';
import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';

@customElement('spice-and-mastering-module')
export class SpiceAndMasteringModule extends StudioModule {
  @consume({context: appContext, subscribe: true})
  private _app!: AppContext;

  @state() private lufsTarget = -14;
  @state() private hpHz = 20;
  @state() private width = 1.0;
  @state() private url?: string;

  private _getProject(): SongState | null {
      return this._app?.songState ?? null;
  }

  private async _master() {
    const project = this._getProject();
    if (!project?.audio.latestMix) return;

    this.url = undefined;

    const task = async () => {
      const out = await aiService.exportPack({
        mix: project.audio.latestMix!,
        stems: project.audio.stems,
        metadata: project.meta,
        lufsTarget: this.lufsTarget
      });
      this.url = out.mixUrl;
      this._app.updateCurrentSong({
          audio: { ...project.audio, latestMix: out.mixUrl },
          meta: { ...project.meta, measurements: out.measurements }
      });
      return out;
    };

    await this._performTask('Mastering & Export', [
      { message: 'Analyzing mix...', duration: 1000 },
      { message: 'Applying mastering chain...', duration: 3000 },
      { message: 'Finalizing export...', duration: 1000 },
    ], task);
  }

  // FIX: Removed 'override' modifier to fix build error.
  render(){
    const project = this._getProject();
    if (!project) return html`<div class="panel"><p>Loading...</p></div>`;

    return html`
    <div class="panel">
      <h2 class="page-title">Spice & Mastering</h2>
      <div class="well">
          <div class="row">
            <div>
              <label>LUFS Target</label>
              <input type="number" step="0.5" .value=${String(this.lufsTarget)} @change=${(e:any)=>this.lufsTarget=Number(e.target.value)} ?disabled=${this.isLoading}/>
            </div>
            <div>
              <label>High-pass (Hz)</label>
              <input type="number" min="0" max="60" .value=${String(this.hpHz)} @change=${(e:any)=>this.hpHz=Number(e.target.value)} ?disabled=${this.isLoading}/>
            </div>
            <div>
              <label>Stereo Width</label>
              <input type="number" step="0.05" min="0.5" max="1.5" .value=${String(this.width)} @change=${(e:any)=>this.width=Number(e.target.value)} ?disabled=${this.isLoading}/>
            </div>
          </div>
          <div style="text-align: right; margin-top: 1.5rem;">
            <button @click=${this._master} ?disabled=${this.isLoading || !project.audio.latestMix} class="primary">
                ${this.isLoading ? 'Mastering…' : 'Master & Export'}
            </button>
          </div>
      </div>
      
      ${this.renderProgressIndicator()}
      ${this.renderErrorMessage()}

      ${this.url ? html`
        <div class="control-group" style="margin-top: 2rem;">
            <h4>Mastered Mix:</h4>
            <audio controls src=${this.url}></audio>
        </div>
      `: nothing}
    </div>
    `;
  }
}
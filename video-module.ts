import {css, html, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {consume} from '@lit/context';
import {appContext, AppContext} from '@/context.ts';
import {aiService} from '@/ai-service.ts';
import {sharedStyles} from '@/shared-styles.ts';
import type { SongState } from '@/sections.ts';
import { StudioModule } from '@/studio-module.ts';

type VideoTemplate = 'audiogram' | 'spectrum' | 'lyric';

@customElement('video-module')
export class VideoModule extends StudioModule {
  @consume({context: appContext, subscribe: true})
  private _app!: AppContext;
  
  @state() private audioUrl: string = '';
  @state() private template: VideoTemplate = 'spectrum';
  @state() private videoUrl: string | null = null;
  
  static override styles = [sharedStyles, css`
    .panel {
      padding: var(--spacing-xl);
      max-width: 900px;
      margin: 0 auto;
    }
    .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-lg);
    }
    .preview {
        aspect-ratio: 16 / 9;
        background: #0f172a;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    video {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
  `];

  private _getProject(): SongState | null {
      return this._app?.songState ?? null;
  }

  private async _generate() {
    if (!this.audioUrl) {
        this.errorMessage = 'Please select a mastered mix.';
        return;
    }
    this.videoUrl = null;

    const task = async () => {
        const res = await aiService.videoGen({
            audioPath: this.audioUrl,
            preset: this.template,
        });
        this.videoUrl = res.videoPath;
        const project = this._getProject();
        if (project) {
            this._app.updateCurrentSong({
                visuals: { ...project.visuals, videoUrl: res.videoPath }
            });
        }
    };

    try {
        await this._performTask('Render Video', [
            { message: 'Preparing assets for video render...', duration: 1500 },
            { message: 'Rendering frames with FFMpeg...', duration: 6000 },
            { message: 'Encoding final video...', duration: 2000 },
        ], task);
    } catch {
        this._app.showToast(this.errorMessage || 'Video render failed.', 'error');
    }
  }

  render() {
    const project = this._getProject();
    if (!project) return html`<p>Loading...</p>`;
    
    // Auto-populate from project state if available
    const latestAudio = project.audio.latestMix;
    if (!this.audioUrl && latestAudio) this.audioUrl = latestAudio;

    return html`
      <div class="panel">
        <h2 class="page-title">Video Generator</h2>
        <div class="grid">
            <div class="preview">
                ${this.videoUrl
                    ? html`<video controls src=${this.videoUrl}></video>`
                    : html`<p style="color: var(--text-tertiary);">Video preview will appear here</p>`
                }
            </div>
            <div class="config">
                <div>
                    <label>Mastered Mix
                        <select .value=${this.audioUrl} @change=${(e:any) => this.audioUrl = e.target.value} ?disabled=${this.isLoading}>
                            <option value="">Select an audio version</option>
                            ${project.versions.map(v => html`<option value=${v.url}>${v.label}</option>`)}
                        </select>
                    </label>
                </div>
                <div>
                    <label>Preset
                        <select .value=${this.template} @change=${(e:any) => this.template = e.target.value} ?disabled=${this.isLoading}>
                            <option value="spectrum">Spectrum</option>
                            <option value="audiogram">Audiogram</option>
                            <option value="lyric">Lyric Video</option>
                        </select>
                    </label>
                </div>
                 <button @click=${this._generate} ?disabled=${this.isLoading} class="primary" style="margin-top: 1rem;">
                    ${this.isLoading ? 'Rendering Video...' : 'Render Video'}
                </button>
            </div>
        </div>

        ${this.renderProgressIndicator()}
        ${this.renderErrorMessage()}
      </div>
    `;
  }
}
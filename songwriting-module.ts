// songwriting-module.ts
import {css, html, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {consume} from '@lit/context';
import {appContext, AppContext} from '@/context.ts';
import type { SongState } from '@/sections.ts';
import { aiService, type LyricDraft } from '@/ai-service.ts';
import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';

@customElement('songwriting-module')
export class SongwritingModule extends StudioModule {
  @consume({context: appContext, subscribe: true})
  private _app!: AppContext;

  // State for Full Draft Generator
  @state() private draftPrompt = 'Write a verse and chorus for a hip-hop track about ambition and overcoming obstacles.';
  @state() private drafts: LyricDraft[] = [];

  // State for LyriQ Muse
  @state() private isMuseOpen = false;
  @state() private musePrompt = 'a metaphor for a fading memory';
  @state() private museSuggestions: string[] = [];
  @state() private isGeneratingMuseSuggestions = false;
  @state() private museError = '';


  static styles = [sharedStyles, css`
    .panel {
      padding: var(--spacing-xl);
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
    }

    .main-lyrics-editor {
        width: 100%;
        min-height: 400px;
        font-family: var(--font-mono);
        font-size: 1rem;
        line-height: 1.6;
        padding: var(--spacing-lg);
        resize: vertical;
        background-color: var(--bg-input);
        border: 1px solid var(--border-color);
        margin-bottom: var(--spacing-lg);
    }
    /* Styles omitted for brevity */
  `];

  private async _generateDrafts() {
    this.drafts = [];
    const task = async () => {
      const res = await aiService.lyricsDraft({ prompt: this.draftPrompt });
      this.drafts = res.drafts;
      return res;
    };
    
    const res = await this._performTask('Generate Lyric Drafts', [
        { message: 'Sending prompt to LLM service...', duration: 1000 },
        { message: 'Generating lyrical concepts...', duration: 2500 },
    ], task);
    if (!res) {
      this._app.showToast(this.errorMessage || 'Lyric draft failed.', 'error');
    }
  }

  private _adopt(i: number) {
    const draft = this.drafts[i];
    if (!draft || !this._app.songState) return;
    this._app.updateCurrentSong({ lyrics: draft.text });
    this._app.showToast('Lyrics adopted!', 'success');
  }

  private _handleLyricsChange(e: Event) {
    const text = (e.target as HTMLTextAreaElement).value;
    this._app.updateCurrentSong({ lyrics: text });
  }

  private _openMuseModal() { this.isMuseOpen = true; }
  private _closeMuseModal() { this.isMuseOpen = false; }
  private async _generateMuseSuggestions() { /* ... */ }
  private _insertSuggestion(suggestion: string) { /* ... */ }
  private _renderMuseModal() { /* ... */ return html``; }

  render() {
    if (!this._app || !this._app.songState) {
        return html`<div class="panel"><p>Loading project...</p></div>`;
    }

    return html`
      <div class="panel">
        <h2 class="page-title">Songwriting Studio</h2>
        <div class="control-group">
            <div class="editor-header">
                <h3>Lyrics Editor</h3>
                <button @click=${this._openMuseModal}>LyriQ Muse</button>
            </div>
            <p class="sub-label">Craft your song here. Use the LyriQ Muse for line-by-line inspiration, or the Full Draft Generator for a complete starting point.</p>
            <textarea 
                class="main-lyrics-editor"
                .value=${this._app.songState.lyrics ?? ''} 
                @input=${this._handleLyricsChange}
                rows="20" 
                aria-label="Main lyrics editor"
                placeholder="Your song lyrics go here..."></textarea>
        </div>
        
        <details class="generator-section">
            <summary>Full Draft Generator</summary>
            <div class="generator-content">
                <div class="generator-controls">
                    <div>
                      <label>Creative Prompt</label>
                      <textarea .value=${this.draftPrompt} @input=${(e:any)=>this.draftPrompt=e.target.value} rows="4" placeholder="Describe the theme, mood, and story of your song..."></textarea>
                    </div>
                    <div class="generator-actions">
                      <button @click=${this._generateDrafts} ?disabled=${this.isLoading} class="primary">
                        ${this.isLoading?'Generating…':'Generate Drafts'}
                      </button>
                    </div>
                </div>
              
                ${this.isLoading || this.errorMessage || this.drafts.length > 0 ? html`
                  <div class="generator-results">
                    ${this.renderProgressIndicator()}
                    ${this.renderErrorMessage()}
                    
                    <div class="drafts-grid">
                      ${this.drafts.map((d,i)=>html`
                        <div class="draft-card">
                          <div class="draft-card-header">
                            Draft ${i + 1}
                          </div>
                          <pre>${d.text}</pre>
                          <div class="draft-card-footer">
                            <button @click=${()=>this._adopt(i)}>Use This Draft</button>
                          </div>
                        </div>
                      `)}
                    </div>
                  </div>
                ` : nothing}
            </div>
        </details>

        ${this.isMuseOpen ? this._renderMuseModal() : nothing}
      </div>
    `;
  }
}
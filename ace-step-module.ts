import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';
import { aiService } from '@/ai-service.ts';

@customElement('ace-step-module')
export class AceStepModule extends StudioModule {
  @state() private prompt = 'lofi hiphop beat for studying';
  @state() private aceStyle = 'lofi';
  @state() private url?: string;

  private async _generate() {
    this.url = undefined;
    const task = async () => {
      const res = await aiService.aceGenerate({
        prompt: this.prompt,
        style: this.aceStyle,
      });
      this.url = res.url;
      return res;
    };
    await this._performTask('Generate with ACE-Step', [
        { message: 'Sending request to ACE-Step service...', duration: 1000 },
        { message: 'ACE-Step is processing...', duration: 3000 },
    ], task);
  }

  static override styles = [sharedStyles, css`
    .panel {
        padding: var(--spacing-xl);
        max-width: 800px;
        margin: 0 auto;
    }
    audio { 
      width:100%; 
      margin-top: 1rem; 
    }
  `];

  render() {
    return html`
      <div class="panel">
        <h2 class="page-title">ACE-Step Generation</h2>
        <div class="well">
            <div class="row" style="grid-template-columns: 1fr;">
              <div>
                <label>Prompt</label>
                <textarea .value=${this.prompt} @input=${(e:any)=>this.prompt=e.target.value} rows="3" ?disabled=${this.isLoading}></textarea>
              </div>
              <div>
                <label>Style</label>
                <input type="text" .value=${this.aceStyle} @input=${(e:any)=>this.aceStyle=e.target.value} ?disabled=${this.isLoading}/>
              </div>
            </div>
            <div style="text-align: right; margin-top: 1.5rem;">
                <button @click=${this._generate} ?disabled=${this.isLoading} class="primary">
                    ${this.isLoading ? 'Generating...' : 'Generate with ACE-Step'}
                </button>
            </div>
        </div>
        
        ${this.renderProgressIndicator()}
        ${this.renderErrorMessage()}
        
        ${this.url ? html`
            <div class="control-group" style="margin-top: 1.5rem;">
                <h4>Generated Track (Stub)</h4>
                <audio controls src=${this.url}></audio>
            </div>
        `:''}
      </div>
    `;
  }
}
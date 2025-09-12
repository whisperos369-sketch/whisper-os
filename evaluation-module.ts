// evaluation-module.ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {consume} from '@lit/context';
import {appContext, AppContext} from '@/context.ts';
import type { SongState } from '@/sections.ts';
import { aiService } from '@/ai-service.ts';
import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';

@customElement('evaluation-module')
export class EvaluationModule extends StudioModule {
  @consume({context: appContext, subscribe: true})
  private _app!: AppContext;

  @state() private report?: any;

  private _getProject(): SongState | null {
      return this._app?.songState ?? null;
  }

  private async _evaluate() {
    const project = this._getProject();
    if (!project?.audio.latestMix) return;
    
    this.report = undefined;

    const task = async () => {
      const result = await aiService.evaluate({ refs: [], gens: [project.audio.latestMix!]});
      this.report = result;
      return result;
    };
    
    await this._performTask('Evaluate Mix', [
      { message: 'Analyzing audio features...', duration: 2000 },
      { message: 'Comparing with reference tracks...', duration: 2500 },
      { message: 'Generating evaluation report...', duration: 1000 },
    ], task);
  }
  
  static styles = [sharedStyles];

  // FIX: Removed 'override' modifier to fix build error.
  render(){
    const project = this._getProject();
    if (!project) return html`<div class="panel"><p>Loading...</p></div>`;

    return html`
    <div class="panel">
      <h2 class="page-title">Evaluation</h2>
      <div class="well">
        <p class="sub-label">Analyze the latest mix against common quality metrics and reference tracks.</p>
        <button @click=${this._evaluate} ?disabled=${this.isLoading || !project.audio.latestMix} class="primary">
            ${this.isLoading?'Evaluating…':'Evaluate Latest Mix'}
        </button>
      </div>
      
      ${this.renderProgressIndicator()}
      ${this.renderErrorMessage()}

      ${this.report ? html`
        <div class="control-group" style="margin-top: 2rem;">
            <h4>Evaluation Report</h4>
            <pre style="white-space: pre-wrap; background-color: var(--bg-input); padding: 1rem; border-radius: var(--border-radius);">${JSON.stringify(this.report, null, 2)}</pre>
        </div>
      `: ''}
    </div>
    `;
  }
}
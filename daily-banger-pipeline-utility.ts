

/**
 * @fileoverview The "Daily Banger Pipeline" utility component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { sharedStyles } from './shared-styles.ts';
import { StudioModule } from './studio-module.ts';
import { aiService } from './services/ai-service.ts';
import { DailyHits } from './schema.ts';
import { appContext, AppContext } from './context.ts';
import { beatAgent } from './beat-agent.ts';

@customElement('daily-banger-pipeline-utility')
export class DailyBangerPipelineUtility extends StudioModule {
    @consume({context: appContext, subscribe: true})
    private appContext!: AppContext;
    
    @state() private report: DailyHits | null = null;
    
    static styles = [
      sharedStyles,
      css`
        .song-master-plan {
            background-color: var(--bg-panel);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            margin-bottom: 1rem;
            transition: all 0.2s ease-in-out;
        }
        .song-master-plan:hover {
            border-color: var(--border-color-strong);
            background-color: var(--bg-hover);
        }
        .song-header {
            padding: 1rem 1.5rem;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .song-header h4 { margin: 0; font-size: 1.1rem; }
        .song-header .button {
            background-color: transparent;
            border-color: var(--border-color-strong);
        }
        .song-details {
            padding: 0 1.5rem 1.5rem;
            border-top: 1px solid var(--border-color);
        }
      `
    ];

    private async _handleGenerateReport() {
        const task = async () => {
            const result = await aiService.generateDailyHits();
            this.report = result;
            return result;
        };

        await this._performTask("Generate Daily Hits Report", [{ message: "Analyzing trends and generating 3 song concepts...", duration: 4000 }], task);
    }
    
    private async _handleCreateSong(song: any) {
        if (!this.appContext.audioContext) return;

        const task = async () => {
            // A simplified generation based on the plan
            const prompt = `${song.title} - ${song.tagline}. ${song.genre_dna}`;
            const buffer = await beatAgent.generateInstrumental({
                audioContext: this.appContext.audioContext!,
                duration: 45, // Snippet length
                bpm: song.bpm,
                keySignature: song.key,
                instrumentalDescriptions: {
                    drums: song.beat_plan.drums,
                    bassline: song.beat_plan.bass,
                    melody: song.beat_plan.melody,
                    pads: song.beat_plan.pads,
                }
            });

            this.appContext.updateTrack({
                title: song.title,
                artist: 'Daily Banger Pipeline',
                duration: buffer.duration,
                audioBuffer: buffer,
                coverArtUrl: song.virality.thumbnail
            });

            this.appContext.showToast(`'${song.title}' generated and loaded into player!`, 'success');
        };

        await this._performTask(`Creating: ${song.title}`, [{ message: "Generating audio based on master plan...", duration: 5000 }], task);
    }

    render() {
        return html`
            <div class="panel">
                <h2 class="page-title">Daily Banger Pipeline</h2>
                <div class="control-group">
                    <h3>Generate Today's Hits</h3>
                    <p class="sub-label">Consult the Trend-Sync Agent to generate three commercially viable song concepts based on real-time market data.</p>
                    <button class="primary" @click=${this._handleGenerateReport} ?disabled=${this.isLoading}>
                        ${this.isLoading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
                
                ${this.renderProgressIndicator()}
                ${this.renderErrorMessage()}

                ${this.report ? html`
                    <div class="control-group">
                        <h3>Today's Report (${new Date(this.report.date).toLocaleDateString()})</h3>
                        ${this.report.songs.map(song => html`
                            <div class="song-master-plan">
                                <details>
                                    <summary class="song-header">
                                        <h4>${song.title}</h4>
                                        <button @click=${(e: Event) => { e.preventDefault(); this._handleCreateSong(song); }}>Create Song</button>
                                    </summary>
                                    <div class="song-details">
                                        <p><strong>Tagline:</strong> ${song.tagline}</p>
                                        <p><strong>Trend:</strong> ${song.trend_inspiration}</p>
                                        <p><strong>Genre DNA:</strong> ${song.genre_dna}</p>
                                        <p><strong>Rationale:</strong> ${song.rationale}</p>
                                    </div>
                                </details>
                            </div>
                        `)}
                    </div>
                ` : ''}
            </div>
        `;
    }
}
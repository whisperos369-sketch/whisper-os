/**
 * @fileoverview The "Settings" utility component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from '@/shared-styles.ts';
import * as ops from '@/ui/ops/index.ts';
import type { Settings } from '@/ui/ops/types.ts';
import { StudioModule } from '@/studio-module.ts';
import { aiService } from '@/ai-service.ts';

@customElement('settings-module')
export class SettingsModule extends StudioModule {
    
    @state() private settings: Partial<Settings> = {};
    @state() private saveStatus = '';
    private saveTimeout: number | undefined;

    @state() private githubCommitMessage = '';
    
    static styles = [sharedStyles, css`
        .panel { padding: var(--spacing-xl); max-width: 900px; margin: 0 auto; }
    `];
    
    async firstUpdated() {
        this.settings = await ops.getSettings();
    }

    private _handleInput(path: string, value: any) {
        const keys = path.split('.');
        const newSettings = { ...this.settings };
        let current: any = newSettings;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        
        this.settings = newSettings;
    }

    private async _saveSettings() {
        this.isLoading = true;
        try {
            await ops.updateSettings(this.settings);
            this.saveStatus = 'Settings saved successfully!';
            clearTimeout(this.saveTimeout);
            this.saveTimeout = window.setTimeout(() => this.saveStatus = '', 3000);
        } catch(e) {
            this.errorMessage = `Failed to save: ${(e as Error).message}`;
        } finally {
            this.isLoading = false;
        }
    }

    private async _handleGithubSync() {
      const task = async () => {
          const res = await aiService.syncToGithub({ commitMessage: this.githubCommitMessage || 'Sync from Whisper OS', branch: 'main' });
          // FIX: Cast `this` to `LitElement` to access `dispatchEvent`.
          (this as LitElement).dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Synced to GitHub! Commit: ${res.commitUrl.slice(-7)}`, type: 'success' }, bubbles: true, composed: true }));
          return res;
      };
      await this._performTask("Sync to GitHub", [{ message: "Committing and pushing changes...", duration: 2000 }], task);
    }

    render() {
        return html`
            <div class="panel">
                <h2 class="page-title">Settings</h2>
                <div class="control-group">
                    <h3>Scheduling</h3>
                    <div class="row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <label>Numerology-Aligned Scheduling</label>
                            <p class="sub-label" style="margin-top: 0;">Align release times with numerologically significant numbers.</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                .checked=${this.settings.numerology?.enabled ?? true} 
                                @change=${(e: Event) => this._handleInput('numerology.enabled', (e.target as HTMLInputElement).checked)}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <div class="control-group">
                    <h3>Version Control</h3>
                    <div class="row">
                        <div>
                            <label>Commit Message</label>
                            <input type="text" placeholder="e.g., 'Updated synth lead'" .value=${this.githubCommitMessage} @input=${(e: any) => this.githubCommitMessage = e.target.value}>
                        </div>
                    </div>
                    <button @click=${this._handleGithubSync} ?disabled=${this.isLoading} style="margin-top: 1rem;">
                        Sync to GitHub
                    </button>
                </div>

                 <div class="control-group" style="flex-direction: row; justify-content: space-between; align-items: center;">
                    <button @click=${this._saveSettings} class="primary">Save All Settings</button>
                    ${this.saveStatus ? html`<span style="color: var(--color-success); font-size: 0.85rem;">${this.saveStatus}</span>` : ''}
                </div>
                ${this.renderProgressIndicator()}
                ${this.renderErrorMessage()}
            </div>
        `;
    }
}
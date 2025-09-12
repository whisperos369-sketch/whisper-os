/**
 * @fileoverview The "Creative DNA" utility component for personalization.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';
import { sharedStyles } from './shared-styles.ts';
import { appContext } from './context.ts';
import { GENRES } from './data.ts';
import { StudioModule } from './studio-module.ts';

export type CreativeDnaProfile = {
    brandLexicon: string;
    sonicPalette: {
        genres: string[];
        loras: string[];
        instruments: string;
    };
    inspirationHub: string;
};

@customElement('creative-dna-utility')
export class CreativeDnaUtility extends StudioModule {
    private appContextConsumer = new ContextConsumer(this, {context: appContext, subscribe: true});

    @state() private profile: CreativeDnaProfile = {
        brandLexicon: '',
        sonicPalette: {
            genres: [],
            loras: [],
            instruments: '',
        },
        inspirationHub: '',
    };

    @state() private saveStatus = '';
    private saveTimeout: number | undefined;

    static styles = [sharedStyles];

    firstUpdated() {
        this._loadProfile();
    }

    private _loadProfile() {
        const savedProfile = localStorage.getItem('creative-dna-profile');
        if (savedProfile) {
            try {
                this.profile = JSON.parse(savedProfile);
            } catch (e) {
                console.error('Failed to parse Creative DNA profile', e);
            }
        }
    }

    private _saveProfile() {
        localStorage.setItem('creative-dna-profile', JSON.stringify(this.profile));
        this.saveStatus = 'Profile saved successfully!';
        clearTimeout(this.saveTimeout);
        this.saveTimeout = window.setTimeout(() => this.saveStatus = '', 3000);
    }
    
    private _handleInput(field: keyof CreativeDnaProfile, e: Event) {
        const value = (e.target as HTMLInputElement).value;
        this.profile = { ...this.profile, [field]: value };
    }
    
    private _handleSonicInput(field: keyof CreativeDnaProfile['sonicPalette'], e: Event) {
        const value = (e.target as HTMLInputElement).value;
        this.profile = {
            ...this.profile,
            sonicPalette: {
                ...this.profile.sonicPalette,
                [field]: value,
            }
        };
    }
    
    private _handleCheckboxGroup(field: 'genres' | 'loras', value: string, isChecked: boolean) {
        const currentValues = this.profile.sonicPalette[field] || [];
        let newValues;
        if (isChecked) {
            newValues = [...currentValues, value];
        } else {
            newValues = currentValues.filter(item => item !== value);
        }
        
        this.profile = {
            ...this.profile,
            sonicPalette: {
                ...this.profile.sonicPalette,
                [field]: newValues,
            }
        };
    }
    
    render() {
        const trainedLoras = this.appContextConsumer.value?.trainedLoras ?? [];
        return html`
            <div class="panel">
                <h2 class="page-title">Creative DNA</h2>
                <div class="control-group">
                    <h3>Brand Lexicon</h3>
                    <p class="sub-label">Define your unique artistic vocabulary. The AI will prioritize these keywords, phrases, and concepts in lyrical and descriptive generation.</p>
                    <div>
                        <label for="brand-lexicon">Keywords (comma-separated)</label>
                        <textarea id="brand-lexicon" 
                            .value=${this.profile.brandLexicon} 
                            @input=${(e: Event) => this._handleInput('brandLexicon', e)}
                            placeholder="e.g., cyberpunk, midnight drive, nostalgia, chrome, rain"></textarea>
                    </div>
                </div>

                <div class="control-group">
                    <h3>Sonic Palette</h3>
                    <p class="sub-label">Specify your preferred genres, instruments, and custom sound models (LoRAs) to guide the musical direction.</p>
                    
                    <div>
                        <label>Favorite Genres</label>
                        <div class="checkbox-group">
                            ${GENRES.map(genre => html`
                                <label>
                                    <input 
                                        type="checkbox" 
                                        .checked=${this.profile.sonicPalette.genres.includes(genre)}
                                        @change=${(e: Event) => this._handleCheckboxGroup('genres', genre, (e.target as HTMLInputElement).checked)}>
                                    ${genre}
                                </label>
                            `)}
                        </div>
                    </div>
                    
                    ${trainedLoras.length > 0 ? html`
                        <div>
                            <label>Favorite LoRAs</label>
                            <div class="checkbox-group">
                                ${trainedLoras.map(lora => html`
                                    <label>
                                        <input 
                                            type="checkbox"
                                            .checked=${this.profile.sonicPalette.loras.includes(lora.name)}
                                            @change=${(e: Event) => this._handleCheckboxGroup('loras', lora.name, (e.target as HTMLInputElement).checked)}>
                                        ${lora.name} (${lora.type})
                                    </label>
                                `)}
                            </div>
                        </div>
                    ` : ''}

                    <div>
                        <label for="sonic-instruments">Preferred Instruments & Characteristics</label>
                        <textarea id="sonic-instruments"
                            .value=${this.profile.sonicPalette.instruments}
                            @input=${(e: Event) => this._handleSonicInput('instruments', e)}
                            placeholder="e.g., gritty 808s, ethereal synth pads, detuned analog synths, female vocal chops"></textarea>
                    </div>
                </div>
                
                <div class="control-group">
                    <h3>Inspiration Hub</h3>
                    <p class="sub-label">Provide links to artists, songs, or mood boards. The AI will analyze these to better understand your aesthetic.</p>
                    <div>
                        <label for="inspiration-hub">Links (one per line)</label>
                        <textarea id="inspiration-hub"
                            .value=${this.profile.inspirationHub}
                            @input=${(e: Event) => this._handleInput('inspirationHub', e)}
                            placeholder="e.g., https://open.spotify.com/artist/..."></textarea>
                    </div>
                </div>

                <div class="control-group" style="flex-direction: row; justify-content: space-between; align-items: center;">
                    <button @click=${this._saveProfile}>Save Profile</button>
                    ${this.saveStatus ? html`<span style="color: var(--color-success); font-size: 0.85rem;">${this.saveStatus}</span>` : ''}
                </div>
            </div>
        `;
    }
}

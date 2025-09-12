/**
 * @fileoverview The "Sonic Alchemist" utility for mix suggestions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { sharedStyles } from './shared-styles.ts';
import { StudioModule } from './studio-module.ts';
import { aiService } from './ai-service.ts';
import type { SonicAlchemistReport } from './schema.ts';

@customElement('sonic-alchemist-utility')
export class SonicAlchemistUtility extends StudioModule {
    @state() private instrumentalDescription = '';
    @state() private report: SonicAlchemistReport | null = null;

    // Local state for interactive sliders
    @state() private saturationValue = 0;
    @state() private stereoWidthValue = 0;

    static override styles = [sharedStyles];

    firstUpdated() {
        this._updatePrimaryAction();
    }

    updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('instrumentalDescription') || changedProperties.has('isLoading')) {
            this._updatePrimaryAction();
        }
    }

    private _updatePrimaryAction() {
        (this as LitElement).dispatchEvent(new CustomEvent('primary-action-update', {
            detail: {
                label: 'Consult the Alchemist',
                action: this._handleConsultAlchemist.bind(this),
                disabled: this.isLoading || !this.instrumentalDescription.trim(),
            },
            bubbles: true,
            composed: true,
        }));
    }

    private async _handleConsultAlchemist() {
        this.report = null;
        this.errorMessage = '';

        const stages = [
            { message: '[Sonic Alchemist] Analyzing instrumental description...', duration: 1500 },
            { message: '[Sonic Alchemist] Simulating mix environments...', duration: 2000 },
            { message: '[Sonic Alchemist] Formulating enhancement plan...', duration: 1000 },
        ];

        const task = async () => {
            const result = await aiService.runSonicAlchemist(this.instrumentalDescription);
            if (!result) throw new Error('Failed to get a report from the Sonic Alchemist.');
            this.report = result;
            // Initialize slider values from the report
            this.saturationValue = this.report.saturation.value.value;
            this.stereoWidthValue = this.report.stereoWidth.value.value;
        };

        await this._performTask('Consult Sonic Alchemist', stages, task);
        this._updatePrimaryAction();
    }
    
    private _renderReport() {
        if (!this.report) return null;

        return html`
            <div class="control-group" style="margin-top: 1.5rem;">
                <h3>Alchemist's Report</h3>
                <div class="row">
                    <div class="slider-container">
                        <label>Saturation: ${this.saturationValue}% (${this.report.saturation.style})</label>
                        <input 
                            type="range" 
                            min=${this.report.saturation.value.min} 
                            max=${this.report.saturation.value.max} 
                            .value=${String(this.saturationValue)} 
                            @input=${(e: Event) => this.saturationValue = parseInt((e.target as HTMLInputElement).value)}>
                        <p class="sub-label">Recommended: ${this.report.saturation.value.value}%</p>
                    </div>
                    <div class="slider-container">
                        <label>Stereo Width (${this.report.stereoWidth.section}): ${this.stereoWidthValue}%</label>
                        <input 
                            type="range" 
                            min=${this.report.stereoWidth.value.min} 
                            max=${this.report.stereoWidth.value.max} 
                            .value=${String(this.stereoWidthValue)}
                            @input=${(e: Event) => this.stereoWidthValue = parseInt((e.target as HTMLInputElement).value)}>
                         <p class="sub-label">Recommended: ${this.report.stereoWidth.value.value}%</p>
                    </div>
                </div>
                 <div>
                    <label>Textural Layer</label>
                    <p class="sub-label"><strong>Suggestion:</strong> ${this.report.texturalLayer.description}</p>
                    <p class="sub-label"><strong>Placement:</strong> ${this.report.texturalLayer.placement}</p>
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <div class="panel">
                <h2 class="page-title">Sonic Alchemist</h2>
                <div class="control-group">
                    <h3>Instrumental Enhancement</h3>
                    <p class="sub-label">
                        Describe an instrumental track, and the Sonic Alchemist will provide expert suggestions for saturation, stereo width, and textural layers to improve its character and depth.
                    </p>
                    <div>
                        <label for="instrumental-description">Instrumental Description</label>
                        <textarea 
                            id="instrumental-description"
                            .value=${this.instrumentalDescription}
                            @input=${(e: Event) => this.instrumentalDescription = (e.target as HTMLTextAreaElement).value}
                            placeholder="e.g., A lo-fi hip-hop beat with a simple piano melody, vinyl crackle, and a soft bassline."
                        ></textarea>
                    </div>
                </div>

                ${this.renderProgressIndicator()}
                ${this.renderErrorMessage()}
                ${this._renderReport()}
            </div>
        `;
    }
}
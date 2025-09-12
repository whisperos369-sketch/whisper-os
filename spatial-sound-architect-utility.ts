/**
 * @fileoverview The "Spatial Sound Architect" utility for immersive audio suggestions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';

import { sharedStyles } from './shared-styles.ts';
import { StudioModule } from './studio-module.ts';
import { aiService } from './ai-service.ts';
import { appContext } from './context.ts';
import type { SpatialSoundReport } from './schema.ts';

@customElement('spatial-sound-architect-utility')
export class SpatialSoundArchitectUtility extends StudioModule {
    private appContextConsumer = new ContextConsumer(this, { context: appContext, subscribe: true });
    
    @state() private instrumentalDescription = '';
    @state() private report: SpatialSoundReport | null = null;
    
    // State for dynamic element selection
    @state() private availableElements: string[] = [];
    @state() private panningTargetElement = '';

    static override styles = [
        sharedStyles,
        css`
            .report-section {
                padding-top: 1.5rem;
                margin-top: 1.5rem;
                border-top: 1px solid var(--border-color);
            }
            .report-section:first-of-type {
                padding-top: 0;
                margin-top: 0;
                border-top: none;
            }
        `
    ];

    firstUpdated() {
        this._updatePrimaryAction();
    }

    updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('instrumentalDescription') || changedProperties.has('isLoading')) {
            this._updatePrimaryAction();
        }
    }
    
    private _updateAvailableElements(description: string) {
        if (!description.trim()) {
            this.availableElements = [];
            this.panningTargetElement = '';
            return;
        }
    
        // Prioritize multi-word keywords
        const keywords = ['synth pads', 'synth lead', 'synth', 'pads', 'kick drum', 'kick', 'drum', 'drums', 'bassline', 'bass', 'vocal chop', 'vocal', 'vocals', 'piano', 'guitar', 'melody', 'hi-hat', 'snare', 'arpeggio', 'pluck', 'strings', 'bell'];
        const foundElements = new Set<string>();
        const lowerDesc = description.toLowerCase();
    
        keywords.forEach(keyword => {
            if (lowerDesc.includes(keyword)) {
                // Capitalize for display
                foundElements.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            }
        });
    
        // Clean up subsets (e.g., if "Synth Pads" is found, remove "Synth")
        if (foundElements.has('Synth pads')) { foundElements.delete('Synth'); foundElements.delete('Pads'); }
        if (foundElements.has('Kick drum')) foundElements.delete('Kick');
        if (foundElements.has('Vocal chop')) { foundElements.delete('Vocal'); foundElements.delete('Vocals'); }
        if (foundElements.has('Synth lead')) foundElements.delete('Synth');
    
        this.availableElements = [...foundElements];
        
        // If the currently selected element is no longer in the list, reset it.
        if (!this.availableElements.includes(this.panningTargetElement)) {
            this.panningTargetElement = this.availableElements[0] || '';
        } else if (!this.panningTargetElement && this.availableElements.length > 0) {
            // If no element is selected but there are available ones, select the first one.
            this.panningTargetElement = this.availableElements[0];
        }
    }

    private _updatePrimaryAction() {
        (this as LitElement).dispatchEvent(new CustomEvent('primary-action-update', {
            detail: {
                label: 'Consult the Architect',
                action: this._handleConsultArchitect.bind(this),
                disabled: this.isLoading || !this.instrumentalDescription.trim(),
            },
            bubbles: true,
            composed: true,
        }));
    }

    private async _handleConsultArchitect() {
        this.report = null;
        this.errorMessage = '';

        const stages = [
            { message: '[Spatial Architect] Analyzing instrumental description...', duration: 1500 },
            { message: '[Spatial Architect] Mapping 3D soundstage...', duration: 2000 },
            { message: '[Spatial Architect] Formulating immersive plan...', duration: 1000 },
        ];

        const task = async () => {
            const result = await aiService.runSpatialSoundArchitect(this.instrumentalDescription, this.panningTargetElement);
            if (!result) throw new Error('Failed to get a report from the Spatial Sound Architect.');
            this.report = result;
        };

        await this._performTask('Consult Spatial Sound Architect', stages, task);
        this._updatePrimaryAction();
    }
}
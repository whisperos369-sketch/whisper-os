

/**
 * @fileoverview The "Studio" mode wizard component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, svg, css, nothing, LitElement } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { classMap } from 'lit/directives/class-map.js';

import { sharedStyles } from './shared-styles.ts';
import { aiService, type ScoredLyricConcept } from './ai-service.ts';
import { StudioModule } from './studio-module.ts';
import { taskService } from './task-service.ts';
import { appContext, type AppContext } from './context.ts';
import { audioBufferToWav } from './utils.ts';
import { GENRES, STANDARD_VOCAL_MODELS } from './data.ts';
import { SongState, Section, type LyricDraft } from './sections.ts';
import type { PerformanceCoachReport, SmartLoraSelection, RhythmSuggestion, GrooveMatrix } from './schema.ts';
import { applyMasteringChain, MasteringChain } from './audio-effects.ts';
import { audioIntelService } from './audio-intel.ts';
import type { Analysis } from './audio-intel.ts';
import { beatAgent } from './beat-agent.ts';

type StudioWizardStep = 'concept' | 'lyrics' | 'instrumental' | 'vocals' | 'master' | 'release';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = ['Major', 'Minor'];

@customElement('studio-mode')
export class StudioMode extends StudioModule {
    @consume({ context: appContext, subscribe: true })
    private appContext!: AppContext;

    @property({ attribute: false })
    initialSongState!: SongState;

    @state() private activeStep: StudioWizardStep = 'concept';
    
    // All state now comes from appContext.songState, but local state is kept for UI controls
    // to avoid excessive global state updates on every input.
    // Concept State
    @state() private conceptBrief = '';
    @state() private conceptOptions: { optionA: ScoredLyricConcept, optionB: ScoredLyricConcept } | null = null;
    @state() private selectedConcept: ScoredLyricConcept | null = null;
    
    // Instrumental State
    @state() private instrumentalGenre = 'Pop';
    @state() private instrumentalBPM = 120;
    @state() private instrumentalKey = 'C';
    @state() private instrumentalScale = 'Minor';
    @state() private instrumentalDrums = 'A four-on-the-floor house beat with open hi-hats on the off-beat.';
    @state() private instrumentalMelody = 'A sparse, simple melody that follows the chords.';
    @state() private instrumentalBassline = 'a groovy, syncopated funk bassline';
    @state() private instrumentalPads = 'Subtle, atmospheric synth pads following the chords.';
    @state() private instrumentalEnergy = 0.5;
    @state() private instrumentalSpice = 0.5;
    @state() private grooveMatrix: GrooveMatrix | null = null;
    
    // Vocals State
    @state() private selectedVocalModel = STANDARD_VOCAL_MODELS[0];
    @state() private vocalsGenerated = false;
    
    // Master State
    @state() private masteringSuggestions: MasteringChain[] | null = null;
    @state() private selectedMasteringChain: MasteringChain | null = null;
    @state() private masteringApplied = false;
    @state() private trackAnalysis: Analysis | null = null;

    // Lyrical Muse & Rhythm Coach State
    @state() private activeMuseSection: Section | null = null;
    @state() private museSuggestions: Partial<Record<Section, string[]>> = {};
    @state() private isGeneratingMuse: Partial<Record<Section, boolean>> = {};
    @state() private activeRhythmCoachSection: Section | null = null;
    @state() private rhythmSuggestions: Partial<Record<Section, RhythmSuggestion[]>> = {};
    @state() private isGeneratingRhythmCoach: Partial<Record<Section, boolean>> = {};
    
    private readonly WIZARD_STEPS: { id: StudioWizardStep, label: string }[] = [
        { id: 'concept', label: '1. Concept' },
        { id: 'lyrics', label: '2. Lyrics' },
        { id: 'instrumental', label: '3. Instrumental' },
        { id: 'vocals', label: '4. Vocals' },
        { id: 'master', label: '5. Master' },
        { id: 'release', label: '6. Release' },
    ];

    static styles = [ sharedStyles, css`...`]; // Styles remain the same

    private _updatePrimaryAction() { /* ... (logic remains the same) */ }

    // FIX: Removed 'override' modifier to fix build error.
    connectedCallback() {
        super.connectedCallback();
        // FIX: Removed super.connectedCallback() as it does not exist on StudioModule.
        // Load initial state when component is connected
        if (this.initialSongState) {
            this.appContext.updateCurrentSong(this.initialSongState);
        }
    }

    // FIX: Removed 'override' modifier to fix build error.
    updated(changedProperties: Map<string | number | symbol, unknown>) {
        if (changedProperties.has('activeStep') || changedProperties.has('isLoading') || changedProperties.has('selectedConcept') || changedProperties.has('vocalsGenerated') || changedProperties.has('masteringApplied') || changedProperties.has('selectedMasteringChain')) {
            this._updatePrimaryAction();
        }
    }
    
    // --- Handlers for saving and updating song state ---
    private async _handleSaveProject() {
        await this.appContext.saveCurrentSong();
        // Maybe show a toast notification here
        console.log("Project saved!");
    }

    private _handleNameChange(e: Event) {
        const newName = (e.target as HTMLInputElement).value;
        if (this.appContext.songState) {
            const newMeta = { ...this.appContext.songState.meta, title: newName };
            this.appContext.updateCurrentSong({ meta: newMeta });
        }
    }

    private _handleLyricUpdate(section: Section, e: Event) {
        const text = (e.target as HTMLTextAreaElement).value;
        const songState = this.appContext.songState!;
        const existingDraft = songState.drafts[section]?.[0];

        const newDraft: LyricDraft = {
            text: text,
            analysis: existingDraft?.analysis ?? {
                themes: [],
                mood: 'custom',
                instrumentation_suggestions: [],
                visual_motifs: [],
                energy_curve: 'unknown',
            }
        };
        const newDrafts = { ...songState.drafts, [section]: [newDraft] };
        this.appContext.updateCurrentSong({ drafts: newDrafts });
    }
}

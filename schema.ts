/**
 * @fileoverview Zod schemas for validating AI agent outputs.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { z } from 'zod';

// For Market Fit Analyst
export const MarketFitReportSchema = z.object({
    fitScore: z.number().min(0).max(100).describe("The song's potential for commercial success, from 0 to 100."),
    bottlenecks: z.array(z.string()).describe("Potential issues that could hinder mainstream success."),
    quickWins: z.array(z.string()).describe("Actionable suggestions to enhance marketability."),
});
export type MarketFitReport = z.infer<typeof MarketFitReportSchema>;

// For A&R Scorer
export const ScoredLyricConceptSchema = z.object({
    verse: z.string(),
    chorus: z.string(),
    productionBrief: z.string().optional(),
    emotionScore: z.number().optional(),
    emotionFixes: z.array(z.string()).optional(),
    marketFitScore: z.number().optional(),
    marketQuickWins: z.array(z.string()).optional(),
});
export type ScoredLyricConcept = z.infer<typeof ScoredLyricConceptSchema>;

// For Hook Architect
export const HookVariationSchema = z.object({
    text: z.string(),
    earworm: z.number().min(0).max(1),
    why: z.string(),
    rhythmShape: z.enum(['straight', 'swung', 'syncopated']),
    pitchContour: z.enum(['rise', 'fall']),
});
export type HookVariation = z.infer<typeof HookVariationSchema>;

// For Rhythm Coach
export const RhythmSuggestionSchema = z.object({
    lyric: z.string().describe("The suggested new lyric with improved rhythm."),
    explanation: z.string().describe("A brief explanation of why the rhythm is improved."),
});
export type RhythmSuggestion = z.infer<typeof RhythmSuggestionSchema>;

// For Groove Surgeon
export const GrooveSurgeonReportSchema = z.object({
    swing: z.object({
        style: z.string(),
        percentage: z.number().min(0).max(100),
    }),
    microTiming: z.object({
        element: z.string(),
        adjustmentMs: z.number(),
    }),
    asymmetry: z.object({
        bar: z.number(),
        type: z.string(),
    }),
});
export type GrooveSurgeonReport = z.infer<typeof GrooveSurgeonReportSchema>;

// For Contrast Orchestrator
export const ContrastOrchestratorReportSchema = z.object({
    sectionContrast: z.object({
        from: z.string(),
        to: z.string(),
        axesChanged: z.array(z.string()),
    }),
    breakdown: z.object({
        placement: z.string(),
        description: z.string(),
    }),
    fxPlan: z.object({
        section: z.string(),
        description: z.string(),
    }),
});
export type ContrastOrchestratorReport = z.infer<typeof ContrastOrchestratorReportSchema>;

const ValueRangeSchema = z.object({
    value: z.number(),
    min: z.number(),
    max: z.number(),
});

// For Sonic Alchemist
export const SonicAlchemistReportSchema = z.object({
    saturation: z.object({
        style: z.string(),
        value: ValueRangeSchema,
    }),
    stereoWidth: z.object({
        section: z.string(),
        value: ValueRangeSchema,
    }),
    texturalLayer: z.object({
        description: z.string(),
        placement: z.string(),
    }),
});
export type SonicAlchemistReport = z.infer<typeof SonicAlchemistReportSchema>;

// For Spatial Sound Architect
export const SpatialSoundReportSchema = z.object({
    hypnoticLayering: z.object({
        enabled: z.boolean(),
        suggestion: z.string(),
        mix: ValueRangeSchema,
    }),
    panningAutomation: z.object({
        element: z.string(),
        pattern: z.string(),
    }),
    atmosPlacement: z.object({
        element: z.string(),
        position: z.string(),
    }),
    stereoWidth: z.object({
        element: z.string(),
        suggestion: z.string().describe("e.g., 'Widen slightly for more impact'"),
        value: ValueRangeSchema,
    }),
});
export type SpatialSoundReport = z.infer<typeof SpatialSoundReportSchema>;


// For Performance Coach Agent
export const PerformanceCoachReportSchema = z.object({
    phrasingMap: z.array(z.string().describe("A specific suggestion for how to deliver a line or phrase.")),
    breathMap: z.array(z.string().describe("A suggestion for where a natural breath should occur in the lyrics.")),
    backingVocalMap: z.array(z.string().describe("An idea for a harmony, ad-lib, or layered vocal part.")),
});
export type PerformanceCoachReport = z.infer<typeof PerformanceCoachReportSchema>;

export const HarmonyArchitectReportSchema = z.object({
    chordProgression: z.array(z.string()).describe("A suggested chord progression (e.g., ['Am', 'G', 'C', 'F'])."),
    scaleMode: z.string().describe("The suggested musical scale or mode (e.g., 'C Major', 'Dorian')."),
    melodicContour: z.string().describe("A description of the melodic shape (e.g., 'rising then falling')."),
    rationale: z.string().describe("An explanation for the harmonic choices."),
});
export type HarmonyArchitectReport = z.infer<typeof HarmonyArchitectReportSchema>;

export const SmartLoraSelectionSchema = z.object({
    leadVocal: z.string().describe("The name of the best LoRA for the lead vocal."),
    backingVocal: z.string().describe("The name of the best LoRA for backing vocals."),
    instrumental: z.string().describe("The name of the best LoRA for a key instrumental sound."),
    rationale: z.string().describe("A brief explanation for the selections."),
});
export type SmartLoraSelection = z.infer<typeof SmartLoraSelectionSchema>;

export const AutoMashupPlanSchema = z.object({
    analysis: z.object({
        trackA: z.object({ bpm: z.number(), key: z.string() }),
        trackB: z.object({ bpm: z.number(), key: z.string() }),
    }),
    adjustments: z.object({
        targetBpm: z.number(),
        targetKey: z.string(),
        trackAPitchShiftSemitones: z.number(),
        trackBTimeStretchRatio: z.number(),
    }),
    structure: z.array(z.object({
        section: z.string(),
        source: z.enum(['A', 'B', 'A+B']),
        bars: z.number(),
    })),
});
export type AutoMashupPlan = z.infer<typeof AutoMashupPlanSchema>;

// For Daily Banger Pipeline
const SongViralitySchema = z.object({
    caption: z.string(),
    hashtags: z.array(z.string()),
    thumbnail: z.string(),
});

const SongScheduleSchema = z.object({
    tiktok: z.string(),
    instagram: z.string(),
    youtube: z.string(),
});

const SongPackageSchema = z.object({
    title: z.string(),
    tagline: z.string(),
    trend_inspiration: z.string(),
    genre_dna: z.string(),
    bpm: z.number(),
    key: z.string(),
    energy_map: z.record(z.string(), z.number()),
    lyrics: z.record(z.string(), z.array(z.string())),
    beat_plan: z.record(z.string(), z.string()),
    vocal_plan: z.record(z.string(), z.string()),
    mastering: z.object({ lufs: z.number(), ceiling_db: z.number() }),
    snippets: z.array(z.object({ dur: z.number(), focus: z.string() })),
    virality: SongViralitySchema,
    schedule: SongScheduleSchema,
    rationale: z.string(),
});

export const DailyHitsSchema = z.object({
    date: z.string(),
    songs: z.array(SongPackageSchema).length(3),
});
export type DailyHits = z.infer<typeof DailyHitsSchema>;

const CriticCriterionSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
});
export const CriticResultSchema = z.object({
    rhymeQuality: CriticCriterionSchema,
    emotionalDepth: CriticCriterionSchema,
    rhythmicFlow: CriticCriterionSchema,
    originality: CriticCriterionSchema,
});
export type CriticResult = z.infer<typeof CriticResultSchema>;

// Schemas for AI Composer Agent
export const NoteEventSchema = z.object({
    note: z.string().describe("The musical note (e.g., 'C4', 'kick', 'snare')."),
    time: z.number().describe("Start time in seconds."),
    duration: z.number().describe("Duration in seconds (for melodic instruments)."),
    velocity: z.number().min(0).max(1).describe("Note velocity (0.0 to 1.0)."),
});
export type NoteEvent = z.infer<typeof NoteEventSchema>;

export const MusicalDataSchema = z.object({
    drums: z.array(NoteEventSchema).optional(),
    bassline: z.array(NoteEventSchema).optional(),
    melody: z.array(NoteEventSchema).optional(),
    pads: z.array(NoteEventSchema).optional(),
}).describe("A structured representation of a musical composition.");
export type MusicalData = z.infer<typeof MusicalDataSchema>;

// Schema for the Groove Matrix Agent
const GrooveMatrixVariantSchema = z.object({
    description: z.string().describe("A short, evocative description of this instrumental variation."),
    drums: z.string().describe("A detailed description for the drum machine."),
    bassline: z.string().describe("A detailed description for the bassline."),
    melody: z.string().describe("A detailed description for the melody."),
    pads: z.string().describe("A detailed description for the pads."),
});

export const GrooveMatrixSchema = z.object({
    laidBackClean: GrooveMatrixVariantSchema,
    highEnergyClean: GrooveMatrixVariantSchema,
    laidBackGritty: GrooveMatrixVariantSchema,
    highEnergyGritty: GrooveMatrixVariantSchema,
});
export type GrooveMatrix = z.infer<typeof GrooveMatrixSchema>;
/**
 * @fileoverview Data definitions for the Presets mode.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PresetId = 'viral-hook' | 'full-cover' | 'mashup';

export type Preset = {
    id: PresetId;
    title: string;
    description: string;
    inputs: ('prompt' | 'vibe' | 'lead-voice' | 'file-a' | 'file-b')[];
};

export const PRESETS: Preset[] = [
    {
        id: 'viral-hook',
        title: 'Viral Hook Snippet',
        description: 'Generate a short, catchy 30-40s track with a strong hook, optimized for social media.',
        inputs: ['prompt', 'vibe', 'lead-voice'],
    },
    {
        id: 'full-cover',
        title: 'Full Song Cover',
        description: 'Provide a vocal track and let the AI generate a full instrumental backing in a new style.',
        inputs: ['file-a', 'prompt'],
    },
    {
        id: 'mashup',
        title: 'AI Mashup',
        description: 'Blend an acapella from one track with the instrumental of another. The AI will handle BPM and key alignment.',
        inputs: ['file-a', 'file-b'],
    },
];

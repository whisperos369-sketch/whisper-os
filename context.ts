/**
 * @fileoverview App-wide context definitions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {createContext} from '@lit/context';
import type { SongState, Marker, LoopRegion } from '@/sections.ts';
import type { ABCompareService, ABCompareState } from '@/ui/ab-compare-service.ts';

export type Lora = {
    name: string;
    epochs?: number;
    baseModel?: string;
    type?: 'sound' | 'vocal';
    learningRate?: string;
    batchSize?: number;
    steps?: number;
};

export type AgentName = 'lyrics' | 'music' | 'mastering' | 'cover' | 'video';
export type AgentState = 'idle' | 'working' | 'complete' | 'error';
export type AgentStatus = Record<AgentName, { status: AgentState; message?: string }>;

// State Context
export type AppContext = {
    // Project Management
    songState: SongState | null; // The currently loaded song project
    loadSong: (id: string) => Promise<void>;
    saveCurrentSong: () => Promise<void>;
    createNewSong: () => void;
    updateCurrentSong: (updates: Partial<SongState>, markDirty?: boolean) => void;
    
    // Audio Playback & Effects
    audioContext: AudioContext | null;
    analyserNode: AnalyserNode | null;
    currentTrack: { 
        title: string,
        artist: string,
        duration: number,
        audioBuffer: AudioBuffer | null,
        coverArtUrl?: string;
    },
    updateTrack: (track: AppContext['currentTrack']) => void;
    isPlaying: boolean;
    togglePlay: () => void;
    currentTime: number;
    setCurrentTime: (time: number) => void;
    
    // Global Settings
    trainedLoras: Lora[];
    explicitContentFilter: boolean;
    isPanningAutomationEnabled: boolean;
    togglePanningAutomation: () => void;
    hypnoticLayerMix: number;
    setHypnoticLayerMix: (mix: number) => void;
    stereoWidth: number;
    setStereoWidth: (width: number) => void;
    // Master EQ settings
    bassBoost: number;
    setBassBoost: (value: number) => void;
    midClarity: number;
    setMidClarity: (value: number) => void;
    highSparkle: number;
    setHighSparkle: (value: number) => void;
    
    // A/B Compare Service
    abState: ABCompareState;
    abService: ABCompareService;

    // Audio State for Pro Player
    audioLatencyMs: number;
    lufs: { i: number, s: number };
    peak: number;
    setLoudness: (lufs: { i: number, s: number }, peak: number) => void;

    // Agent State
    agentStatus: AgentStatus;
    updateAgentStatus: (agent: AgentName, status: AgentState, message?: string) => void;

    // UI Feedback
    showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
};
export const appContext = createContext<AppContext>('app-context');
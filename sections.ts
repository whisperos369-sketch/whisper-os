export type VersionRef = { id: string; label: string; url: string; createdAt: number };
export type LoraRef = { path: string; weight: number };
export type Section = string;
export type Marker = { time: number; label: string };
export type LoopRegion = { start: number; end: number };
export type StemMixState = {
    volume: number;
    pan: number;
    muted: boolean;
    solo: boolean;
    width?: number; // Stereo width, optional
    panLfo?: { rate: number; depth: number }; // Optional automation
};

// New types for richer agent collaboration
export type LyricDraftAnalysis = {
  themes: string[];
  mood: string;
  instrumentation_suggestions: string[];
  visual_motifs: string[];
  energy_curve: string;
};

export type LyricDraft = {
  text: string;
  analysis: LyricDraftAnalysis;
};

export type LyricsDraftResponse = {
  drafts: LyricDraft[];
};

// Types for Timeline View
export type Clip = {
  id: string;
  sourceUrl: string; // URL to the full audio file
  title: string;
  start: number; // Position on the timeline in seconds
  duration: number; // Duration on the timeline in seconds
  trimStart: number; // Start offset within the source audio in seconds
  trimEnd: number; // End offset within the source audio in seconds
};

export type Track = {
  id: string;
  name: string;
  clips: Clip[];
};

export type SongState = {
  id: string;
  meta: {
    title: string;
    bpm: number;
    key: string;
    duration: number;
    lufsTarget: number;
    createdAt: number;
    updatedAt: number;
    measurements?: { lufs: number; peak: number; };
    clipScore?: number;
  };
  loraStack: LoraRef[];
  generators: {
    seed: number;
    temperature: number;
    topK: number;
    topP: number;
    baseModel: string;
    mode: 'musicgen' | 'ace-step';
  };
  audio: {
    stems: Record<string,string>; // role -> url
    latestMix?: string;
  };
  visuals?: {
    coverArtUrl?: string;
    videoUrl?: string;
  };
  versions: VersionRef[];
  flags: { dirty: boolean; hasWarnings: boolean; hasErrors: boolean };
  order: Section[];
  drafts: Partial<Record<Section, LyricDraft[]>>;
  lyrics?: string;

  // New state for timeline view
  tracks: Track[];

  // New state for pro features
  markers: Marker[];
  loopRegion: LoopRegion | null;
  mix: {
    stems: Record<string, StemMixState>; // stemId -> mix state
    master: { volume: number; };
  }
};

export function newSong(): SongState {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    meta: { title: 'New Song', bpm: 140, key: 'E', duration: 24, lufsTarget: -14, createdAt: now, updatedAt: now },
    loraStack: [],
    generators: { seed: 2025, temperature: 1.0, topK: 250, topP: 0.95, baseModel: 'facebook/musicgen-medium', mode: 'musicgen' },
    audio: { stems: {} },
    visuals: {},
    versions: [],
    flags: { dirty: false, hasWarnings: false, hasErrors: false },
    order: ['verse1', 'chorus1', 'verse2', 'chorus2'],
    drafts: {
      verse1: [],
      chorus1: [],
      verse2: [],
      chorus2: [],
    },
    lyrics: '',
    tracks: [
      {
        id: crypto.randomUUID(),
        name: 'Instrumental',
        clips: [
            {
                id: crypto.randomUUID(),
                sourceUrl: '/api/placeholder.wav',
                title: 'Initial Beat',
                start: 2,
                duration: 8,
                trimStart: 0,
                trimEnd: 8,
            }
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'Vocals',
        clips: [],
      }
    ],
    markers: [],
    loopRegion: null,
    mix: {
        stems: {},
        master: { volume: 1.0 },
    },
  };
}
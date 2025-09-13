/**
 * @fileoverview A dedicated service to handle all interactions with the backend AI services.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { env } from '@/config/env.ts';
import type { LyricsDraftResponse, LyricDraft } from '@/sections.ts';
export type { LyricDraft };
import type { ScoredLyricConcept, AutoMashupPlan, SonicAlchemistReport, SpatialSoundReport, DailyHits, SmartLoraSelection } from '@/schema.ts';
export type { ScoredLyricConcept };
import { generateProceduralAudio, audioBufferToWav } from '@/utils.ts';
import { _fetch } from '@/ui/services/_fetch.ts';


export class AIError extends Error {
    constructor(message: string, public originalError?: unknown) {
        super(message);
        this.name = 'AIError';
    }
}

class AIService {

    private chatSource?: EventSource;
    private chatQueue: string[] = [];

    private async request<T>(url: string, init: RequestInit, errorMessage: string): Promise<T> {
        try {
            return await _fetch(url, init);
        } catch (err) {
            throw new AIError(errorMessage, err);
        }
    }

    initializeChat() {
        try {
            this.chatSource = new EventSource('/api/chat/stream');
            this.chatSource.onmessage = (e: MessageEvent) => {
                this.chatQueue.push(e.data as string);
            };
            this.chatSource.onerror = (e) => {
                console.error('Chat stream error', e);
            };
        } catch (err) {
            throw new AIError('Failed to initialize chat', err);
        }
    }

    async *sendMessageStream(text: string) {
        if (!this.chatSource) throw new AIError('Chat not initialized');
        this.chatQueue.length = 0;
        await this.request('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        }, 'Failed to send chat message');
        while (true) {
            if (this.chatQueue.length === 0) {
                await new Promise(r => setTimeout(r, 50));
                continue;
            }
            const chunk = this.chatQueue.shift()!;
            if (chunk === '[DONE]') break;
            yield { text: chunk };
        }
    }

    async lyricsDraft(input: { prompt: string; style?: string; [key: string]: any }): Promise<LyricsDraftResponse> {
        return this.request('/api/lyrics/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        }, 'Failed to draft lyrics');
    }

    async musicGen(input: { prompt: string; durationSec: number; model: string; [key: string]: any }): Promise<{ wavPath: string, mp3Path: string, report: any }> {
      return this.request('/api/music/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
      }, 'Music generation failed');
    }

// FIX: Add index signature to allow additional properties like temperature, top_k, and top_p.
    async generateMusicChunked(input: { prompt: string, segmentSeconds: number, crossfadeMs: number, maxSegments: number, model: string, [key: string]: any }): Promise<{ url: string, segments: number, model_used: string, note?: string, duration_sec: number }> {
       return this.request(env.MUSICGEN_URL + '/chunked', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
      }, 'Chunked music generation failed');
    }

    async rvcConvert(input: { audio_url: string; target_voice: string; [key: string]: any }): Promise<{ url: string }> {
        return this.request('/api/rvc/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        }, 'RVC conversion failed');
    }

    async generateVoice(input: { text: string, model: 'bark' | 'so-vits-svc' }): Promise<{ url: string }> {
        return this.request('/api/voice/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        }, 'Voice generation failed');
    }

    async separate(input: { files: File[]; [key: string]: any }, onProgress?: (p: string) => void): Promise<{ stems: Record<string, string> }> {
        if(onProgress) onProgress('Complete');
        return Promise.resolve({ 
            stems: { 
                vocals: '/static/stems/vocals.wav', 
                drums: '/static/stems/drums.wav',
                bass: '/static/stems/bass.wav',
                other: '/static/stems/other.wav'
            } 
        });
    }

    async alignArrange(input: any): Promise<AutoMashupPlan & { url: string }> {
        return Promise.resolve({
            url: '/mock_mashup.wav',
            analysis: { trackA: { bpm: 120, key: 'C Major' }, trackB: { bpm: 128, key: 'A Minor' } },
            adjustments: { targetBpm: 124, targetKey: 'A Minor', trackAPitchShiftSemitones: -3, trackBTimeStretchRatio: 0.96875 },
            structure: [],
        });
    }
    
    async exportPack(input: any): Promise<{ mixUrl: string, measurements: { lufs: number, peak: number } }> {
        return Promise.resolve({ mixUrl: '/mock_mastered.wav', measurements: { lufs: -14.0, peak: -1.0 } });
    }

    async evaluate(input: any): Promise<any> {
        return Promise.resolve({ report: 'This is a mock evaluation.' });
    }

    async coverArt(input: { prompt: string; [key: string]: any }): Promise<{ imagePath: string }> {
        return this.request('/api/cover/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        }, 'Cover art generation failed');
    }

    async videoGen(input: { audioPath: string; preset: string; [key: string]: any }): Promise<{ videoPath: string }> {
        return this.request('/api/video/render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        }, 'Video generation failed');
    }

    async aceGenerate(input: { prompt: string; style: string }): Promise<{ url: string }> {
        return this.request(env.ACE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        }, 'ACE generation failed');
    }

    async syncToGithub(payload: { commitMessage: string, branch: string }): Promise<{ status: string, commitUrl: string }> {
        console.log('[AI Service Stub] Syncing to GitHub with message:', payload.commitMessage);
        await new Promise(r => setTimeout(r, 1500));
        return Promise.resolve({ status: 'success', commitUrl: 'https://github.com/example/repo/commit/mock123' });
    }

    async getSmartLoraSelection(genre: string, context: string, loras: any[]): Promise<SmartLoraSelection> { 
        return Promise.resolve({ leadVocal: 'aria', backingVocal: 'titan', instrumental: '80s_synth', rationale: 'good fit' }); 
    }
    async generateRemixPlan(params: any, explicitFilter: boolean): Promise<string> { 
        return Promise.resolve(`Remix Plan:\nGenre: ${params.genre}\nFeatured: ${params.targets.join(', ')}`);
    }
    async runQuickDrop(prompt: string, vibe: string, leadVoice: string, files: any[], explicitFilter: boolean, project: any, mode: string): Promise<any> { 
        return Promise.resolve({ url: '/mock.wav', title: 'Quick Drop', bpm: 120, genre: vibe });
    }
    async runAutoMashup(fileA: File, fileB: File): Promise<AutoMashupPlan> { 
        return Promise.resolve({ analysis: { trackA: { bpm: 120, key: 'C' }, trackB: { bpm: 128, key: 'Am' } }, adjustments: { targetBpm: 124, targetKey: 'C', trackAPitchShiftSemitones: 0, trackBTimeStretchRatio: 0.97 }, structure: [] });
    }
    async generateDailyHits(): Promise<DailyHits> { 
        const songs = [
            { title: 'Cybernetic Sunrise', tagline: 'Waking up in a neon city', trend_inspiration: 'Synthwave revival on TikTok', genre_dna: 'Synthwave, Retrowave', bpm: 110, key: 'C# Minor', virality: { thumbnail: 'https://placehold.co/512x512/ff1493/ffffff?text=CS' } },
            { title: 'Lo-Fi Midnight', tagline: 'Rainy nights and chill beats', trend_inspiration: '24/7 study streams', genre_dna: 'Lo-Fi Hip-Hop, Chillhop', bpm: 85, key: 'A Minor', virality: { thumbnail: 'https://placehold.co/512x512/00BFFF/ffffff?text=LM' } },
            { title: 'Amapiano Heat', tagline: 'The sound of the summer', trend_inspiration: 'Trending dance challenges', genre_dna: 'Amapiano, Afro House', bpm: 115, key: 'F# Major', virality: { thumbnail: 'https://placehold.co/512x512/f59e0b/ffffff?text=AH' } },
        ];
        return Promise.resolve({ date: new Date().toISOString(), songs: songs as any });
    }
    async runSonicAlchemist(description: string): Promise<SonicAlchemistReport> {
        return Promise.resolve({ saturation: { style: 'tape', value: { value: 20, min: 0, max: 100 } }, stereoWidth: { section: 'all', value: { value: 110, min: 80, max: 150 } }, texturalLayer: { description: 'none', placement: 'none' } });
    }
    async runSpatialSoundArchitect(description: string, element: string): Promise<SpatialSoundReport> {
        return Promise.resolve({} as SpatialSoundReport);
    }
    async generateReleasePack(title: string, themes: string[], platforms: string[], explicitFilter: boolean): Promise<{captions: any[], hookSlices: any}> { 
        return Promise.resolve({captions: platforms.map(p => ({ platform: p, caption: `Check out ${title}!` })), hookSlices: {"5s": "0:10-0:15", "12s": "0:30-0:42", "30s": "1:00-1:30"} });
    }
}

export const aiService = new AIService();
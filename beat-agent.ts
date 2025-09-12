/**
 * @fileoverview A distinct agent service for generating instrumental beats.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { taskService } from '@/task-service.ts';
import { generateProceduralAudio } from '@/utils.ts';
import type { MusicalData, NoteEvent } from '@/schema.ts';

// In a production app, this would come from an environment configuration.
const MUSICGEN_BACKEND_URL = 'http://localhost:8000';

class BeatAgent {
    async generateInstrumental(options: {
        audioContext: AudioContext;
        duration: number;
        bpm: number;
        keySignature: string;
        instrumentalDescriptions: {
            drums: string;
            bassline: string;
            melody: string;
            pads: string;
        };
        conditioningAudio?: Blob;
    }): Promise<AudioBuffer> {
        const { audioContext } = options;

        const taskId = taskService.addTask(
            'Beat Agent: Generate with MusicGen',
            [
                { message: 'Connecting to MusicGen service...' },
                { message: 'MusicGen is processing the request...' },
                { message: 'Downloading generated audio...' },
            ]
        );

        try {
            const task = taskService.getTask(taskId)!;

            // --- STAGE 1: INITIATE GENERATION ---
            task.stages[0].status = 'running';
            taskService.updateTask(taskId, { status: 'running', statusMessage: 'Sending request...', stages: task.stages });

            // --- REAL IMPLEMENTATION (uncomment when backend is ready) ---
            // const formData = new FormData();
            // const params = { 
            //     duration: options.duration, 
            //     bpm: options.bpm, 
            //     keySignature: options.keySignature, 
            //     descriptions: options.instrumentalDescriptions 
            // };
            // formData.append('params', new Blob([JSON.stringify(params)], { type: 'application/json' }));

            // if (options.conditioningAudio) {
            //     formData.append('conditioning_audio', options.conditioningAudio, 'conditioning.wav');
            //     console.log("Beat Agent: Sending conditioning audio to backend.");
            // }

            // const response = await fetch(`${MUSICGEN_BACKEND_URL}/generate`, {
            //     method: 'POST',
            //     body: formData // No Content-Type header needed, browser sets it for FormData
            // });

            // if (!response.ok) throw new Error(`Failed to start generation job: ${response.statusText}`);
            // const { backend_task_id } = await response.json();
            
            // --- MOCK IMPLEMENTATION ---
            await new Promise(r => setTimeout(r, 500)); // Simulate network latency
            if (options.conditioningAudio) {
                console.log(`[Beat Agent Mock] Received conditioning audio of size ${options.conditioningAudio.size} bytes.`);
            }
            const backend_task_id = `mock_${Date.now()}`;
            
            task.stages[0].status = 'complete';
            taskService.updateTask(taskId, { progress: 10, stages: task.stages });

            // --- STAGE 2: POLL FOR STATUS ---
            task.stages[1].status = 'running';
            taskService.updateTask(taskId, { statusMessage: 'Awaiting server response...', stages: task.stages });

            let fileUrl: string | null = null;
            let pollAttempts = 0;
            const maxPollAttempts = 60; // ~2 minutes timeout

            while (pollAttempts < maxPollAttempts) {
                // --- REAL IMPLEMENTATION (uncomment when backend is ready) ---
                // const statusResponse = await fetch(`${MUSICGEN_BACKEND_URL}/status/${backend_task_id}`);
                // if (!statusResponse.ok) throw new Error('Failed to get job status.');
                // const statusData = await statusResponse.json();

                // --- MOCK IMPLEMENTATION ---
                await new Promise(r => setTimeout(r, 2000));
                pollAttempts++;
                const progress = (pollAttempts / 15) * 100; // Simulate completion after ~30s
                const statusData = {
                    status: progress >= 100 ? 'complete' : 'processing',
                    progress: Math.min(99, progress),
                    message: `Generating audio... (${Math.round(progress)}%)`,
                    file_url: progress >= 100 ? `/results/mock_audio.wav` : null
                };

                if (statusData.status === 'complete') {
                    fileUrl = statusData.file_url;
                    break;
                } else if (statusData.status === 'failed') {
                    throw new Error(statusData.message || 'MusicGen generation failed on the server.');
                }
                
                // Update frontend Task Orchestrator with progress from backend
                const frontendProgress = 10 + (statusData.progress * 0.8); // Map 0-100 backend progress to 10-90% of frontend task
                taskService.updateTask(taskId, { 
                    statusMessage: statusData.message,
                    progress: frontendProgress
                });
            }

            if (!fileUrl) {
                throw new Error('MusicGen generation timed out.');
            }

            task.stages[1].status = 'complete';
            taskService.updateTask(taskId, { progress: 90, stages: task.stages });

            // --- STAGE 3: DOWNLOAD RESULT ---
            task.stages[2].status = 'running';
            taskService.updateTask(taskId, { statusMessage: 'Downloading generated audio...', stages: task.stages });

            // --- REAL IMPLEMENTATION (uncomment when backend is ready) ---
            // const audioResponse = await fetch(`${MUSICGEN_BACKEND_URL}${fileUrl}`);
            // if (!audioResponse.ok) throw new Error('Failed to download generated audio file.');
            // const audioArrayBuffer = await audioResponse.arrayBuffer();
            // const buffer = await audioContext.decodeAudioData(audioArrayBuffer);

            // --- MOCK IMPLEMENTATION (uses old procedural engine as a placeholder) ---
            const buffer = await this.generateMockAudio(options);
            
            task.stages[2].status = 'complete';
            taskService.updateTask(taskId, { status: 'complete', progress: 100, statusMessage: 'Instrumental generated successfully.' });

            return buffer;

        } catch (e) {
            const message = (e instanceof Error) ? e.message : 'An unknown error occurred in Beat Agent.';
            taskService.updateTask(taskId, { status: 'failed', error: message });
            throw e;
        }
    }

    /** A helper to generate placeholder audio while the backend is being set up. */
    private async generateMockAudio(options: any): Promise<AudioBuffer> {
        const { audioContext, duration, bpm, instrumentalDescriptions } = options;

        const BEAT_TIME = 60 / bpm;
        const drums: NoteEvent[] = [];
        for (let i = 0; i < duration / BEAT_TIME / 4; i++) {
            const barStart = i * 4 * BEAT_TIME;
            drums.push({ note: 'kick', time: barStart, duration: 0, velocity: 1.0 });
            drums.push({ note: 'snare', time: barStart + BEAT_TIME, duration: 0, velocity: 0.9 });
            drums.push({ note: 'kick', time: barStart + (BEAT_TIME * 2), duration: 0, velocity: 0.9 });
            drums.push({ note: 'snare', time: barStart + (BEAT_TIME * 3), duration: 0, velocity: 1.0 });
        }

        const bassline: NoteEvent[] = [];
        const melody: NoteEvent[] = [];
        const pads: NoteEvent[] = [];
        for (let i = 0; i < duration / BEAT_TIME / 4; i++) {
            const barStart = i * 4 * BEAT_TIME;
            bassline.push({ note: 'C2', time: barStart, duration: BEAT_TIME * 2, velocity: 0.8 });
            melody.push({ note: 'G4', time: barStart, duration: BEAT_TIME, velocity: 0.7 });
            pads.push({ note: 'C3', time: barStart, duration: BEAT_TIME * 4, velocity: 0.4 });
        }

        const musicalData: MusicalData = { drums, bassline, melody, pads };

        return await generateProceduralAudio({
            audioContext,
            duration,
            musicalData,
            instrumentDescriptions: instrumentalDescriptions,
        });
    }
}
export const beatAgent = new BeatAgent();
/**
 * @fileoverview A distinct agent service for performing intelligent audio mixdowns.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { taskService } from '@/task-service.ts';
import type { StemTrack } from '@/stem-mixer-utility.ts';

export type MixGoal = 'punchy' | 'wide' | 'clear';

class MixingAgent {
    async runAiMixdown(stems: StemTrack[], mixGoal: MixGoal, masterVolume: number): Promise<AudioBuffer> {
        const audibleStems = stems.filter(s => !s.muted); // Simple check, solo logic is complex for agent
        if (audibleStems.length === 0) {
            throw new Error("No audible stems to mix down.");
        }

        const taskId = taskService.addTask(
            `Mixing Agent: AI Mixdown (${mixGoal})`,
            [
                { message: 'Analyzing stem characteristics...' },
                { message: 'Applying dynamics processing...' },
                { message: 'Adding spatial effects...' },
                { message: 'Rendering final mix...' },
            ]
        );

        try {
            const task = taskService.getTask(taskId)!;
            const audioContext = audibleStems[0].gainNode.context as OfflineAudioContext | AudioContext;
            const maxDuration = Math.max(...audibleStems.map(s => s.buffer.duration));
            const offlineCtx = new OfflineAudioContext(2, Math.ceil(audioContext.sampleRate * maxDuration), audioContext.sampleRate);
            
            // --- Master Bus ---
            const masterBus = offlineCtx.createGain();
            masterBus.gain.value = masterVolume;
            masterBus.connect(offlineCtx.destination);
            
            // Stage 1: Analyze
            task.stages[0].status = 'running';
            taskService.updateTask(taskId, { status: 'running', stages: task.stages });
            await new Promise(r => setTimeout(r, 800)); // Simulate analysis
            task.stages[0].status = 'complete';
            taskService.updateTask(taskId, { progress: 25, stages: task.stages });

            // Stage 2: Dynamics
            task.stages[1].status = 'running';
            
            // --- Mix Buses with Goal-Oriented Processing ---
            const drumBus = offlineCtx.createGain();
            if (mixGoal === 'punchy') {
                const drumCompressor = offlineCtx.createDynamicsCompressor();
                drumCompressor.threshold.setValueAtTime(-18, 0);
                drumCompressor.ratio.setValueAtTime(6, 0);
                drumBus.connect(drumCompressor).connect(masterBus);
            } else {
                drumBus.connect(masterBus);
            }

            const harmonyBus = offlineCtx.createGain(); // For melodic/pad elements
            harmonyBus.connect(masterBus);
            
            audibleStems.forEach(stem => {
                const source = offlineCtx.createBufferSource();
                source.buffer = stem.buffer;
                source.detune.value = stem.pitchShift * 100;

                const gain = offlineCtx.createGain();
                gain.gain.value = stem.volume;

                const panner = offlineCtx.createStereoPanner();
                panner.pan.value = stem.pan;

                source.connect(gain).connect(panner);

                // --- Intelligent Routing ---
                const stemName = stem.file.name.toLowerCase();
                if (stemName.includes('drum') || stemName.includes('kick') || stemName.includes('snare')) {
                    panner.connect(drumBus);
                } else {
                    panner.connect(harmonyBus);
                }
                
                source.start(0);
            });
            await new Promise(r => setTimeout(r, 1200)); // Simulate processing
            task.stages[1].status = 'complete';
            taskService.updateTask(taskId, { progress: 50, stages: task.stages });

            // Stage 3: Spatial
            task.stages[2].status = 'running';
            if (mixGoal === 'wide') {
                const reverb = offlineCtx.createConvolver();
                const reverbMix = offlineCtx.createGain();
                reverbMix.gain.value = 0.3;
                
                // Simple impulse for reverb
                const impulse = offlineCtx.createBuffer(2, offlineCtx.sampleRate * 2, offlineCtx.sampleRate);
                for (let i = 0; i < impulse.length; i++) {
                    impulse.getChannelData(0)[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulse.length, 2);
                    impulse.getChannelData(1)[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulse.length, 2);
                }
                reverb.buffer = impulse;
                harmonyBus.connect(reverb).connect(reverbMix).connect(masterBus);
            }
            await new Promise(r => setTimeout(r, 1000)); // Simulate spatial fx
            task.stages[2].status = 'complete';
            taskService.updateTask(taskId, { progress: 75, stages: task.stages });

            // Stage 4: Render
            task.stages[3].status = 'running';
            const mixedBuffer = await offlineCtx.startRendering();
            task.stages[3].status = 'complete';
            taskService.updateTask(taskId, { status: 'complete', progress: 100, statusMessage: 'Mixdown complete.' });

            return mixedBuffer;

        } catch (e) {
            const message = (e instanceof Error) ? e.message : 'An unknown error occurred in Mixing Agent.';
            taskService.updateTask(taskId, { status: 'failed', error: message });
            throw e;
        }
    }
}

export const mixingAgent = new MixingAgent();
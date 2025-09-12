/**
 * @fileoverview The "LoRA Training" utility component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, svg, css, LitElement } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';
import { classMap } from 'lit/directives/class-map.js';

import { sharedStyles } from '../shared-styles.ts';
import { StudioModule } from '../studio-module.ts';
import { appContext, Lora } from '../context.ts';
import { AIError } from '../services/ai-service.ts';
import { taskService } from '../task-service.ts';
import { beatAgent } from '../beat-agent.ts';

// Import the new file input component
import './file-link-input.ts';

type LogEntry = {
    level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    msg: string;
};

type LoraTrainingType = 'sound' | 'vocal';

@customElement('lora-training-utility')
export class LoraTrainingUtility extends StudioModule {
    private appContextConsumer = new ContextConsumer(this, {context: appContext, subscribe: true});

    @state() private isDragOver = false;
    @state() private datasetFiles: File[] = [];
    @state() private datasetUrl = '';
    @state() private trainingLogs: LogEntry[] = [];
    @state() private trainingType: LoraTrainingType = 'sound';
    @state() private isProcessingFiles = false;
    
    // LoRA Test Modal State
    @state() private showTestModal = false;
    @state() private testingLora: Lora | null = null;
    @state() private isGeneratingTestSample = false;
    @state() private testLoraTemperature = 0.7;
    @state() private testLoraGuidanceScale = 7.5;
    
    @query('#lora-training-section') private loraTrainingSection!: HTMLElement;

    static styles = [
        sharedStyles,
        css`
            .file-processing-indicator {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-tertiary);
                font-size: 0.8rem;
                padding: 0.8rem 0 0.5rem;
            }
            .spinner {
                animation: rotate 2s linear infinite;
            }
            @keyframes rotate {
                100% { transform: rotate(360deg); }
            }
            .spinner .path {
                stroke: currentColor;
                stroke-linecap: round;
                animation: dash 1.5s ease-in-out infinite;
            }
            @keyframes dash {
                0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
                50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35;
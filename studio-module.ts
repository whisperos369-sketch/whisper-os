/**
 * @fileoverview Base class for all studio module components.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {html, LitElement, svg} from 'lit';
import {state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {sharedStyles} from '@/shared-styles.ts';
import { AIError } from '@/ai-service.ts';
import { taskService, Task, TaskStage, TaskStatus } from '@/task-service.ts';

export class StudioModule extends LitElement {
    static styles = [sharedStyles];

    @state() protected isLoading = false;
    @state() protected errorMessage = '';
    @state() protected currentTaskId: string | null = null;
    
    // Legacy state for simple progress indicators
    @state() protected statusMessage = '';
    @state() protected progress = 0;
    
    // Control flags for tasks
    private isPaused = false;
    private stopFlag = false;

    protected async _performTask<T>(
        taskName: string,
        stages: {message: string, duration: number}[],
        taskFn: () => Promise<T>
    ): Promise<T | undefined> {
        this.isLoading = true;
        this.isPaused = false;
        this.stopFlag = false;
        this.errorMessage = '';
        
        const taskId = taskService.addTask(taskName, stages.map(s => ({ message: s.message })));
        this.currentTaskId = taskId;

        let taskResult: T | undefined;
        let taskError: any;

        const taskPromise = taskFn().then(res => { taskResult = res; }).catch(e => { taskError = e; });

        for (let i = 0; i < stages.length; i++) {
            if (this.stopFlag || taskError) break;
            
            const currentStages = taskService.getTask(taskId)?.stages || [];
            currentStages[i].status = 'running';
            taskService.updateTask(taskId, { stages: currentStages, status: 'running' });

            const stageStart = performance.now();
            let stageElapsed = 0;
            while (stageElapsed < stages[i].duration && !taskError) {
                if (this.stopFlag) break;
                while(this.isPaused && !this.stopFlag) await new Promise(r => setTimeout(r, 200));
                if (this.stopFlag) break;

                await new Promise(r => setTimeout(r, 50));
                stageElapsed = performance.now() - stageStart;
            }
            
            if (this.stopFlag) {
                currentStages[i].status = 'stopped';
            } else if (taskError) {
                currentStages[i].status = 'failed';
            } else {
                currentStages[i].status = 'complete';
            }
            taskService.updateTask(taskId, { stages: currentStages, progress: ((i + 1) / stages.length) * 100 });
        }

        await taskPromise;
        
        const finalTaskState = taskService.getTask(taskId);
        if (!finalTaskState) {
            this.isLoading = false;
            return;
        };

        if (this.stopFlag) {
            finalTaskState.stages.forEach(s => {
                if (s.status === 'running' || s.status === 'pending') s.status = 'stopped';
            });
            taskService.updateTask(taskId, { stages: finalTaskState.stages, status: 'stopped' });
            this.errorMessage = 'Task stopped by user.';
        } else if (taskError) {
             finalTaskState.stages.forEach(s => { if (s.status === 'running') s.status = 'failed'; });
             const message = (taskError instanceof AIError ? taskError.message : (taskError as Error).message) || 'An unknown error occurred.';
             this.errorMessage = message;
             taskService.updateTask(taskId, { stages: finalTaskState.stages, status: 'failed', error: message });
        } else {
            finalTaskState.stages.forEach(s => s.status = 'complete');
            taskService.updateTask(taskId, { stages: finalTaskState.stages, status: 'complete', progress: 100 });
        }
        
        this.isLoading = false;
        this.isPaused = false;
        this.currentTaskId = null;

        if (taskError && !this.stopFlag) {
            return undefined;
        }
        
        return this.stopFlag ? undefined : taskResult;
    }

    protected renderProgressIndicator() {
        if (!this.isLoading || !this.currentTaskId) return null;
        
        const task = taskService.getTask(this.currentTaskId);
        if (!task || task.status === 'complete' || task.status === 'failed') return null;

        const getIconForStatus = (status: TaskStatus) => {
            switch(status) {
                case 'pending': return svg`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>`;
                case 'running': return svg`<svg class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>`;
                case 'complete': return svg`<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
                case 'failed': return svg`<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
                case 'stopped': return svg`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`;
            }
        };

        return html`
            <div class="progress-indicator" style="margin-top: 1.5rem;">
                <div class="progress-indicator-checklist">
                    ${task.stages.map(stage => html`
                        <div class="progress-stage status-${stage.status}">
                            <div class="stage-icon">${getIconForStatus(stage.status)}</div>
                            <span>${stage.message}</span>
                        </div>
                    `)}
                </div>
            </div>
        `;
    }

    protected renderErrorMessage() {
        if (!this.errorMessage) return null;
        return html`
            <div class="error-message">
                ${this.errorMessage}
            </div>
        `;
    }
}
/**
 * @fileoverview The "Task Orchestrator" utility component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, css, svg } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { sharedStyles } from './shared-styles.js';
import { StudioModule } from './studio-module.js';
import { taskService, Task, TaskStatus } from './task-service.js';
import { formatDuration } from './utils.js';

@customElement('task-orchestrator-utility')
export class TaskOrchestratorUtility extends StudioModule {
    @state() private tasks: Task[] = [];
    @state() private activeTab: 'active' | 'archive' = 'active';

    constructor() {
        super();
        this.tasks = taskService.allTasks;
        // Re-render whenever the task service has updates
        taskService.addEventListener('update', () => {
            this.tasks = [...taskService.allTasks];
        });
    }

    private _getIconForStatus(status: TaskStatus) {
        switch (status) {
            case 'pending':
                return svg`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>`;
            case 'running':
                return svg`<svg class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>`;
            case 'complete':
                return svg`<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
            case 'failed':
                return svg`<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
            case 'stopped':
                return svg`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`;
        }
    }
    
    private _renderTask(task: Task) {
        const duration = task.endTime ? formatDuration((task.endTime - task.startTime) / 1000) : '...';

        return html`
            <div class="task-item">
                <div class="task-item-header">
                    <div class="task-item-title">
                        <div class="task-status-icon status-${task.status}">${this._getIconForStatus(task.status)}</div>
                        <div>
                            <h4>${task.name}</h4>
                            <p class="sub-label">Started: ${new Date(task.startTime).toLocaleTimeString()}</p>
                        </div>
                    </div>
                    <div class="task-item-meta">
                        <span class="task-status-badge status-${task.status}">${task.status}</span>
                        ${task.endTime ? html`<span class="sub-label">Duration: ${duration}</span>` : ''}
                    </div>
                </div>
                
                <div class="task-item-body">
                    <p class="sub-label">${task.statusMessage || ''}</p>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${task.progress}%"></div>
                    </div>
                    
                    ${task.stages.length > 0 ? html`
                        <details class="task-stages-details">
                            <summary>View Stages</summary>
                            <div class="progress-indicator-checklist">
                                ${task.stages.map(stage => html`
                                    <div class="progress-stage status-${stage.status}">
                                        <div class="stage-icon">${this._getIconForStatus(stage.status)}</div>
                                        <span>${stage.message}</span>
                                    </div>
                                `)}
                            </div>
                        </details>
                    ` : ''}

                    ${task.error ? html`<div class="error-message" style="margin-top: 1rem;">${task.error}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    static override styles = [sharedStyles];

    render() {
        const activeTasks = this.tasks.filter(t => t.status === 'running' || t.status === 'pending');
        const archivedTasks = this.tasks.filter(t => t.status === 'complete' || t.status === 'failed' || t.status === 'stopped');

        const tasksToDisplay = this.activeTab === 'active' ? activeTasks : archivedTasks;
        
        return html`
            <div class="panel">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 class="page-title" style="border: none; padding: 0;">Task Orchestrator</h2>
                    ${this.activeTab === 'archive' && archivedTasks.length > 0 ? html`
                        <button @click=${() => taskService.clearArchived()}>Clear Archive</button>
                    ` : ''}
                </div>

                <div class="control-group">
                    <div class="task-orchestrator-tabs">
                        <button class="tab-button ${classMap({active: this.activeTab === 'active'})}" @click=${() => this.activeTab = 'active'}>
                            Active (${activeTasks.length})
                        </button>
                        <button class="tab-button ${classMap({active: this.activeTab === 'archive'})}" @click=${() => this.activeTab = 'archive'}>
                            Archive (${archivedTasks.length})
                        </button>
                    </div>

                    <div class="task-list">
                        ${tasksToDisplay.length === 0 ? html`
                            <p class="sub-label" style="text-align: center; padding: 2rem;">
                                ${this.activeTab === 'active' ? 'No active tasks.' : 'No archived tasks.'}
                            </p>
                        ` : tasksToDisplay.map(task => this._renderTask(task))}
                    </div>
                </div>
            </div>
        `;
    }
}
/**
 * @fileoverview A central, reactive service for managing all long-running AI tasks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskStatus = 'pending' | 'running' | 'complete' | 'failed' | 'stopped';
export type TaskStage = {
    message: string;
    status: TaskStatus;
};

export type Task = {
    id: string;
    name: string;
    status: TaskStatus;
    stages: TaskStage[];
    progress: number;
    error?: string;
    startTime: number;
    endTime?: number;
    statusMessage?: string;
};

class TaskService extends EventTarget {
    private tasks: Map<string, Task> = new Map();

    get allTasks(): Task[] {
        return Array.from(this.tasks.values()).sort((a, b) => b.startTime - a.startTime);
    }

    addTask(name: string, stages: { message: string }[]): string {
        const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const task: Task = {
            id,
            name,
            status: 'pending',
            stages: stages.map(s => ({ message: s.message, status: 'pending' })),
            progress: 0,
            startTime: Date.now(),
        };
        this.tasks.set(id, task);
        this.dispatchEvent(new CustomEvent('update'));
        return id;
    }

    updateTask(id: string, updates: Partial<Task>) {
        const task = this.tasks.get(id);
        if (task) {
            Object.assign(task, updates);
            if (updates.status && ['complete', 'failed', 'stopped'].includes(updates.status)) {
                task.endTime = Date.now();
            }
            this.tasks.set(id, task);
            this.dispatchEvent(new CustomEvent('update'));
        }
    }
    
    getTask(id: string): Task | undefined {
        return this.tasks.get(id);
    }

    clearArchived() {
        this.tasks.forEach((task, id) => {
            if (task.status === 'complete' || task.status === 'failed' || task.status === 'stopped') {
                this.tasks.delete(id);
            }
        });
        this.dispatchEvent(new CustomEvent('update'));
    }
}

export const taskService = new TaskService();
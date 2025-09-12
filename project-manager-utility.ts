/**
 * @fileoverview The "Project Manager" utility component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';
import { projectStore } from '@/project-store.ts';
import { type SongState } from '@/sections.ts';
import { appContext, type AppContext } from '@/context.ts';

@customElement('project-manager-utility')
export class ProjectManagerUtility extends StudioModule {
    @consume({ context: appContext, subscribe: false })
    private appContext!: AppContext;

    @state() private projects: SongState[] = [];

    async firstUpdated() {
        await this._loadProjects();
    }

    private async _loadProjects() {
        this.isLoading = true;
        try {
            this.projects = await projectStore.getAll();
        } catch (e) {
            this.errorMessage = 'Failed to load projects from the database.';
            console.error(e);
        } finally {
            this.isLoading = false;
        }
    }

    private async _handleCreateNew() {
        this.appContext.createNewSong();
    }

    private async _handleLoadProject(id: string) {
        await this.appContext.loadSong(id);
    }
    
    private async _handleDeleteProject(id: string) {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                await projectStore.delete(id);
                this.projects = this.projects.filter(p => p.id !== id);
            } catch(e) {
                this.errorMessage = 'Failed to delete project.';
                console.error(e);
            }
        }
    }

    static override styles = [
      sharedStyles,
      css`
        .project-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
        }
        .project-card, .new-project-card {
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.2s;
            background-color: var(--bg-panel);
        }
        .project-card:hover {
            border-color: var(--accent-primary);
            transform: translateY(-4px);
            box-shadow: 0 4px 12px var(--shadow-color);
        }
        .project-card h4 {
            margin: 0 0 0.5rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .project-card p {
            font-size: 0.8rem;
            color: var(--text-tertiary);
            margin: 0 0 1.5rem;
        }
        .project-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .new-project-card {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 1rem;
            cursor: pointer;
            border-style: dashed;
        }
        .new-project-card:hover {
             border-color: var(--accent-primary);
             color: var(--accent-primary);
        }
        .new-project-card svg {
            width: 32px;
            height: 32px;
        }
      `
    ];

    render() {
        return html`
            <div class="panel">
                <h2 class="page-title">Project Manager</h2>
                <div class="control-group">
                    <h3>My Projects</h3>
                    ${this.isLoading ? html`<p>Loading projects...</p>` : ''}
                    <div class="project-grid">
                         <div class="new-project-card" @click=${this._handleCreateNew}>
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                            <span>Create New Song</span>
                        </div>
                        ${this.projects.map(project => html`
                            <div class="project-card">
                                <h4>${project.meta.title}</h4>
                                <p>Last updated: ${new Date(project.meta.updatedAt).toLocaleString()}</p>
                                <div class="project-actions">
                                    <button class="primary" @click=${() => this._handleLoadProject(project.id)}>Load Project</button>
                                    <button class="icon-button" @click=${() => this._handleDeleteProject(project.id)} title="Delete Project">
                                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                    </button>
                                </div>
                            </div>
                        `)}
                    </div>
                    ${this.renderErrorMessage()}
                </div>
            </div>
        `;
    }
}
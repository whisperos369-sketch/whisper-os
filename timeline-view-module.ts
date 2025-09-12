// timeline-view-module.ts
import { css, html, nothing, svg } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { classMap } from 'lit/directives/class-map.js';

import { appContext, AppContext } from './ui/context.ts';
import { sharedStyles } from './shared-styles.ts';
import { StudioModule } from './studio-module.ts';
import type { Track, Clip } from './ui/sections.ts';

type DraggingState = {
  type: 'move' | 'trim-start' | 'trim-end';
  clipId: string;
  trackId: string;
  initialX: number;
  initialStart: number;
  initialDuration: number;
};

@customElement('timeline-view-module')
export class TimelineViewModule extends StudioModule {
  @consume({ context: appContext, subscribe: true })
  private _app!: AppContext;

  @state() private selectedClipId: string | null = null;
  @state() private timeScale = 40; // pixels per second
  @state() private dragging: DraggingState | null = null;
  
  private _handleTrackClick(e: MouseEvent) {
    // Deselect if clicking on the track background
    if ((e.target as HTMLElement).classList.contains('track-clips')) {
        this.selectedClipId = null;
    }
  }
  
  private _handleClipMouseDown(e: MouseEvent, clip: Clip, track: Track, type: DraggingState['type']) {
    e.stopPropagation();
    this.selectedClipId = clip.id;
    this.dragging = {
        type,
        clipId: clip.id,
        trackId: track.id,
        initialX: e.clientX,
        initialStart: clip.start,
        initialDuration: clip.duration,
    };
    window.addEventListener('mousemove', this._handleMouseMove);
    window.addEventListener('mouseup', this._handleMouseUp);
  }

  private _handleMouseMove = (e: MouseEvent) => {
    if (!this.dragging || !this._app.songState) return;

    const dx = (e.clientX - this.dragging.initialX) / this.timeScale;
    const project = this._app.songState;
    const trackIndex = project.tracks.findIndex(t => t.id === this.dragging!.trackId);
    if (trackIndex === -1) return;
    const clipIndex = project.tracks[trackIndex].clips.findIndex(c => c.id === this.dragging!.clipId);
    if (clipIndex === -1) return;
    
    const newTracks = [...project.tracks];
    const newClips = [...newTracks[trackIndex].clips];
    const clip = { ...newClips[clipIndex] };

    switch (this.dragging.type) {
        case 'move':
            clip.start = Math.max(0, this.dragging.initialStart + dx);
            break;
        case 'trim-end':
            clip.duration = Math.max(0.5, this.dragging.initialDuration + dx);
            break;
        case 'trim-start':
            const newStart = Math.max(0, this.dragging.initialStart + dx);
            const durationDiff = newStart - clip.start;
            if (clip.duration - durationDiff >= 0.5) {
                clip.start = newStart;
                clip.duration -= durationDiff;
            }
            break;
    }
    
    newClips[clipIndex] = clip;
    newTracks[trackIndex] = { ...newTracks[trackIndex], clips: newClips };
    this._app.updateCurrentSong({ tracks: newTracks });
  }

  private _handleMouseUp = () => {
    this.dragging = null;
    window.removeEventListener('mousemove', this._handleMouseMove);
    window.removeEventListener('mouseup', this._handleMouseUp);
  }
  
  private _duplicateClip(clipToDup: Clip, track: Track) {
    if (!this._app.songState) return;

    const newClip: Clip = {
        ...clipToDup,
        id: crypto.randomUUID(),
        start: clipToDup.start + clipToDup.duration + 0.5, // Place it after the original
    };

    const newTracks = this._app.songState.tracks.map(t => {
        if (t.id === track.id) {
            return { ...t, clips: [...t.clips, newClip] };
        }
        return t;
    });

    this._app.updateCurrentSong({ tracks: newTracks });
  }

  private _renderClip(clip: Clip, track: Track, prevClip: Clip | undefined, nextClip: Clip | undefined) {
    const isSelected = this.selectedClipId === clip.id;
    const left = clip.start * this.timeScale;
    const width = clip.duration * this.timeScale;

    // Outgoing crossfade (fade out)
    let outgoingCrossfadeWidth = 0;
    if (nextClip && clip.start + clip.duration > nextClip.start) {
        const overlapDuration = (clip.start + clip.duration) - nextClip.start;
        outgoingCrossfadeWidth = overlapDuration * this.timeScale;
    }

    // Incoming crossfade (fade in)
    let incomingCrossfadeWidth = 0;
    if (prevClip && prevClip.start + prevClip.duration > clip.start) {
        const overlapDuration = (prevClip.start + prevClip.duration) - clip.start;
        incomingCrossfadeWidth = overlapDuration * this.timeScale;
    }

    return html`
        <div 
            class="clip ${classMap({ selected: isSelected })}" 
            style="left: ${left}px; width: ${width}px;"
            @mousedown=${(e: MouseEvent) => this._handleClipMouseDown(e, clip, track, 'move')}
        >
            <div class="trim-handle start" @mousedown=${(e: MouseEvent) => this._handleClipMouseDown(e, clip, track, 'trim-start')}></div>
            <div class="clip-label">${clip.title}</div>
            <div class="trim-handle end" @mousedown=${(e: MouseEvent) => this._handleClipMouseDown(e, clip, track, 'trim-end')}></div>
            
            ${incomingCrossfadeWidth > 0 ? html`
                <div class="crossfade-in" style="width: ${incomingCrossfadeWidth}px;"></div>
            ` : ''}

            ${outgoingCrossfadeWidth > 0 ? html`
                <div class="crossfade-out" style="width: ${outgoingCrossfadeWidth}px;"></div>
            ` : ''}

            ${isSelected ? html`
                <div class="clip-actions">
                    <button class="icon-button" title="Duplicate Clip" @click=${() => this._duplicateClip(clip, track)}>
                        ${svg`<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11 17H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h12v2H4v12h7v-2l4 3-4 3v-2m8 4V7H9v2h8v10h2Z"/></svg>`}
                    </button>
                </div>
            ` : nothing}
        </div>
    `;
  }
  
  static override styles = [sharedStyles, css`
    .panel {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    .timeline-controls {
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
        flex-shrink: 0;
    }
    .timeline-container {
        flex-grow: 1;
        overflow-x: auto;
        padding: var(--spacing-lg) 0;
    }
    .track {
        display: flex;
        align-items: center;
        margin-bottom: var(--spacing-sm);
    }
    .track-header {
        width: 150px;
        padding: var(--spacing-lg);
        background-color: var(--bg-input);
        border-right: 1px solid var(--border-color);
        flex-shrink: 0;
    }
    .track-clips {
        flex-grow: 1;
        height: 80px;
        background-color: var(--bg-panel-solid);
        position: relative;
    }
    .clip {
        position: absolute;
        height: 100%;
        background-color: var(--accent-primary);
        border-radius: var(--border-radius);
        cursor: move;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-on-accent);
        font-size: 0.8rem;
        font-weight: 500;
        border: 2px solid transparent;
        overflow: hidden; /* Ensure gradients don't spill */
    }
    .clip.selected {
        border-color: var(--accent-secondary);
        z-index: 10;
    }
    .clip-label {
        padding: 0 var(--spacing-sm);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .trim-handle {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 8px;
        background-color: rgba(0,0,0,0.3);
        z-index: 1;
    }
    .trim-handle.start { left: 0; cursor: e-resize; }
    .trim-handle.end { right: 0; cursor: w-resize; }

    .crossfade-out {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to left, rgba(255, 20, 147, 0.5), transparent);
        pointer-events: none;
    }

    .crossfade-in {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        background: linear-gradient(to right, rgba(255, 20, 147, 0.5), transparent);
        pointer-events: none;
    }

    .clip-actions {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 4px;
        background: var(--bg-panel-solid);
        padding: 4px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
    }
  `];
  
  render() {
    if (!this._app?.songState) return html`<div class="panel"><p>Loading project...</p></div>`;

    return html`
        <div class="panel">
            <h2 class="page-title">Timeline</h2>
            <div class="timeline-controls">
                <label>Zoom</label>
                <input type="range" min="10" max="100" .value=${String(this.timeScale)} @input=${(e: any) => this.timeScale = Number(e.target.value)}>
            </div>
            <div class="timeline-container">
                ${this._app.songState.tracks.map(track => html`
                    <div class="track">
                        <div class="track-header">${track.name}</div>
                        <div class="track-clips" @click=${this._handleTrackClick}>
                            ${[...track.clips]
                                .sort((a,b) => a.start - b.start)
                                .map((clip, i, arr) => this._renderClip(clip, track, arr[i-1], arr[i+1]))
                            }
                        </div>
                    </div>
                `)}
            </div>
        </div>
    `;
  }
}
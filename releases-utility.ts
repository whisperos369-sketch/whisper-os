

/**
 * @fileoverview The "Releases" utility component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, LitElement, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';

import { sharedStyles } from './shared-styles.ts';
import { aiService } from '@/ai-service.ts';
import { appContext } from './context.ts';


type Release = {
    title: string;
    art: string;
    status: 'Scheduled' | 'Released';
    date: string;
    platforms: string[];
};

type GeneratedCaption = {
    platform: string;
    caption: string;
};

type HookSlices = {
    "5s": string;
    "12s": string;
    "30s": string;
};

@customElement('releases-utility')
export class ReleasesUtility extends LitElement {
    private appContextConsumer = new ContextConsumer(this, {context: appContext, subscribe: true});
    
    @state() private releases: Release[] = [
        { 
            title: "Cybernetic Dreams", 
            art: "https://placehold.co/80x80/7e22ce/ffffff?text=CD",
            status: "Scheduled",
            date: "11/11/2024",
            platforms: ["Spotify", "Apple Music"]
        },
        { 
            title: "Summer Haze Remix", 
            art: "https://placehold.co/80x80/f97316/ffffff?text=SH",
            status: "Released",
            date: "10/28/2024",
            platforms: ["Spotify", "Apple Music", "YouTube"]
        }
    ];

    @state() private selectedRelease: Release | null = null;
    @state() private generatedCaptions: GeneratedCaption[] = [];
    @state() private generatedHookSlices: HookSlices | null = null;
    @state() private isGenerating = false;
    @state() private captionThemes = '';
    @state() private platformApiKeys: Record<string, boolean> = {};

    @state() private scheduleStatus = '';
    private scheduleTimeout: number | undefined;

    @query('#ai-ack-checkbox') private aiAckCheckbox!: HTMLInputElement;

    // FIX: Removed incorrect 'override' modifier.
    static styles = [
      sharedStyles,
      css`
        .panel { padding: var(--spacing-xl); }
        .release-card {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            padding: 1rem;
            transition: background-color 0.2s;
            border-radius: 12px;
        }
        .release-card:hover {
            background-color: var(--bg-input);
        }
        .release-card img {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            object-fit: cover;
        }
        .release-info {
            flex-grow: 1;
        }
        .release-info h4 {
            margin: 0 0 0.25rem;
            font-size: 1.1rem;
        }
        .status {
            font-size: 0.75rem;
            font-weight: 500;
            padding: 0.2rem 0.6rem;
            border-radius: 20px;
            display: inline-block;
            margin-top: 0.5rem;
        }
        .status-scheduled {
            background-color: color-mix(in srgb, var(--accent-primary) 20%, transparent);
            color: var(--accent-primary-hover);
        }
        .status-released {
            background-color: color-mix(in srgb, var(--color-success) 20%, transparent);
            color: var(--color-success);
        }
        .api-key-status {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-left: 0.3rem;
            background-color: var(--color-error);
        }
        .api-key-status.configured {
            background-color: var(--color-success);
        }
        .hook-slicer-panel {
            background-color: var(--bg-input);
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
        }
        .timestamps {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            font-size: 0.85rem;
        }
      `
    ];

    public scheduleNewRelease(trackData: { title: string; art: string; }) {
        const newRelease: Release = {
            title: trackData.title,
            art: trackData.art || `https://placehold.co/80x80/7e22ce/ffffff?text=${trackData.title.substring(0,2).toUpperCase()}`,
            status: 'Scheduled',
            date: new Date().toLocaleDateString('en-US'),
            platforms: ['Spotify', 'Apple Music'],
        };
        this.releases = [newRelease, ...this.releases];
        this._openManageModal(newRelease);
    }
    
    private _loadApiKeys() {
        const keysJson = localStorage.getItem('platformApiKeys');
        if (keysJson) {
            const keys = JSON.parse(keysJson);
            this.platformApiKeys = {
                Spotify: !!keys.spotify,
                'Apple Music': !!keys.appleMusic,
                YouTube: !!keys.youtube,
                SoundCloud: !!keys.soundcloud,
            };
        }
    }
    
    private _openManageModal(release: Release) {
        this._loadApiKeys();
        this.selectedRelease = release;
        this.generatedCaptions = [];
        this.generatedHookSlices = null;
        this.captionThemes = '';
        this.scheduleStatus = '';
    }

    private _closeManageModal() {
        this.selectedRelease = null;
    }

    private async _handleGenerateReleasePack() {
        if (!this.selectedRelease) return;
        const appContext = this.appContextConsumer.value;
        if (!appContext) {
            alert('App context not available.');
            this.isGenerating = false;
            return;
        }

        this.isGenerating = true;
        this.generatedCaptions = [];
        this.generatedHookSlices = null;
        
        const platforms = Array.from((this as LitElement).shadowRoot!.querySelectorAll<HTMLInputElement>('input[name=platform]:checked')).map(el => (el as HTMLInputElement).value);
        const themes = this.captionThemes.split(',').map(t => t.trim()).filter(Boolean);
        
        if (platforms.length === 0) {
            alert("Please select at least one platform.");
            this.isGenerating = false;
            return;
        }

        try {
            // TODO: call aiService.generateReleasePack once implemented
        } catch (err) {
            console.error(err);
        } finally {
            this.isGenerating = false;
        }
    }

    render() {
        return html`<div class="panel">Releases utility under construction.</div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'releases-utility': ReleasesUtility;
    }
}

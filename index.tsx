/**
 * @fileoverview Whisper Music Studio — Application Shell with Project Toolbar,
 * Module Router, Right Inspector (LoRA/Gen settings), and A/B Compare.
 * SPDX-License-Identifier: Apache-2.0
 */

import {css, html, LitElement, nothing} from 'lit';
import {customElement, state, query} from 'lit/decorators.js';
import {provide} from '@lit/context';
import {classMap} from 'lit/directives/class-map.js';

import {appContext, type AppContext, type Lora, type AgentName, type AgentState, type AgentStatus} from '@/context.ts';
import { ABCompareService, type ABCompareState } from '@/ui/ab-compare-service.ts';
import {chatContext, ChatContext, Message} from '@/chat-context.ts';
import {formatDuration, hapticFeedback} from '@/utils.ts';
import {sharedStyles} from '@/shared-styles.ts';
import { aiService } from '@/ai-service.ts';
import { projectStore } from '@/project-store.ts';
import { newSong, type SongState } from '@/sections.ts';
import '@/index.css';
import { flags } from '@/config/env.ts';
import { Orchestrator } from '@/core/orchestrator.ts';
import { bootstrapDefaultModels, getModel } from '@/core/model-manager.ts';
import { registerAllAgents } from '@/agents/register.ts';
import { mediaEngine } from '@/media/media-engine.ts';
import { bus } from '@/core/bus.ts';
import type { OrchestratorEvent } from '@/core/types.ts';
 
 // Eagerly load persistent components.
 import '@/project-manager-utility.ts';
 import '@/j-chat.ts';
 import '@/volume-control.ts';
 import '@/toast-portal.ts';
 import '@/RenderRecovery.tsx';
 import '@/command-palette.ts';
 import { ToastPortal } from '@/toast-portal.ts';
 import { RenderRecoveryPanel } from '@/RenderRecovery.tsx';
 import { CommandPalette } from '@/command-palette.ts';

// Modules
import '@/songwriting-module.ts';
import '@/music-module.ts';
import '@/vocal-studio-module.ts';
import '@/remix-lab-module.ts';
import '@/lora-lab-module.ts';
import '@/cover-art-module.ts';
import '@/video-module.ts';
import '@/spice-and-mastering-module.ts';
import '@/evaluation-module.ts';
import '@/ace-step-module.ts';
import '@/timeline-view-module.ts';
import '@/media-player.ts';
import '@/audio-visualizer.ts';
import '@/ops-dashboard-module.ts';
import '@/daily-banger-pipeline-utility.ts';
import '@/stem-mixer-utility.ts';
import '@/creative-dna-utility.ts';
import '@/sudoku-utility.ts';
import '@/sonic-alchemist-utility.ts';
import '@/spatial-sound-architect-utility.ts';
import '@/releases-utility.ts';
import '@/settings-module.ts';
import '@/meditation-module.ts';
import '@/presets-mode.ts';
import '@/studio-mode.ts';
import '@/remix-lora-mode.ts';
import '@/agents-dashboard-module.ts';


type View = 
  // Main Studio Modules (now under 'studio' mode)
  'timeline' | 'songwriting' | 'music' | 'vocal' | 'remix' | 'lora-lab' | 'cover' | 'video' | 'master' | 'evaluation' | 'ace' | 'ops' |
  // Full-screen Modes
  'presets' | 'studio' | 'remix-lora' |
  // Full-screen Utilities
  'releases' | 'stem-mixer' | 'daily-banger' | 'agents-dashboard' |
  'creative-dna' | 'sonic-alchemist' | 'spatial-sound' | 'sudoku' | 'settings' | 'meditation';

const viewIcons: Record<string, { path: string, label: string, isMode?: boolean }> = {
  studio: { path: "M12,2L1,12H4V21H20V12H23L12,2M12,7.7L16,11V18H8V11.7L12,7.7Z", label: "Studio", isMode: true },
  presets: { path: "M16.2,12.5L13.4,14.5L10.6,12.5L12,11.1L16.2,12.5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M17.5,16.2L15.5,13.4L17.5,10.6L18.9,12L17.5,16.2M12,20L11.1,18.9L12,17.5L12.9,18.9L12,20M7.8,12.5L6.4,11.1L5,12.5L7.8,14.5L9,15.9L10.4,14.5L7.8,12.5M12,6.5L9.2,8.5L12,11.3L14.8,8.5L12,6.5Z", label: "Presets", isMode: true },
  "remix-lora": { path: "M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z", label: "Remix & LoRA", isMode: true },
  releases: { path: "M9,4H15V10H20.59L15,15.59L9.41,10H14V5H9V4Z", label: "Releases" },
  "stem-mixer": { path: "M10,21V19H14V21H10M4,13V11H20V13H4M7,17V15H17V17H7M13,9V3H11V9H13Z", label: "Stem Mixer" },
  "daily-banger": { path: "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z", label: "Daily Banger" },
  "agents-dashboard": { path: "M12,8L10,12H14L12,8M18,2H6L2,8V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V8L18,2M20,8.6L18,11H15V14H9V11H6L4,8.6V4H11.5L12,3L12.5,4H20V8.6Z", label: "Agents" },
  "creative-dna": { path: "M12,3C7.5,3 4,4.5 4,6.5V17.5C4,19.5 7.5,21 12,21C16.5,21 20,19.5 20,17.5V6.5C20,4.5 16.5,3 12,3M12,5C15.5,5 18,6 18,7.5C18,9 15.5,10 12,10C8.5,10 6,9 6,7.5C6,6 8.5,5 12,5M12,19C8.5,19 6,18 6,16.5V11.2C7.5,11.8 9.5,12 12,12C14.5,12 16.5,11.8 18,11.2V16.5C18,18 15.5,19 12,19Z", label: "Creative DNA" },
  "sonic-alchemist": { path: "M7,2V5H2V7H7V10L11,6L7,2M17,12L13,16L17,20V17H22V15H17V12M11,14L7,18V15H2V13H7V10L11,14Z", label: "Sonic Alchemist" },
  "spatial-sound": { path: "M12,2C15.31,2 18,4.69 18,8C18,11.31 15.31,14 12,14C8.69,14 6,11.31 6,8C6,4.69 8.69,2 12,2M12,4C9.79,4 8,5.79 8,8C8,10.21 9.79,12 12,12C14.21,12 16,10.21 16,8C16,5.79 14.21,4 12,4M12,15C16.42,15 20,16.79 20,19V22H4V19C4,16.79 7.58,15 12,15M12,17C8.9,17 6,18.34 6,19V20H18V19C18,18.34 15.1,17 12,17Z", label: "Spatial Sound" },
  sudoku: { path: "M4,4H8V8H4V4M10,4H14V8H10V4M16,4H20V8H16V4M4,10H8V14H4V10M10,10H14V14H10V10M16,10H20V14H16V10M4,16H8V20H4V16M10,16H14V20H10V16M16,16H20V20H16V16Z", label: "Sudoku" },
  settings: { path: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z", label: "Settings" },
  meditation: { path: "M14.5,8.25C14.5,10.6 12.84,12.5 10.75,12.5C8.66,12.5 7,10.6 7,8.25C7,5.9 8.66,4 10.75,4C12.84,4 14.5,5.9 14.5,8.25M6,16.5L10.75,22L15.5,16.5C15.5,14.16 13.34,12.25 10.75,12.25C8.16,12.25 6,14.16 6,16.5M3,14.5C3,12.16 4.66,10.25 6.75,10.25C7.3,10.25 7.8,10.4 8.25,10.5C8.25,10.5 8.25,10.5 8.25,10.55C7.8,10.4 7.3,10.25 6.75,10.25C4.66,10.25 3,12.16 3,14.5C3,16.84 4.66,18.75 6.75,18.75C7.3,18.75 7.8,18.6 8.25,18.45V18.45C7.8,18.6 7.3,18.75 6.75,18.75C4.66,18.75 3,16.84 3,14.5M19.25,10.25C17.16,10.25 15.5,12.16 15.5,14.5C15.5,16.84 17.16,18.75 19.25,18.75C21.34,18.75 23,16.84 23,14.5C23,12.16 21.34,10.25 19.25,10.25M19.25,12.25C20.4,12.25 21.25,13.25 21.25,14.5C21.25,15.75 20.4,16.75 19.25,16.75C18.1,16.75 17.25,15.75 17.25,14.5C17.25,13.25 18.1,12.25 19.25,12.25Z", label: "Meditation" },
};


@customElement('whisper-music-studio')
export class WhisperMusicStudio extends LitElement {
  @provide({context: appContext}) private _app!: AppContext;
  @provide({context: chatContext}) private _chat!: ChatContext;
  
  @query('toast-portal') private toastPortal!: ToastPortal;
  @query('render-recovery-panel') private recoveryPanel!: RenderRecoveryPanel;
  @query('command-palette') private commandPalette!: CommandPalette;

  @state() private view: View = (localStorage.getItem('whisper-os-view') as View) || 'studio';
  @state() private project: SongState = newSong();
  @state() private isDirty = false;
  @state() private saving = false;
  @state() private rightOpen = localStorage.getItem('whisper-os-right-panel-open') !== 'false';
  @state() private sidebarOpen = false;
  @state() private activeView: 'project-manager' | 'app' = 'app';

  private autosaveTimeout: number | undefined;

  private orchestrator: Orchestrator;
  @state() private isOrchestrating = false;

  @state() private messages: Message[] = [];
  @state() private isLoadingChat = false;

  @state() private audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  @state() private analyserNode: AnalyserNode;
  @state() private currentTrack: AppContext['currentTrack'] = { title: '', artist: '', duration: 0, audioBuffer: null };
  @state() private isPlaying = false;
  @state() private currentTime = 0;
  private audioSource: AudioBufferSourceNode | null = null;
  private playbackStartTime = 0;
  private startOffset = 0;
  private animationFrameId: number | null = null;
  private lastProcessedMixUrl: string | undefined;

  @state() private trainedLoras: Lora[] = [
      { name: 'adapters/80s_synth_pop.safetensors', type: 'sound' },
      { name: 'adapters/epic_cinematic_drums.safetensors', type: 'sound' },
      { name: 'models/aria_vocal_style.safetensors', type: 'vocal' },
      { name: 'models/titan_vocal_style.safetensors', type: 'vocal' },
  ];
  @state() private explicitContentFilter = true;
  @state() private isPanningAutomationEnabled = false;
  @state() private hypnoticLayerMix = 0;
  @state() private stereoWidth = 100;

  private abService = new ABCompareService();
  @state() private abState: ABCompareState = this.abService.state;
  @state() private agentStatus: AgentStatus = {
    lyrics: { status: 'idle' },
    music: { status: 'idle' },
    mastering: { status: 'idle' },
    cover: { status: 'idle' },
    video: { status: 'idle' },
  };

  constructor() {
    super();
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    bootstrapDefaultModels();
    registerAllAgents();
    this.orchestrator = new Orchestrator({ getModel });
    bus.on("event", (e: OrchestratorEvent) => {
      console.log(`Orchestrator Event:`, e);
    });
    this.abService.on('update', (newState) => {
      this.abState = newState;
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
// FIX: Cast `this` to `unknown as HTMLElement` to resolve `classList` property access error.
    (this as unknown as HTMLElement).classList.toggle('inspector-open', this.rightOpen);
    this._app = {
      songState: this.project,
      loadSong: async (id: string) => {
        const song = await projectStore.get(id);
        if (song) {
          this.project = { ...newSong(), ...song, meta: { ...newSong().meta, ...song.meta } };
          this.activeView = 'app';
        }
      },
      saveCurrentSong: this._saveProject.bind(this),
      createNewSong: () => {
        this.project = newSong();
        this.activeView = 'app';
      },
      updateCurrentSong: (updates: Partial<SongState>) => {
        const newProject = { ...this.project, ...updates };
        if (updates.meta) newProject.meta = { ...this.project.meta, ...updates.meta };
        if (updates.drafts) newProject.drafts = { ...this.project.drafts, ...updates.drafts };
        if (updates.generators) newProject.generators = { ...this.project.generators, ...updates.generators };
        this.project = newProject;
        this._markDirty();
      },
      audioContext: this.audioContext,
      analyserNode: this.analyserNode,
      currentTrack: this.currentTrack,
      updateTrack: (track: AppContext['currentTrack']) => { this.currentTrack = track; },
      isPlaying: this.isPlaying,
      togglePlay: () => {
          if (this.isPlaying) this._stop(); else this._play();
      },
      trainedLoras: this.trainedLoras,
      explicitContentFilter: this.explicitContentFilter,
      isPanningAutomationEnabled: this.isPanningAutomationEnabled,
      togglePanningAutomation: () => { this.isPanningAutomationEnabled = !this.isPanningAutomationEnabled; },
      hypnoticLayerMix: this.hypnoticLayerMix,
      setHypnoticLayerMix: (mix: number) => { this.hypnoticLayerMix = mix; },
      stereoWidth: this.stereoWidth,
      setStereoWidth: (width: number) => { this.stereoWidth = width; },
      currentTime: this.currentTime,
      setCurrentTime: (time: number) => {
          const wasPlaying = this.isPlaying;
          if (wasPlaying) this._stop();
          this.startOffset = Math.max(0, Math.min(time, this.currentTrack.duration));
          this.currentTime = this.startOffset;
          if (wasPlaying) this._play();
      },
      abState: this.abState,
      abService: this.abService,
      agentStatus: this.agentStatus,
      updateAgentStatus: (agent: AgentName, status: AgentState, message?: string) => {
        this.agentStatus = { ...this.agentStatus, [agent]: { status, message } };
      },
      showToast: (message: string, type: 'info' | 'success' | 'error' = 'info') => {
          this.toastPortal?.addToast(message, type);
      },
      audioLatencyMs: 0,
      lufs: { i: 0, s: 0 },
      peak: 0,
      setLoudness: () => {},
      bassBoost: 0, setBassBoost: () => {}, midClarity: 0, setMidClarity: () => {}, highSparkle: 0, setHighSparkle: () => {}
    };

    aiService.initializeChat();
    this._chat = {
      messages: this.messages,
      isLoading: this.isLoadingChat,
      sendMessage: async (text: string) => { /* Stub */ },
    };
    this._checkForAutosave();
  }

  disconnectedCallback(): void {
      super.disconnectedCallback();
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.audioSource?.disconnect();
      this.analyserNode?.disconnect();
  }

  willUpdate(changedProperties: Map<string, any>) {
      if (changedProperties.has('project')) {
          const newMixUrl = this.project.audio.latestMix;
          if (newMixUrl && newMixUrl !== this.lastProcessedMixUrl) {
              this.lastProcessedMixUrl = newMixUrl;
              this._loadAndSetTrack(newMixUrl);
          }
      }
  }

  private async _loadAndSetTrack(url: string) {
    if (this.isPlaying) this._stop(false);
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.currentTrack = { ...this.currentTrack, audioBuffer, duration: audioBuffer.duration };
    } catch (error) {
        console.error("Failed to load or decode audio track:", error);
        this._app.showToast("Failed to load audio track.", "error");
    }
  }

  private _play() {
    if (this.isPlaying || !this.currentTrack.audioBuffer) return;

    this.audioSource = this.audioContext.createBufferSource();
    this.audioSource.buffer = this.currentTrack.audioBuffer;
    this.audioSource.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    this.playbackStartTime = this.audioContext.currentTime - this.startOffset;
    this.audioSource.start(0, this.startOffset);

    this.isPlaying = true;
    this._updateProgress();
  }

  private _stop(manualStop = true) {
      if (!this.isPlaying || !this.audioSource) return;
      
      this.audioSource.stop();
      this.audioSource.disconnect();
      this.analyserNode.disconnect();
      this.audioSource = null;
      this.isPlaying = false;
      
      if (manualStop) {
          this.startOffset = this.audioContext.currentTime - this.playbackStartTime;
      } else {
          this.startOffset = 0; // Reset if stopped programmatically (e.g., track end)
      }

      if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
      }
  }

  private _updateProgress = () => {
    if (!this.isPlaying) return;

    this.currentTime = this.audioContext.currentTime - this.playbackStartTime;

    if (this.currentTime >= this.currentTrack.duration) {
        this._stop(false);
        this.currentTime = 0;
        this.startOffset = 0;
    }

    this.animationFrameId = requestAnimationFrame(this._updateProgress);
  }

  private _checkForAutosave() {
    if (flags.autosave) {
      this.autosaveTimeout = window.setInterval(() => {
        if (this.isDirty) {
          this._autosaveProject();
        }
      }, 30000); // Autosave every 30 seconds
    }
  }

  private _markDirty() {
    this.isDirty = true;
  }

  private async _autosaveProject() {
    if (!this.project.id) return;
    this.saving = true;
    try {
      await projectStore.save(this.project);
      this.isDirty = false;
    } catch (error) {
      console.error("Autosave failed:", error);
    } finally {
      this.saving = false;
    }
  }

  private async _saveProject() {
    this._autosaveProject(); // Use the same logic
    this._app.showToast('Project saved!', 'success');
  }

  private async _createTrack() {
    this.isOrchestrating = true;
    try {
      const result = await this.orchestrator.runPipeline(
        ['songwriter', 'beat', 'mixing', 'mastering', 'visuals', 'evaluation'],
        {
          title: this.project.meta.title,
          genre: this.project.meta.key,
          project: this.project,
        }
      );
      
      this.project.audio.latestMix = result['master.url'] as string;
      if(this.project.visuals) this.project.visuals.coverArtUrl = result['cover.url'] as string;
      
      this._app.showToast('Track created successfully!', 'success');
    } catch (error) {
      console.error("Orchestration failed:", error);
      this._app.showToast('Track creation failed.', 'error');
    } finally {
      this.isOrchestrating = false;
    }
  }

  private _setView(v: View) {
    this.view = v;
    this.sidebarOpen = false;
    localStorage.setItem('whisper-os-view', v);
  }
  
  private _toggleRightInspector() {
    this.rightOpen = !this.rightOpen;
    localStorage.setItem('whisper-os-right-panel-open', String(this.rightOpen));
// FIX: Cast `this` to `unknown as HTMLElement` to resolve `classList` property access error.
    (this as unknown as HTMLElement).classList.toggle('inspector-open', this.rightOpen);
  }
  
  private _renderSidebar() {
    const modes = Object.entries(viewIcons).filter(([, v]) => v.isMode);
    const utilities = Object.entries(viewIcons).filter(([, v]) => !v.isMode);

    return html`
        <aside class="sidebar">
            <div class="brand">
                <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12,3L2,12H5V20H19V12H22L12,3M12,7.7L16,11V18H8V11.7L12,7.7Z"/></svg>
                <span class="brand-text">Whisper OS</span>
            </div>
            <nav class="nav">
              <span class="nav-header">Modes</span>
              ${modes.map(([key, value]) => html`
                  <button class=${classMap({'nav-button':true, active:this.view===key})} @click=${()=> this._setView(key as View)} title=${value.label}>
                    <svg viewBox="0 0 24 24"><path d=${value.path} /></svg>
                    <span class="nav-label">${value.label}</span>
                  </button>
              `)}
              <span class="nav-header">Utilities</span>
              ${utilities.map(([key, value]) => html`
                  <button class=${classMap({'nav-button':true, active:this.view===key})} @click=${()=> this._setView(key as View)} title=${value.label}>
                    <svg viewBox="0 0 24 24"><path d=${value.path} /></svg>
                    <span class="nav-label">${value.label}</span>
                  </button>
              `)}
            </nav>
        </aside>
    `;
  }

  private _renderToolbar() {
    if (!this.project) return nothing;
    return html`
      <header class="topbar">
          <button class="icon-button" @click=${() => this.commandPalette.open()}>
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm8 0v8h8v-8h-8zm6 6h-4v-4h4v4z"></path></svg>
            <span style="margin-left: 8px;">Cmd Palette</span>
        </button>
        <div class="meta">
          <input class="title" .value=${this.project.meta.title}
                 @change=${(e: any)=>{ this._app.updateCurrentSong({ meta: { ...this.project.meta, title: e.target.value } }) }} />
        </div>
        <div class="actions">
          <button class="primary" @click=${() => { hapticFeedback(20); this._createTrack(); }} ?disabled=${this.isOrchestrating} title="Create Track (One-Click)">
            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5V15.25L10.2,14.6L7.5,12.65L8.5,11.5L10.85,13.2L11,13.35V7.5A1.5,1.5 0 0,1 12.5,6A1.5,1.5 0 0,1 14,7.5V12.5L15.5,11.5L16.5,12.65L13.8,14.6L13,15.25V16.5A1.5,1.5 0 0,1 11.5,18A1.5,1.5 0 0,1 11,16.5Z"/></svg>
            <span class="button-text">Create Track</span>
          </button>
        </div>
      </header>
    `;
  }

  private _renderView() {
    switch (this.view) {
        case 'studio': return html`<studio-mode .initialSongState=${this.project}></studio-mode>`;
        case 'presets': return html`<presets-mode></presets-mode>`;
        case 'remix-lora': return html`<remix-lora-mode></remix-lora-mode>`;
        case 'releases': return html`<releases-utility></releases-utility>`;
        case 'stem-mixer': return html`<stem-mixer-utility></stem-mixer-utility>`;
        case 'daily-banger': return html`<daily-banger-pipeline-utility></daily-banger-pipeline-utility>`;
        case 'agents-dashboard': return html`<agents-dashboard-module .orchestrator=${this.orchestrator}></agents-dashboard-module>`;
        case 'creative-dna': return html`<creative-dna-utility></creative-dna-utility>`;
        case 'sonic-alchemist': return html`<sonic-alchemist-utility></sonic-alchemist-utility>`;
        case 'spatial-sound': return html`<spatial-sound-architect-utility></spatial-sound-architect-utility>`;
        case 'sudoku': return html`<sudoku-utility></sudoku-utility>`;
        case 'settings': return html`<settings-module></settings-module>`;
        case 'meditation': return html`<meditation-module></meditation-module>`;
        default: return html`<studio-mode .initialSongState=${this.project}></studio-mode>`;
    }
  }

  static styles = [sharedStyles, css`
    :host {
      display: grid;
      grid-template-areas: "sidebar topbar"
                           "sidebar main"
                           "player player";
      grid-template-rows: 64px 1fr 90px;
      grid-template-columns: var(--sidebar-width) 1fr;
      height: 100vh;
      overflow: hidden;
      transition: grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host(:hover) .sidebar, :host(.sidebar-open) .sidebar {
        width: var(--sidebar-width-expanded);
    }
    .main-content {
        grid-area: main;
        overflow: hidden;
    }
    .sidebar {
      grid-area: sidebar;
      background-color: var(--bg-panel-solid);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: var(--spacing-sm);
      width: var(--sidebar-width);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      flex-shrink: 0;
    }
    .brand svg {
      width: 24px;
      height: 24px;
      color: var(--accent-primary);
      flex-shrink: 0;
    }
    .brand-text {
      font-weight: 600;
      font-size: 1rem;
      opacity: 0;
      transition: opacity 0.2s;
    }
    :host(:hover) .brand-text, :host(.sidebar-open) .brand-text {
      opacity: 1;
    }
    .nav {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      flex-grow: 1;
    }
    .nav-header {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: var(--spacing-lg) var(--spacing-md) var(--spacing-xs);
      opacity: 0;
      transition: opacity 0.2s;
    }
     :host(:hover) .nav-header, :host(.sidebar-open) .nav-header {
      opacity: 1;
    }
    .nav-button {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border-radius: var(--border-radius);
      border: none;
      background-color: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.9rem;
      text-align: left;
    }
    .nav-button:hover {
      background-color: var(--bg-hover);
      color: var(--text-primary);
    }
    .nav-button.active {
      background: var(--accent-primary-gradient);
      color: var(--text-on-accent);
      font-weight: 600;
    }
    .nav-button svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
      flex-shrink: 0;
    }
    .nav-label {
      opacity: 0;
      transition: opacity 0.2s;
      white-space: nowrap;
    }
    :host(:hover) .nav-label, :host(.sidebar-open) .nav-label {
      opacity: 1;
    }
    .topbar {
      grid-area: topbar;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--spacing-lg);
      border-bottom: 1px solid var(--border-color);
    }
    .topbar .meta {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .topbar .title {
        font-size: 1.2rem;
        font-weight: 600;
        background: transparent;
        border: none;
        color: var(--text-primary);
        padding: 0.5rem;
    }
    .topbar .actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
  `];
  
  render() {
    if (this.activeView === 'project-manager') {
        return html`<project-manager-utility></project-manager-utility>`;
    }

    return html`
      ${this._renderSidebar()}
      ${this._renderToolbar()}
      <main class="main-content">
        ${this._renderView()}
      </main>
      <media-player></media-player>
      
      <toast-portal></toast-portal>
      <render-recovery-panel></render-recovery-panel>
      <command-palette .setView=${(v: string) => this._setView(v as View)}></command-palette>
      <j-chat></j-chat>
    `;
  }
}
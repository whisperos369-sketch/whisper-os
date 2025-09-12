


import {css, html, LitElement, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {consume} from '@lit/context';
import {appContext, AppContext, Lora} from '@/context.ts';
import {aiService} from '@/ai-service.ts';
import {sharedStyles} from '@/shared-styles.ts';

type CoverLora = { path: string, weight: number };


@customElement('cover-art-module')
export class CoverArtModule extends LitElement {
  @consume({context: appContext, subscribe: true})
  private _app!: AppContext;

  @state() private prompt = 'An abstract, vibrant, synthwave-inspired album cover';
  @state() private negative = 'blurry, text, watermark, ugly';
  @state() private numImages = 4;
  @state() private loraStack: CoverLora[] = [];
  @state() private generatedImages: string[] = [];
  @state() private pickedUrl: string | null = null;
  @state() private loading = false;
  @state() private error = '';

  // FIX: Removed 'override' modifier to resolve build error.
  static styles = [sharedStyles, css`
    .grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 16px;
    }
    .main-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .lora-stack {
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
    }
    .lora-item {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }
    .lora-weight {
      font-size: 0.8rem;
      color: #94a3b8;
      min-width: 28px;
      text-align: right;
    }
    .image-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .image-container {
      position: relative;
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid transparent;
      transition: border-color 0.2s;
    }
    .image-container.picked {
      border-color: var(--accent-primary);
    }
    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .image-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      padding: 8px;
      color: white;
      font-size: 0.8rem;
    }
  `];

  private get trainedLoras(): Lora[] {
    return this._app?.trainedLoras ?? [];
  }
  
  private _addLora() {
    const defaultLora = this.trainedLoras.find(l => l.type === 'sound') ?? this.trainedLoras[0];
    if (defaultLora) {
      this.loraStack = [...this.loraStack, { path: defaultLora.name, weight: 0.7 }];
    }
  }

  private _updateLora(index: number, key: keyof CoverLora, value: any) {
    this.loraStack[index] = { ...this.loraStack[index], [key]: value };
    // FIX: Removed requestUpdate call; direct state mutation with spread will trigger re-render.
    this.loraStack = [...this.loraStack];
  }

  private _removeLora(index: number) {
    this.loraStack = this.loraStack.filter((_, i) => i !== index);
  }

  private async _generate() {
    this.loading = true;
    this.error = '';
    this.generatedImages = [];
    this.pickedUrl = null;
    try {
        const res = await aiService.coverArt({
          prompt: this.prompt,
          negative: this.negative,
          numImages: this.numImages,
          loras: this.loraStack
        });
        this.generatedImages = [res.imagePath];
        this.pickedUrl = res.imagePath;
    } catch (e: any) {
      this.error = e?.message ?? 'Cover art generation failed.';
      this._app.showToast(this.error, 'error');
    } finally {
      this.loading = false;
    }
  }

  private _renderLoraStack() {
    return html`
      <div class="lora-stack">
        <h4>Visual LoRA Stack</h4>
        ${this.loraStack.map((lora, index) => {
          const soundModels = this.trainedLoras.filter(l => l.type === 'sound');
          const vocalModels = this.trainedLoras.filter(l => l.type === 'vocal');
          return html`
            <div class="lora-item">
              <select .value=${lora.path} @change=${(e: any) => this._updateLora(index, 'path', e.target.value)} ?disabled=${this.loading}>
                ${soundModels.length > 0 ? html`<optgroup label="Sound Models">
                  ${soundModels.map(l => html`<option value=${l.name}>${l.name}</option>`)}
                </optgroup>` : ''}
                 ${vocalModels.length > 0 ? html`<optgroup label="Vocal Models">
                  ${vocalModels.map(l => html`<option value=${l.name}>${l.name}</option>`)}
                </optgroup>` : ''}
              </select>
              <input type="range" min="0" max="1.5" step="0.05" .value=${String(lora.weight)}
                     @input=${(e: any) => this._updateLora(index, 'weight', Number(e.target.value))} ?disabled=${this.loading}>
              <span class="lora-weight">${lora.weight.toFixed(2)}</span>
              <button class="icon-button" @click=${() => this._removeLora(index)} ?disabled=${this.loading}>✕</button>
            </div>
          `;
        })}
        <button class="ghost" @click=${this._addLora} ?disabled=${this.loading}>+ Add Visual LoRA</button>
      </div>
    `;
  }

  // FIX: Removed 'override' modifier to resolve build error.
  render() {
    return html`
      <div class="grid">
        <div class="main-content">
          <div>
            <label>Prompt
              <textarea .value=${this.prompt} @input=${(e: any) => this.prompt = e.target.value} ?disabled=${this.loading}></textarea>
            </label>
          </div>
          <div>
            <label>Negative Prompt
              <textarea .value=${this.negative} @input=${(e: any) => this.negative = e.target.value} ?disabled=${this.loading}></textarea>
            </label>
          </div>
          <div class="image-gallery">
            ${this.generatedImages.map(img => html`
              <div class="image-container ${classMap({picked: this.pickedUrl === img})}" @click=${() => this.pickedUrl = img}>
                <img src=${img} alt=${this.prompt}>
              </div>
            `)}
          </div>
          ${this.error ? html`<div class="error-message">${this.error}</div>` : nothing}
        </div>
        <aside>
          <div>
            <label>Batch Size
              <select .value=${String(this.numImages)} @change=${(e: any) => this.numImages = Number(e.target.value)} ?disabled=${this.loading}>
                <option>1</option><option>4</option><option>6</option><option>9</option>
              </select>
            </label>
          </div>
          ${this._renderLoraStack()}
          <button @click=${this._generate} ?disabled=${this.loading} style="margin-top: 16px; width: 100%;">
            ${this.loading ? 'Generating...' : 'Generate Cover Art'}
          </button>
        </aside>
      </div>
    `;
  }
}
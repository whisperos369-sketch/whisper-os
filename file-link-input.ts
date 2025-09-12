/**
 * @fileoverview A reusable component for selecting a file via upload or URL.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { sharedStyles } from './shared-styles.ts';

type InputType = 'file' | 'link';

@customElement('file-link-input')
// FIX: Extend LitElement to enable component functionality.
export class FileLinkInput extends LitElement {
    @property({ type: Boolean }) showRadioToggle = true;

    @state() private inputType: InputType = 'file';
    @state() private isLoading = false;
    @state() private statusMessage = '';
    @state() private statusType: 'success' | 'error' | '' = '';
    @state() private linkUrl = '';

    static styles = [
        sharedStyles,
        css`
        /* Local component styles */
        `
    ];

    private _dispatchFile(file: File | null, isLoading = false) {
        (this as LitElement).dispatchEvent(new CustomEvent('file-change', {
            detail: { file, isLoading },
            bubbles: true,
            composed: true,
        }));
    }

    private _handleFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0] || null;
        if (file) {
            this.statusMessage = `Selected: ${file.name}`;
            this.statusType = 'success';
            this._dispatchFile(file);
        }
    }

    private async _handleFetchLink() {
        if (!this.linkUrl.trim()) {
            this.statusMessage = 'Please enter a URL.';
            this.statusType = 'error';
            return;
        }

        try {
            // This will throw an error if the URL is not valid.
            new URL(this.linkUrl);
        } catch (_) {
            this.statusMessage = 'Invalid URL. Please enter a full, valid URL including http:// or https://.';
            this.statusType = 'error';
            this._dispatchFile(null, false);
            return;
        }

        this.isLoading = true;
        this.statusMessage = 'Fetching file...';
        this.statusType = '';
        this._dispatchFile(null, true);

        try {
            // Note: This fetch can be blocked by CORS. In a real application,
            // this would likely be handled by a backend proxy.
            const response = await fetch(this.linkUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            const fileName = this.linkUrl.substring(this.linkUrl.lastIndexOf('/') + 1) || 'downloaded_file';
            const file = new File([blob], fileName, { type: blob.type });

            this.statusMessage = `Fetched: ${file.name}`;
            this.statusType = 'success';
            this._dispatchFile(file);

        } catch (error) {
            console.error('Error fetching file:', error);
            this.statusMessage = 'Fetch failed. This is likely a CORS issue. Please download the file and use the "Upload File" option.';
            this.statusType = 'error';
            this._dispatchFile(null);
        } finally {
            this.isLoading = false;
        }
    }
    
    firstUpdated() {
        if (!this.showRadioToggle) {
            this.inputType = 'file'; // Default to file if toggle is hidden
        }
    }
    
    private _handleInputTypeChange(e: Event) {
        this.inputType = (e.target as HTMLInputElement).value as InputType;
        // Reset state when switching
        this.statusMessage = '';
        this.statusType = '';
        this.linkUrl = '';
        this._dispatchFile(null);
    }

    render() {
        return html`
            <div class="file-link-input-container">
                ${this.showRadioToggle ? html`
                    <div class="radio-group file-link-input-toggle">
                        <label>
                            <input type="radio" name="inputType" value="file" .checked=${this.inputType === 'file'} @change=${this._handleInputTypeChange}>
                            Upload File
                        </label>
                        <label>
                            <input type="radio" name="inputType" value="link" .checked=${this.inputType === 'link'} @change=${this._handleInputTypeChange}>
                            Paste Link
                        </label>
                    </div>
                ` : ''}

                ${this.inputType === 'file' ? html`
                    <input type="file" accept="audio/*,video/*" @change=${this._handleFileChange} ?disabled=${this.isLoading}>
                ` : html`
                    <div class="file-link-input-controls">
                        <input type="text" placeholder="https://..." .value=${this.linkUrl} @input=${(e: Event) => this.linkUrl = (e.target as HTMLInputElement).value} ?disabled=${this.isLoading}>
                        <button @click=${this._handleFetchLink} ?disabled=${this.isLoading}>Fetch</button>
                    </div>
                    <div class="cors-warning">
                        Note: Fetching from a link may fail due to browser security (CORS). If you encounter an error, please download the file and use the "Upload File" option.
                    </div>
                `}
                <div class="file
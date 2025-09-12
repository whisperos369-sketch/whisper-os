/**
 * @fileoverview Stubbed LoRA Training utility component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('lora-training-utility')
export class LoraTrainingUtility extends LitElement {
    static styles = [
        css`
            /* Minimal styles for stub component */
        `,
    ];

    render() {
        return html`<div id="lora-training-section"></div>`;
    }
}

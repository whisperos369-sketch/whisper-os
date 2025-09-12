import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('toast-portal')
export class ToastPortal extends LitElement {
    show(_msg: string, _type?: string) {
        /* no-op stub */
    }
    addToast(msg: string, type: string) {
        this.show(msg, type);
    }
    render() {
        return html``;
    }
}

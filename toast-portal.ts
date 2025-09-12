export class ToastPortal extends HTMLElement {
  addToast(msg: string, _type: string = 'info') {
    console.log('toast:', _type, msg);
  }
}

customElements.define('toast-portal', ToastPortal);

/**
 * @fileoverview Minimal implementation of a "Releases" view.
 * It renders a static list of sample release notes so the rest of
 * the application can compile and display something meaningful.
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface ReleaseInfo {
  /** Version string such as `v1.0.0`. */
  version: string;
  /** ISO formatted release date. */
  date: string;
  /** Short description of the release. */
  notes: string;
}

// A small in-memory list keeps the component framework-friendly while
// avoiding the need for network calls during tests or builds.
const SAMPLE_RELEASES: ReleaseInfo[] = [
  {
    version: 'v0.1.0',
    date: '2024-01-01',
    notes: 'Initial release with project scaffolding.'
  },
  {
    version: 'v0.2.0',
    date: '2024-06-01',
    notes: 'Adds Windows scripts and CI hardening.'
  }
];

@customElement('releases-utility')
export class ReleasesUtility extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    li + li {
      margin-top: 0.75rem;
    }
    .version {
      font-weight: bold;
    }
    .date {
      color: #666;
      font-size: 0.85em;
    }
  `;

  @state()
  private _releases: ReleaseInfo[] = SAMPLE_RELEASES;

  /** Renders the list of releases. */
  render() {
    return html`
      <h2>Releases</h2>
      <ul>
        ${this._releases.map(r => html`
          <li>
            <div class="version">${r.version}</div>
            <div class="date">${r.date}</div>
            <div class="notes">${r.notes}</div>
          </li>
        `)}
      </ul>
    `;
  }
}

export default ReleasesUtility;


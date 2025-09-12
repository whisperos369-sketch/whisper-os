/**
 * @fileoverview Shared, high-level type definitions for the application.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents the core creative parameters that guide AI generation,
 * often controlled by UI elements like sliders and selectors.
 */
export interface CreativeParams {
  genre: string;
  bpm?: number;
  key?: string;
  mood?: string;
  complexity?: number;
  harmonicRichness?: number;
  energy?: number;
  references?: string[]; // file paths or URLs
}
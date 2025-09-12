/**
 * @fileoverview Defines settings for the Always-On Polish Bus.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PolishSettings {
    lufsTarget: -14 | -11;
    presenceDb: number;
    limiterCeilingDb: -0.3;
    subtractiveEqHz: number;
    subtractiveEqDb: number;
}

export const defaultSongPolish: PolishSettings = {
    lufsTarget: -14,
    presenceDb: 2.0,
    limiterCeilingDb: -0.3,
    subtractiveEqHz: 300,
    subtractiveEqDb: -3,
};

export const defaultSnippetPolish: PolishSettings = {
    lufsTarget: -11,
    presenceDb: 2.5,
    limiterCeilingDb: -0.3,
    subtractiveEqHz: 300,
    subtractiveEqDb: -3,
};

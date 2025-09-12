import type { Settings } from './types.ts';

export function initOps() {
    // placeholder ops initialization
}

export async function getSettings(): Promise<Settings> {
    return {};
}

export async function updateSettings(_settings: Partial<Settings>): Promise<void> {
    // no-op
}

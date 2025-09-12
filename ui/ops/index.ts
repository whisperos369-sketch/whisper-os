import type { Operation, Settings } from './types.ts';

const operations: Operation[] = [];
let settings: Settings = {};

export function list(): Operation[] {
  return operations;
}

export function getSettings(): Settings {
  return settings;
}

export function updateSettings(newSettings: Settings): void {
  settings = { ...settings, ...newSettings };
}

export type Clip = { id: string; start: number; duration: number; title?: string };
export type Track = { id: string; clips: Clip[] };

export const uiSections: Track[] = [];

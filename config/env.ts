export interface EnvConfig {
  /** Base URL for the MusicGen service. */
  MUSICGEN_URL: string;
  /** Base URL for the ACE image generator. */
  ACE_URL: string;
}

const importEnv = (import.meta as any).env || {};

export const env: EnvConfig = {
  MUSICGEN_URL: importEnv.VITE_MUSICGEN_URL || '',
  ACE_URL: importEnv.VITE_ACE_URL || '',
};

export const flags: Record<string, boolean> = {};
export default env;

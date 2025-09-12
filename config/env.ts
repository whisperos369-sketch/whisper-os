const metaEnv = (import.meta as any).env || {};

export const env = {
    API_BASE_URL: metaEnv.VITE_API_BASE_URL || '',
    MUSICGEN_URL: metaEnv.VITE_MUSICGEN_URL || '',
    ACE_URL: metaEnv.VITE_ACE_URL || ''
};

export const flags = {} as Record<string, boolean>;


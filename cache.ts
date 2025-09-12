/**
 * @fileoverview A simple, in-memory, content-addressed cache for AI responses.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A simple in-memory cache. In a production environment, this could be
// backed by localStorage or a more persistent solution.
const cache = new Map<string, { timestamp: number, data: any }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

async function hash(text: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const cacheService = {
    get: async (keyParts: (string | object | null | undefined)[]) => {
        const key = await hash(JSON.stringify(keyParts));
        const entry = cache.get(key);
        if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) {
            console.log('[Cache] HIT:', key.substring(0, 8));
            return entry.data;
        }
        console.log('[Cache] MISS:', key.substring(0, 8));
        return null;
    },
    set: async (keyParts: (string | object | null | undefined)[], data: any) => {
        const key = await hash(JSON.stringify(keyParts));
        cache.set(key, { timestamp: Date.now(), data });
        console.log('[Cache] SET:', key.substring(0, 8));
    },
};

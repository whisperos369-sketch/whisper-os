import { env } from '@/config/env.ts';

export async function _fetch(path: string, init?: RequestInit): Promise<any> {
    const url = path.startsWith('http') ? path : env.API_BASE_URL + path;
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}


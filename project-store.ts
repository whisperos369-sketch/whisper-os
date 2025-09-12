/**
 * @fileoverview A service for managing song projects in IndexedDB.
 */
import type { SongState } from '@/sections.ts';

const DB_NAME = 'WhisperOSProjects';
const DB_VERSION = 1;
const STORE_NAME = 'songs';

class ProjectStore {
    private db: IDBDatabase | null = null;

    private async _getDb(): Promise<IDBDatabase> {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
        });
    }

    private async _getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
        const db = await this._getDb();
        return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
    }

    async getAll(): Promise<SongState[]> {
        const store = await this._getStore('readonly');
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result as SongState[]);
            req.onerror = () => reject(req.error);
        });
    }

    async get(id: string): Promise<SongState | undefined> {
        const store = await this._getStore('readonly');
        return new Promise((resolve, reject) => {
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result as SongState | undefined);
            req.onerror = () => reject(req.error);
        });
    }

    async save(state: SongState): Promise<void> {
        const store = await this._getStore('readwrite');
        state.meta.updatedAt = Date.now();
        return new Promise((resolve, reject) => {
            const req = store.put(state);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async delete(id: string): Promise<void> {
        const store = await this._getStore('readwrite');
        return new Promise((resolve, reject) => {
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async duplicate(id: string): Promise<string> {
        const s = await this.get(id);
        if (!s) throw new Error('Project not found');
        const copy = structuredClone(s);
        copy.id = crypto.randomUUID();
        copy.meta.title = s.meta.title + ' (Copy)';
        copy.meta.createdAt = Date.now();
        copy.meta.updatedAt = Date.now();
        await this.save(copy);
        return copy.id;
    }
}

export const projectStore = new ProjectStore();
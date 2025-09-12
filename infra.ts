/**
 * @fileoverview Infrastructure helpers for resilience (retry, timeout, circuit breaker).
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RetryPolicy = {
    max: number;
    backoffMs: (attempt: number) => number;
};

export const DefaultRetry: RetryPolicy = {
    max: 3,
    backoffMs: (a) => 500 * Math.pow(2, a)
};

/**
 * Wraps a promise with a timeout.
 * @param p The promise to wrap.
 * @param ms The timeout in milliseconds.
 */
export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return await Promise.race([
        p,
        new Promise<T>((_, r) => setTimeout(() => r(new Error(`Timeout ${ms}ms`)), ms))
    ]);
}

/**
 * A simple circuit breaker implementation.
 */
export class CircuitBreaker {
    private fails = 0;
    private lastFailureTime: number | null = null;
    
    constructor(private threshold = 5, private cooldownMs = 10000) {}

    get isOpen(): boolean {
        if (this.fails < this.threshold) {
            return false;
        }
        if (this.lastFailureTime && (Date.now() - this.lastFailureTime) > this.cooldownMs) {
            this.fails = 0;
            this.lastFailureTime = null;
            return false;
        }
        return true;
    }

    async run<T>(fn: () => Promise<T>): Promise<T> {
        if (this.isOpen) {
            throw new Error("CircuitBreaker is open. Call is blocked.");
        }
        try {
            const result = await fn();
            this.fails = 0;
            this.lastFailureTime = null;
            return result;
        } catch (e) {
            this.fails++;
            this.lastFailureTime = Date.now();
            throw e;
        }
    }
}

/**
 * Wraps a function with exponential backoff retry logic.
 */
export async function withRetry<T>(fn: () => Promise<T>, pol: RetryPolicy = DefaultRetry): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= pol.max; attempt++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            if (attempt === pol.max) break;
            await new Promise(r => setTimeout(r, pol.backoffMs(attempt)));
        }
    }
    throw lastError;
}

/**
 * Generates a unique key for idempotent operations.
 */
export const idemKey = (p = "op") => `${p}_${Math.random().toString(36).slice(2)}`;

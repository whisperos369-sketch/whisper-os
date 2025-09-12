/**
 * @fileoverview A generic helper for spawning and scoring AI-generated variants.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candidate<T> {
    id: string;
    data: T;
    meta: Record<string, any>;
}

export type Scorer<T> = (c: Candidate<T>) => number;

/**
 * Spawns multiple candidate generations, scores them, and returns the best one
 * along with a ranked list of all candidates.
 * @param producer An async function that produces a candidate given a seed number.
 * @param seeds An array of numbers to seed the producer function.
 * @param scorer A function that scores a candidate.
 * @returns An object with the top-scoring candidate and a ranked list of all candidates.
 */
export async function spawnVariants<T>(
  producer: (seed: number) => Promise<T>,
  seeds: number[],
  scorer: Scorer<T>
) {
  const runs = await Promise.all(seeds.map(async s => {
    const data = await producer(s);
    const c: Candidate<T> = { id: String(s), data, meta: { seed: s } };
    return { c, score: scorer(c) };
  }));
  
  // Sort in descending order of score
  runs.sort((a, b) => b.score - a.score);
  
  return {
    top: runs[0].c,
    ranked: runs.map(r => ({ id: r.c.id, score: r.score }))
  };
}

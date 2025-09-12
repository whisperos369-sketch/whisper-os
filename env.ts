/**
 * @fileoverview Centralized and validated environment variables for Vite.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { z } from "zod";

// This file is adapted for a local-only build where no cloud API keys are needed.
// It provides default values for configurations that might be used by the app.

const envSchema = z.object({
  MODEL_NAME: z.string().optional(),
  TIMEOUT_MS: z.coerce.number().optional(),
  MAX_RETRIES: z.coerce.number().optional()
});

// Since we are not using process.env or import.meta.env for secrets in a local-only build,
// we can just parse an empty object to get our defaults.
const parsedEnvResult = envSchema.safeParse({});

if (!parsedEnvResult.success) {
    console.error(
        "❌ Invalid environment variables:",
        parsedEnvResult.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables. App halted.");
}

const parsedEnv = parsedEnvResult.data;

// We rename the keys for easier use throughout the app and provide defaults.
export const env = {
    MODEL_NAME: parsedEnv.MODEL_NAME || "gemini-2.5-flash", // Kept for type consistency
    TIMEOUT_MS: parsedEnv.TIMEOUT_MS || 60000,
    MAX_RETRIES: parsedEnv.MAX_RETRIES || 3,
};
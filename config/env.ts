import { z } from 'zod';

const schema = z.object({
  MUSICGEN_URL: z.string().default('/api/music'),
  ACE_URL: z.string().default('/api/ace'),
  autosave: z.boolean().default(true),
});

const env = schema.parse({});
export { env };
export const flags = {
  MUSICGEN_URL: env.MUSICGEN_URL,
  ACE_URL: env.ACE_URL,
  autosave: env.autosave,
};

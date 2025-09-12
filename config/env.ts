import { z } from 'zod';

const schema = z.object({
  MUSICGEN_URL: z.string().default('/api/music'),
});

const env = schema.parse({});
export { env };
export const flags = { MUSICGEN_URL: env.MUSICGEN_URL };

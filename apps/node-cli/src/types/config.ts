import { z } from 'zod';

export const ConfigSchema = z.object({
  token: z.string().optional(),
  spaceId: z.string().optional(),
  userId: z.string().optional(),
  apiBase: z.string().url().default('https://app.caixuan.cc/api'),
  /** nginx HTTP Basic Auth credentials in `username:password` form */
  basicAuth: z.string().optional(),
});

export type ConfigData = z.infer<typeof ConfigSchema>;

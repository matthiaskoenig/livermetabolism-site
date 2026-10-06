import { z } from './zod.ts';

/** Remote snapshot links may navigate only to HTTP(S), never executable schemes. */
export const snapshotUrl = z.url({ protocol: /^https?$/ });

import { z } from 'zod';

const cardSchema = z.string();

const playerViewSchema = z.object({
  schemaVersion: z.literal(1),
  cross: z.array(z.array(cardSchema)),
  corners: z.object({
    OROS: z.number(),
    COPAS: z.number(),
    ESPADAS: z.number(),
    BASTOS: z.number(),
  }),
  stock: z.object({ count: z.number() }),
  discard: z.array(cardSchema),
  hand: cardSchema.nullable(),
  round: z.number(),
  starsAvailable: z.number(),
  starsUsed: z.number(),
  moveCount: z.number(),
  status: z.enum(['IN_PROGRESS', 'WON', 'LOST']),
  extra: z.array(cardSchema.nullable()),
  stairwayUnlocked: z.boolean(),
  stairwayBuilding: z
    .object({ pile: z.number(), count: z.number() })
    .nullable(),
});

export const matchViewSchema = z.object({
  id: z.uuid(),
  version: z.number(),
  status: z.enum(['IN_PROGRESS', 'WON', 'LOST', 'ABANDONED']),
  stars: z.number(),
  moveCount: z.number(),
  startedAt: z.string().datetime(),
  lastMoveAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  view: playerViewSchema,
});

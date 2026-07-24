import { z } from 'zod';
import { SUITS } from '../games/orda/types.js';

const suitSchema = z.enum(SUITS);

const positionSchema = z.discriminatedUnion('zone', [
  z.object({ zone: z.literal('cross'), index: z.number().int().min(0).max(4) }),
  z.object({ zone: z.literal('corner'), suit: suitSchema }),
  z.object({ zone: z.literal('discard') }),
  z.object({ zone: z.literal('extra'), index: z.number().int().min(0).max(1) }),
]);

const placeFromSchema = z.discriminatedUnion('zone', [
  z.object({ zone: z.literal('cross'), index: z.number().int().min(0).max(4) }),
  z.object({ zone: z.literal('corner'), suit: suitSchema }),
  z.object({ zone: z.literal('discard') }),
  z.object({ zone: z.literal('extra'), index: z.number().int().min(0).max(1) }),
  z.object({ zone: z.literal('hand') }),
]);

export const moveSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('DRAW') }),
  z.object({
    type: z.literal('PLACE'),
    from: placeFromSchema,
    to: positionSchema,
  }),
  z.object({ type: z.literal('USE_STAR_EXTRA_SLOT') }),
  z.object({ type: z.literal('USE_STAR_RECOVER'), cardId: z.string().min(1) }),
  z.object({
    type: z.literal('MOVE_STACK'),
    fromPile: z.number().int().min(0).max(4),
    cardIndex: z.number().int().nonnegative(),
    toPile: z.number().int().min(0).max(4),
  }),
  z.object({ type: z.literal('ABANDON') }),
]);

export const moveRequestSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  move: moveSchema,
});

export type MoveRequest = z.infer<typeof moveRequestSchema>;

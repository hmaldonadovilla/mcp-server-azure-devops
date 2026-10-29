import { z } from 'zod';

/** Publish input schemas using the same parser that validates tool arguments. */
export function zodToJsonSchema(schema: z.ZodType) {
  const value = z.toJSONSchema(schema, { target: 'draft-7', io: 'input' });
  if (value.type !== 'object')
    throw new Error('MCP tool input must be an object');
  return { ...value, type: 'object' as const };
}

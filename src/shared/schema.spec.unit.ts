import { CryptoProvider } from '@azure/msal-node';
import { z } from 'zod';
import { zodToJsonSchema } from './schema';
import { contentText } from './__test__/content-text';

describe('reviewed schema parser and MCP conversion', () => {
  it('publishes Draft-07 input defaults and bounded collection semantics', () => {
    const schema = z.object({
      top: z.number().int().min(1).max(10).optional(),
      entries: z.array(z.string()).max(4),
    });
    const json = zodToJsonSchema(schema);
    expect(json.type).toBe('object');
    expect(json.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(schema.safeParse({ entries: ['synthetic'] }).success).toBe(true);
    expect(schema.safeParse({ entries: [], top: 11 }).success).toBe(false);
  });
  it('rejects oversized invalid collections before accumulating an issue per item', () => {
    const result = z
      .array(z.number())
      .max(4)
      .safeParse(Array(100000).fill('invalid'));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.length).toBeLessThan(5);
  });
  it('refuses non-object tool input and non-text protocol content', () => {
    expect(() => zodToJsonSchema(z.string())).toThrow('object');
    expect(contentText({ type: 'text', text: 'synthetic' })).toBe('synthetic');
    for (const value of [
      null,
      {},
      { type: 'image', text: 'wrong' },
      { type: 'text', text: 2 },
    ])
      expect(() => contentText(value)).toThrow('text');
  });
});

// Azure Identity's supported MSAL line uses only UUID v4 from its UUID dependency.
describe('MSAL UUID compatibility', () => {
  it('generates a valid cryptographic request identifier with the patched CommonJS UUID', () => {
    expect(new CryptoProvider().createNewGuid()).toMatch(
      /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
    );
  });
});

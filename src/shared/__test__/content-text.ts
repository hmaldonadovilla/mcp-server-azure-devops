/** Fail explicitly when a protocol response is not the expected text content. */
export function contentText(value: unknown): string {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('type' in value) ||
    value.type !== 'text' ||
    !('text' in value) ||
    typeof value.text !== 'string'
  ) {
    throw new Error('Expected MCP text content');
  }
  return value.text;
}

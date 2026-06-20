export function isBlockLocked(content: Record<string, unknown> | undefined): boolean {
  return content?.locked === true
}

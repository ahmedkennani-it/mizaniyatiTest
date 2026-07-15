/**
 * Generates a v4-like UUID for local primary keys. Not cryptographically secure (uses
 * `Math.random`), which is fine here: these ids only need to be unique within a household's
 * local database, not unguessable.
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

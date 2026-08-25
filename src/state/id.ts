let counter = 0;

/** Small dependency-free unique id — good enough for local-only records. */
export function makeId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

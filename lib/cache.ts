type Entry = { value: string; expires: number };
const store = new Map<string, Entry>();

export function getCached(key: string): string | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function setCached(key: string, value: string, ttlMs = 60 * 60 * 1000) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}
const hits = new Map<string, number[]>();

export function isRateLimited(
  id: string,
  limit = 5,
  windowMs = 10 * 60 * 1000
): boolean {
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(id, recent);
    return true;
  }

  recent.push(now);
  hits.set(id, recent);
  return false;
}
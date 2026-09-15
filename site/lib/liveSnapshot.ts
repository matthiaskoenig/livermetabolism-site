/** Shared fetch/cache policy for browser snapshots; each reader owns its cache. */
export function createLiveSnapshot<T>(schema: {
  safeParse(value: unknown): { success: true; data: T } | { success: false };
}, defaultUrl: string) {
  let pending: Promise<T | null> | null = null;
  return {
    load(fetchImpl: typeof fetch = globalThis.fetch, url: string = defaultUrl): Promise<T | null> {
      pending ??= (async () => {
        try {
          const response = await fetchImpl(url, { cache: 'default', signal: AbortSignal.timeout(10_000) });
          if (!response.ok) return null;
          const parsed = schema.safeParse(await response.json());
          return parsed.success ? parsed.data : null;
        } catch {
          return null;
        }
      })();
      return pending;
    },
    reset(): void { pending = null; },
  };
}

export function isSnapshotFresher<T extends { fetchedAt: string }>(snapshot: T | null, builtAt: string): snapshot is T {
  if (!snapshot) return false;
  const live = Date.parse(snapshot.fetchedAt);
  const built = Date.parse(builtAt);
  return Number.isFinite(live) && (!Number.isFinite(built) || live > built);
}

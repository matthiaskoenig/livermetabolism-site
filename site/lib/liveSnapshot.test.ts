import { expect, it, vi } from 'vitest';
import { createLiveSnapshot } from './liveSnapshot';

it('aborts a stalled browser request and keeps the build-time fallback', async () => {
  const controller = new AbortController();
  const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
  try {
    const reader = createLiveSnapshot({ safeParse: () => ({ success: true as const, data: 1 }) }, 'https://example.test');
    const fetchImpl = vi.fn((_url, options) => new Promise<Response>((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('timeout')));
    })) as unknown as typeof fetch;
    const result = reader.load(fetchImpl);
    controller.abort();
    expect(await result).toBeNull();
    expect(timeout).toHaveBeenCalledWith(10_000);
  } finally { timeout.mockRestore(); }
});

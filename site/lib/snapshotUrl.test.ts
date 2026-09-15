import { describe, expect, it } from 'vitest';
import { snapshotUrl } from './snapshotUrl';

describe('remote snapshot URL boundary', () => {
  it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,hello', '//example.org', '/relative', 'not a URL'])(
    'rejects %s', (value) => expect(snapshotUrl.safeParse(value).success).toBe(false),
  );
  it.each(['https://github.com/a/b', 'http://example.org/path', 'https://example.org/?q=one#two'])(
    'allows %s', (value) => expect(snapshotUrl.parse(value)).toBe(value),
  );
});

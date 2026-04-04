import "server-only";

type Bucket = {
  count: number;
  resetAt: number;
};

const store = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, Bucket>;
};

function getStore() {
  if (!store.__rateLimitStore) {
    store.__rateLimitStore = new Map<string, Bucket>();
  }

  return store.__rateLimitStore;
}

function sweepExpired(now: number) {
  for (const [key, bucket] of getStore()) {
    if (bucket.resetAt <= now) {
      getStore().delete(key);
    }
  }
}

export function assertRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
  message: string;
}) {
  const now = Date.now();
  sweepExpired(now);

  const bucket = getStore().get(params.key);

  if (!bucket || bucket.resetAt <= now) {
    getStore().set(params.key, {
      count: 1,
      resetAt: now + params.windowMs,
    });
    return;
  }

  if (bucket.count >= params.limit) {
    throw new Error(params.message);
  }

  bucket.count += 1;
  getStore().set(params.key, bucket);
}

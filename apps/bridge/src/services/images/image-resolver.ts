export interface ResolvedImage {
  query: string;
  url: string | null;
  error: string | null;
}

export interface ImageResolver {
  resolveOne(query: string): Promise<ResolvedImage>;
}

// Provider-agnostic batcher: runs each query in parallel, isolates failures per query.
export async function resolveImagesInParallel(resolver: ImageResolver, queries: string[]): Promise<ResolvedImage[]> {
  const unique = Array.from(new Set(queries.map((query) => query.trim()).filter((query) => query.length > 0)));
  const results = await Promise.all(unique.map((query) => safeResolve(resolver, query)));
  const byQuery = new Map(results.map((result) => [result.query, result] as const));
  return queries.map((query) => {
    const normalized = query.trim();
    return byQuery.get(normalized) ?? { query, url: null, error: 'empty query' };
  });
}

async function safeResolve(resolver: ImageResolver, query: string): Promise<ResolvedImage> {
  try {
    return await resolver.resolveOne(query);
  } catch (error) {
    return {
      query,
      url: null,
      error: error instanceof Error ? error.message : 'unknown resolver error'
    };
  }
}

// Placeholder provider: constructs Unsplash Source URLs for a query. No API key, no network traffic from the bridge.
// Unsplash Source returns a random matching image for the query. Swap this for SerpAPI/Bing/Google CSE later.
export function createUnsplashSourceResolver(options?: { width?: number; height?: number }): ImageResolver {
  const width = options?.width ?? 800;
  const height = options?.height ?? 600;
  return {
    async resolveOne(query: string): Promise<ResolvedImage> {
      const trimmed = query.trim();
      if (!trimmed) {
        return { query, url: null, error: 'empty query' };
      }
      const encoded = encodeURIComponent(trimmed);
      return {
        query: trimmed,
        url: `https://source.unsplash.com/featured/${width}x${height}/?${encoded}`,
        error: null
      };
    }
  };
}

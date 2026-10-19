// Latest Instagram posts via a Behold.so JSON feed (info.json → instagramFeed), read at build time.
// The site is static, so new posts appear after the next build. If the feed can't be reached
// (offline build, Behold down), the last saved snapshot in data/instagram-snapshot.json is used.
import info from '../data/info.json';
import snapshot from '../data/instagram-snapshot.json';

type Size = { mediaUrl: string; width: number; height: number };
export type InstagramPost = {
  id: string;
  permalink: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | string;
  caption: string;
  image: Size;
  /** Instagram's own cover image (videos), used when Behold's copy can't be loaded */
  fallback?: string;
};
type Feed = {
  posts: { id: string; permalink: string; mediaType: string; prunedCaption?: string; thumbnailUrl?: string; sizes: Record<string, Size> }[];
};

// Behold doesn't always have a processed image for videos (reels); check before using it.
async function reachable(url: string) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return res.ok && (res.headers.get('content-type') ?? 'image').startsWith('image');
  } catch {
    return true; // offline build: keep the URL, the browser-side fallback still applies
  }
}

let cache: Promise<InstagramPost[]> | null = null;

async function load(): Promise<Feed> {
  const url = (info as { instagramFeed?: string }).instagramFeed;
  if (!url) return snapshot as Feed;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Feed;
  } catch (e) {
    console.warn(`[instagram] feed unavailable (${(e as Error).message}), using snapshot`);
    return snapshot as Feed;
  }
}

export function getInstagramPosts(limit = 6): Promise<InstagramPost[]> {
  cache ??= load().then((feed) =>
    Promise.all(
      (feed.posts ?? []).slice(0, limit).map(async (p) => {
        const size = p.sizes?.medium ?? p.sizes?.large ?? p.sizes?.small;
        let image: Size = size ?? { mediaUrl: p.thumbnailUrl ?? '', width: 640, height: 640 };
        if (size && p.thumbnailUrl && p.mediaType === 'VIDEO' && !(await reachable(size.mediaUrl))) {
          image = { ...size, mediaUrl: p.thumbnailUrl };
        }
        return {
          id: p.id,
          permalink: p.permalink,
          mediaType: p.mediaType,
          caption: p.prunedCaption ?? '',
          image,
          fallback: p.thumbnailUrl && p.thumbnailUrl !== image.mediaUrl ? p.thumbnailUrl : undefined,
        };
      }),
    ),
  );
  return cache;
}

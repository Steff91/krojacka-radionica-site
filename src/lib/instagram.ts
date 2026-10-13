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
};
type Feed = { posts: { id: string; permalink: string; mediaType: string; prunedCaption?: string; sizes: Record<string, Size> }[] };

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
    (feed.posts ?? []).slice(0, limit).map((p) => ({
      id: p.id,
      permalink: p.permalink,
      mediaType: p.mediaType,
      caption: p.prunedCaption ?? '',
      image: p.sizes.medium ?? p.sizes.large ?? p.sizes.small,
    })),
  );
  return cache;
}

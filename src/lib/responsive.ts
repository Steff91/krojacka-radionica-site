// srcset for /uploads images, so phones download a smaller copy instead of the full photo.
// Dev server: no variants exist yet, so the original is used.
import sharp from 'sharp';
import { WIDTHS, variantPath } from './responsive-widths.mjs';

const cache = new Map<string, Promise<{ srcset: string; width: number; height: number } | null>>();

export function responsive(src?: string) {
  if (!src || !src.startsWith('/uploads/') || import.meta.env.DEV) return Promise.resolve(null);
  if (!cache.has(src)) {
    cache.set(
      src,
      sharp(`${process.cwd()}/public${decodeURI(src)}`)
        .metadata()
        .then(({ width = 0, height = 0 }) => {
          const ws = WIDTHS.filter((w) => w < width - 60);
          if (!ws.length) return null;
          return { srcset: [...ws.map((w) => `${variantPath(src, w)} ${w}w`), `${src} ${width}w`].join(', '), width, height };
        })
        .catch(() => null),
    );
  }
  return cache.get(src)!;
}

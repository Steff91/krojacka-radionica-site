// Smaller copies of every /uploads image, generated at build (scripts/postbuild.mjs) into /uploads/_w/.
export const WIDTHS = [480, 720, 960];
export const variantPath = (src, w) => src.replace(/^\/uploads\/(.+)\.\w+$/, `/uploads/_w/$1-${w}.webp`);

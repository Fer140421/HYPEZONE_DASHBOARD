export interface CloudinaryImageOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif';
}

export const CLOUDINARY_IMAGE_PRESETS = {
  card: { width: 480, height: 600, crop: 'fill', quality: 'auto', format: 'auto' },
  thumbnail: { width: 160, height: 160, crop: 'fill', quality: 'auto', format: 'auto' },
  detail: { width: 1200, crop: 'limit', quality: 'auto', format: 'auto' },
  preview: { width: 96, height: 96, crop: 'fill', quality: 'auto', format: 'auto' },
} as const satisfies Record<string, CloudinaryImageOptions>;

export function cloudinaryImageUrl(url: string, options: CloudinaryImageOptions = {}): string {
  if (!url) {
    return url;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (parsed.hostname.toLowerCase() !== 'res.cloudinary.com') {
    return url;
  }

  const uploadMarker = '/upload/';
  const uploadIndex = parsed.pathname.indexOf(uploadMarker);
  if (uploadIndex === -1) {
    return url;
  }

  const transformation = [
    options.crop === undefined ? '' : `c_${options.crop}`,
    options.width === undefined ? '' : `w_${options.width}`,
    options.height === undefined ? '' : `h_${options.height}`,
    options.quality === undefined ? '' : `q_${options.quality}`,
    options.format === undefined ? '' : `f_${options.format}`,
  ].filter(Boolean).join(',');

  if (!transformation) {
    return url;
  }

  const assetPath = parsed.pathname.slice(uploadIndex + uploadMarker.length);
  if (assetPath === transformation || assetPath.startsWith(`${transformation}/`)) {
    return url;
  }

  parsed.pathname = `${parsed.pathname.slice(0, uploadIndex + uploadMarker.length)}${transformation}/${assetPath}`;
  return parsed.toString();
}

export const cloudinaryCardUrl = (url: string): string =>
  cloudinaryImageUrl(url, CLOUDINARY_IMAGE_PRESETS.card);

export const cloudinaryThumbnailUrl = (url: string): string =>
  cloudinaryImageUrl(url, CLOUDINARY_IMAGE_PRESETS.thumbnail);

export const cloudinaryDetailUrl = (url: string): string =>
  cloudinaryImageUrl(url, CLOUDINARY_IMAGE_PRESETS.detail);

export const cloudinaryPreviewUrl = (url: string): string =>
  cloudinaryImageUrl(url, CLOUDINARY_IMAGE_PRESETS.preview);

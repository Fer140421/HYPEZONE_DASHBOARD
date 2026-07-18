import {
  cloudinaryImageUrl,
  cloudinaryThumbnailUrl,
} from './cloudinary-image.util';

describe('cloudinaryImageUrl', () => {
  it('transforma una URL normal de Cloudinary', () => {
    expect(cloudinaryThumbnailUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg')).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_160,h_160,q_auto,f_auto/sample.jpg',
    );
  });

  it('preserva la versión y el publicId', () => {
    expect(cloudinaryThumbnailUrl('https://res.cloudinary.com/demo/image/upload/v123456/products/item.jpg')).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_160,h_160,q_auto,f_auto/v123456/products/item.jpg',
    );
  });

  it('no duplica una transformación ya aplicada', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_160,h_160,q_auto,f_auto/v1/item.jpg';
    expect(cloudinaryThumbnailUrl(url)).toBe(url);
  });

  it('no modifica una URL externa', () => {
    const url = 'https://example.com/images/item.jpg';
    expect(cloudinaryThumbnailUrl(url)).toBe(url);
  });

  it('devuelve una URL vacía sin modificar', () => {
    expect(cloudinaryThumbnailUrl('')).toBe('');
  });

  it('aplica width, height y crop', () => {
    expect(cloudinaryImageUrl('https://res.cloudinary.com/demo/image/upload/item.jpg', {
      width: 320,
      height: 240,
      crop: 'fit',
    })).toContain('/upload/c_fit,w_320,h_240/item.jpg');
  });

  it('aplica format auto', () => {
    expect(cloudinaryImageUrl('https://res.cloudinary.com/demo/image/upload/item.jpg', {
      format: 'auto',
    })).toContain('/upload/f_auto/item.jpg');
  });

  it('aplica quality auto', () => {
    expect(cloudinaryImageUrl('https://res.cloudinary.com/demo/image/upload/item.jpg', {
      quality: 'auto',
    })).toContain('/upload/q_auto/item.jpg');
  });
});

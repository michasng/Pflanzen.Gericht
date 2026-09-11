export enum ImageSize {
  Thumbnail = 'thumbnail',
  Preview = 'preview',
  Large = 'large',
}

export const IMAGE_SIZE_PIXELS: Record<ImageSize, number> = {
  [ImageSize.Thumbnail]: 160,
  [ImageSize.Preview]: 480,
  [ImageSize.Large]: 960,
}

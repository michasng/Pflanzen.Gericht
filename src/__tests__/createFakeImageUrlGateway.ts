import type { ImageUrlGateway } from '@/services/ImageUrlGateway'

export const createFakeImageUrlGateway = (
  overrides: Partial<ImageUrlGateway> = {},
): ImageUrlGateway => ({
  getImageUrl: (bucket, storagePath, size) =>
    `https://cdn.test/${bucket}/${storagePath}/${size}.webp`,
  ...overrides,
})

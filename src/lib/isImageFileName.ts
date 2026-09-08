const IMAGE_FILE_NAME_PATTERN = /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i

export const isImageFileName = (fileName: string): boolean => IMAGE_FILE_NAME_PATTERN.test(fileName)

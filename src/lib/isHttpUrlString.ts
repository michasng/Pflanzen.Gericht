const HTTP_PROTOCOLS = new Set(['http:', 'https:'])

export const isHttpUrlString = (value: string): boolean => {
  try {
    return HTTP_PROTOCOLS.has(new URL(value).protocol)
  } catch {
    return false
  }
}

const HTTP_PROTOCOLS = new Set(['http:', 'https:'])
const WHITESPACE_PATTERN = /\s/

export const isHttpUrlString = (value: string): boolean => {
  if (WHITESPACE_PATTERN.test(value)) return false
  try {
    return HTTP_PROTOCOLS.has(new URL(value).protocol)
  } catch {
    return false
  }
}

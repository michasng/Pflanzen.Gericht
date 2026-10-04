const LEADING_SUBDOMAIN_PATTERN = /^(www|[a-z]{2})\./

const parseHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export const formatSourceHostname = (url: string): string => {
  const hostname = parseHostname(url)
  if (hostname === null) return url
  const withoutSubdomain = hostname.replace(LEADING_SUBDOMAIN_PATTERN, '')
  return withoutSubdomain.includes('.') ? withoutSubdomain : hostname
}

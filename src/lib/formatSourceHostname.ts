const LEADING_SUBDOMAIN_PATTERN = /^(www|[a-z]{2})\./

export const formatSourceHostname = (url: string): string => {
  const { hostname } = new URL(url)
  const withoutSubdomain = hostname.replace(LEADING_SUBDOMAIN_PATTERN, '')
  return withoutSubdomain.includes('.') ? withoutSubdomain : hostname
}

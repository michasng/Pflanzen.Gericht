export const inheritSearchParams = (targetUrl: string, sourceUrl: string): string => {
  const url = new URL(targetUrl)
  for (const [name, value] of new URL(sourceUrl).searchParams) {
    if (!url.searchParams.has(name)) url.searchParams.set(name, value)
  }
  return url.toString()
}

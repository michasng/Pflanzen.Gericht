interface ProbeResult {
  error: { message: string } | null
}

export const tryProbe = async (probe: () => PromiseLike<ProbeResult>): Promise<string | null> => {
  try {
    const { error } = await probe()
    return error ? error.message : null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

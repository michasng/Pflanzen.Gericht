interface Navigate {
  (url: string, expectedSelector: string): Promise<void>
}

export const createConfirmingNavigator = (
  navigate: Navigate,
  waitForConfirmation: () => Promise<void>,
): Navigate => {
  let isConfirmed = false
  return async (url, expectedSelector) => {
    await navigate(url, expectedSelector)
    if (isConfirmed) return
    await waitForConfirmation()
    isConfirmed = true
  }
}

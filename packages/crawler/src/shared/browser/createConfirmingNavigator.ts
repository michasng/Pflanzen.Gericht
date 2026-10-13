export const createConfirmingNavigator = (
  navigate: (url: string) => Promise<void>,
  waitForConfirmation: () => Promise<void>,
): ((url: string) => Promise<void>) => {
  let isConfirmed = false
  return async (url) => {
    await navigate(url)
    if (isConfirmed) return
    await waitForConfirmation()
    isConfirmed = true
  }
}

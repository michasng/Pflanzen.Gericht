const CUSTOM_CATEGORY_BUTTON_SELECTOR = '.nav-button[data-group-id="-1"]'
const NATIVE_CATEGORY_BUTTON_SELECTOR = '.nav-button:not([data-group-id="-1"])'

// The picker starts on its custom category, which it renders asynchronously.
export const selectFirstNativeEmojiCategory = (root: ShadowRoot): void => {
  const observer = new MutationObserver(() => {
    if (!root.querySelector(CUSTOM_CATEGORY_BUTTON_SELECTOR)) return
    const nativeButton = root.querySelector<HTMLButtonElement>(NATIVE_CATEGORY_BUTTON_SELECTOR)
    if (!nativeButton) return
    observer.disconnect()
    nativeButton.click()
  })
  observer.observe(root, { childList: true, subtree: true })
}

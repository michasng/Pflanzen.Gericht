import { describe, expect, it } from 'vitest'
import { selectFirstNativeEmojiCategory } from '@/lib/selectFirstNativeEmojiCategory'

const createButton = (groupId: number): HTMLButtonElement => {
  const button = document.createElement('button')
  button.className = 'nav-button'
  button.dataset.groupId = String(groupId)
  return button
}

describe('selectFirstNativeEmojiCategory', () => {
  describe('when the custom and native categories are rendered', () => {
    it('clicks the first native category', async () => {
      const root = document.createElement('div').attachShadow({ mode: 'open' })
      const customButton = createButton(-1)
      const nativeButton = createButton(0)
      const nativeClicked = new Promise<void>((resolve) => {
        nativeButton.addEventListener('click', () => resolve())
      })
      let customClicked = false
      customButton.addEventListener('click', () => (customClicked = true))
      selectFirstNativeEmojiCategory(root)

      root.append(customButton, nativeButton)
      await nativeClicked

      expect(customClicked).toBe(false)
    })
  })
})

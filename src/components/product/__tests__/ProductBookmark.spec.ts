import { afterEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createFakeListGateway } from '@/__tests__/createFakeListGateway'
import { createListSummary } from '@/__tests__/createListSummary'
import { EmptyRouteComponent } from '@/__tests__/mountView'
import BookmarkIcon from '@/components/BookmarkIcon.vue'
import ProductBookmark from '@/components/product/ProductBookmark.vue'
import { ListVisibility } from '@/config/ListVisibility'
import { ListNameClashError } from '@/lib/ListNameClashError'
import { listGatewayKey, type ListGateway } from '@/services/ListGateway'

const USER_ID = 'user-1'
const PRODUCT_ID = 'product-1'
const FAVORITES = createListSummary({ id: 'favorites', name: 'Favoriten' })
const TRY_LATER = createListSummary({ id: 'try-later', name: 'Probieren' })
const OPEN_BUTTON = 'button[aria-label="Listen verwalten"]'
const LIST_OPTION = '[data-list-option]'
const DIALOG = '[role="dialog"]'

let mountedWrapper: VueWrapper | null = null

afterEach(() => {
  mountedWrapper?.unmount()
  mountedWrapper = null
})

// The dialog is teleported to the body, so it is queried from there.
const page = () => new DOMWrapper(document.body)

const mountBookmark = (gateway: Partial<ListGateway> = {}): VueWrapper => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: EmptyRouteComponent }],
  })
  const provide: Record<symbol, unknown> = {
    [listGatewayKey]: createFakeListGateway({
      fetchAllUserLists: () => Promise.resolve([FAVORITES, TRY_LATER]),
      ...gateway,
    }),
  }
  mountedWrapper = mount(ProductBookmark, {
    props: { ownerId: USER_ID, productId: PRODUCT_ID },
    attachTo: document.body,
    global: { plugins: [router], provide },
  })
  return mountedWrapper
}

const openDialog = async (wrapper: VueWrapper): Promise<void> => {
  await wrapper.get(OPEN_BUTTON).trigger('click')
  await vi.waitFor(() => expect(page().findAll(LIST_OPTION).length).toBeGreaterThan(0))
}

const findListOption = (name: string) => {
  const option = page()
    .findAll(LIST_OPTION)
    .find((item) => item.text().includes(name))
  if (!option) throw new Error(`No list option ${name}`)
  return option
}

const isIconFilled = (wrapper: VueWrapper): boolean =>
  wrapper.getComponent(BookmarkIcon).props('filled') === true

describe('ProductBookmark', () => {
  describe('given the product is on none of the lists', () => {
    it('shows an outlined icon', async () => {
      const wrapper = mountBookmark()
      await openDialog(wrapper)

      expect(isIconFilled(wrapper)).toBe(false)
    })

    it('adds the product to a list selected in the dialog', async () => {
      const added: unknown[] = []
      const wrapper = mountBookmark({
        addProductToList: (listId, productId) => {
          added.push([listId, productId])
          return Promise.resolve()
        },
      })
      await openDialog(wrapper)

      await findListOption('Probieren').trigger('click')

      await vi.waitFor(() =>
        expect(findListOption('Probieren').attributes('aria-pressed')).toBe('true'),
      )
      expect(added).toEqual([[TRY_LATER.id, PRODUCT_ID]])
      expect(isIconFilled(wrapper)).toBe(true)
    })

    it('shows lists in the order given by the gateway', async () => {
      const wrapper = mountBookmark()
      await openDialog(wrapper)

      const names = page()
        .findAll(LIST_OPTION)
        .map((item) => item.text())

      expect(names).toEqual(['Favoriten', 'Probieren'])
    })
  })

  describe('given the product is on a list', () => {
    const gateway = { fetchListIdsContainingProduct: () => Promise.resolve([FAVORITES.id]) }

    it('shows a filled icon and a checkmark on that list only', async () => {
      const wrapper = mountBookmark(gateway)
      await openDialog(wrapper)

      expect(isIconFilled(wrapper)).toBe(true)
      expect(findListOption('Favoriten').attributes('aria-pressed')).toBe('true')
      expect(findListOption('Probieren').attributes('aria-pressed')).toBe('false')
    })

    it('removes the product when the list is selected again', async () => {
      const removed: unknown[] = []
      const wrapper = mountBookmark({
        ...gateway,
        removeProductFromList: (listId, productId) => {
          removed.push([listId, productId])
          return Promise.resolve()
        },
      })
      await openDialog(wrapper)

      await findListOption('Favoriten').trigger('click')

      await vi.waitFor(() => expect(isIconFilled(wrapper)).toBe(false))
      expect(removed).toEqual([[FAVORITES.id, PRODUCT_ID]])
    })
  })

  describe('when the lists cannot be loaded', () => {
    it('shows the error in the dialog', async () => {
      const wrapper = mountBookmark({
        fetchAllUserLists: () => Promise.reject(new Error('offline')),
      })

      await wrapper.get(OPEN_BUTTON).trigger('click')

      await vi.waitFor(() => expect(page().get('[role="alert"]').text()).toBe('offline'))
    })
  })

  describe('when pressing Escape in the dialog', () => {
    it('closes the dialog', async () => {
      const wrapper = mountBookmark()
      await openDialog(wrapper)

      await page().get(DIALOG).trigger('keydown.esc')

      expect(page().find(DIALOG).exists()).toBe(false)
    })
  })

  describe('when creating a list from the dialog', () => {
    const openNewListForm = async (wrapper: VueWrapper): Promise<void> => {
      await openDialog(wrapper)
      await page().get('button[aria-label="Neue Liste"]').trigger('click')
    }

    it('preselects nothing', async () => {
      const wrapper = mountBookmark()
      await openNewListForm(wrapper)

      const checkedCount = page()
        .findAll('input[type="radio"]')
        .filter(
          (radio) => radio.element instanceof HTMLInputElement && radio.element.checked,
        ).length

      expect(page().get('input[type="text"]').element).toHaveProperty('value', '')
      expect(checkedCount).toBe(0)
    })

    it('creates the list containing the product and shows it checked', async () => {
      const calls: unknown[] = []
      const created = createListSummary({ id: 'neu', name: 'Neu' })
      let storedLists = [FAVORITES, TRY_LATER]
      let storedMemberships: string[] = []
      const wrapper = mountBookmark({
        fetchAllUserLists: () => Promise.resolve(storedLists),
        fetchListIdsContainingProduct: () => Promise.resolve(storedMemberships),
        createList: (ownerId, input) => {
          calls.push(['create', ownerId, input])
          storedLists = [FAVORITES, created, TRY_LATER]
          return Promise.resolve(created.id)
        },
        addProductToList: (listId, productId) => {
          calls.push(['add', listId, productId])
          storedMemberships = [listId]
          return Promise.resolve()
        },
      })
      await openNewListForm(wrapper)
      await page().get('input[type="text"]').setValue('Neu')
      await page().get('input[type="radio"][value="private"]').setValue()

      await page().get('form').trigger('submit')

      await vi.waitFor(() => expect(page().find('form').exists()).toBe(false))
      expect(calls).toEqual([
        ['create', USER_ID, { name: 'Neu', visibility: ListVisibility.Private }],
        ['add', 'neu', PRODUCT_ID],
      ])
      expect(findListOption('Neu').attributes('aria-pressed')).toBe('true')
      expect(isIconFilled(wrapper)).toBe(true)
    })

    it('rejects a name clash on save', async () => {
      const wrapper = mountBookmark({
        createList: () => Promise.reject(new ListNameClashError()),
      })
      await openNewListForm(wrapper)
      await page().get('input[type="text"]').setValue('Favoriten')
      await page().get('input[type="radio"][value="public"]').setValue()

      await page().get('form').trigger('submit')

      await vi.waitFor(() => expect(page().text()).toContain(new ListNameClashError().message))
      expect(page().find('form').exists()).toBe(true)
    })
  })
})

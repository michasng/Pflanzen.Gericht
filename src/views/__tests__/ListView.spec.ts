import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { ListVisibility } from '@/config/ListVisibility'
import type { ListGateway } from '@/services/ListGateway'
import type { SimilarProductsGateway } from '@/services/SimilarProductsGateway'
import { useAuthStore } from '@/stores/auth'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeListGateway } from '@/__tests__/createFakeListGateway'
import { createFakeProfileGateway } from '@/__tests__/createFakeProfileGateway'
import { createFakeSimilarProductsGateway } from '@/__tests__/createFakeSimilarProductsGateway'
import { createListSummary } from '@/__tests__/createListSummary'
import { createProductWithImages } from '@/__tests__/createProductWithImages'
import { createProfile } from '@/__tests__/createProfile'
import { createSession } from '@/__tests__/createSession'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'
import ListView from '@/views/ListView.vue'

const OWNER_ID = 'user-1'

const owner = {
  id: OWNER_ID,
  username: 'tester',
  displayName: 'Grüne Gabel',
  bio: null,
  createdAt: '2026-09-11T00:00:00.000Z',
}

const SignedInHost = defineComponent({
  setup: () => {
    const authStore = useAuthStore()
    const ready = ref(false)
    void authStore.init().then(() => {
      ready.value = true
    })
    return () => (ready.value ? h(ListView) : null)
  },
})

const mountListView = async (
  list: Partial<ListGateway>,
  viewerId: string | null = OWNER_ID,
  similarProducts: Partial<SimilarProductsGateway> = {},
) => {
  const mounted = await mountView({
    view: SignedInHost,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/profile', name: 'profile', component: EmptyRouteComponent },
      { path: '/profile/:id', name: 'profile-public', component: EmptyRouteComponent },
      { path: '/list/:id', name: 'list', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
    ],
    initialPath: '/list/list-1',
    gateways: {
      list: createFakeListGateway({
        fetchList: () => Promise.resolve(createListSummary({ visibility: ListVisibility.Private })),
        ...list,
      }),
      profile: createFakeProfileGateway({ fetchPublicProfile: () => Promise.resolve(owner) }),
      similarProducts: createFakeSimilarProductsGateway(similarProducts),
      auth: createFakeAuthGateway({
        getSession: () => Promise.resolve(viewerId ? createSession(viewerId) : null),
        fetchProfile: () => Promise.resolve(createProfile({})),
      }),
    },
  })
  await vi.waitFor(() => expect(mounted.wrapper.find('h1, [role="alert"]').exists()).toBe(true))
  return mounted
}

describe('ListView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('given the list cannot be seen', () => {
    it('shows not found', async () => {
      const { wrapper } = await mountView({
        view: ListView,
        routes: [
          { path: '/', name: 'home', component: EmptyRouteComponent },
          { path: '/list/:id', name: 'list', component: EmptyRouteComponent },
        ],
        initialPath: '/list/list-1',
        gateways: { list: createFakeListGateway(), profile: createFakeProfileGateway() },
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Liste nicht gefunden.'))
    })
  })

  describe('given the viewer owns the list', () => {
    it('shows name, visibility and the way to manage it', async () => {
      const { wrapper } = await mountListView({})

      expect(wrapper.get('h1').text()).toBe('Favoriten')
      expect(wrapper.text()).toContain('Privat')
      expect(wrapper.find('[aria-label="Liste bearbeiten"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Liste löschen"]').exists()).toBe(true)
    })

    it('preselects the current visibility when editing', async () => {
      const { wrapper } = await mountListView({})

      await wrapper.get('[aria-label="Liste bearbeiten"]').trigger('click')

      const privateOption = wrapper.get('input[type="radio"][value="private"]')
      expect((privateOption.element as HTMLInputElement).checked).toBe(true)
    })

    it('saves the changes', async () => {
      const updates: unknown[] = []
      const { wrapper } = await mountListView({
        updateList: (listId, input) => {
          updates.push([listId, input])
          return Promise.resolve()
        },
      })
      await wrapper.get('[aria-label="Liste bearbeiten"]').trigger('click')
      await wrapper.get('#edit-list-name').setValue('Neu')
      await wrapper.get('input[type="radio"][value="public"]').setValue()

      await wrapper.get('form').trigger('submit')

      await vi.waitFor(() =>
        expect(updates).toEqual([['list-1', { name: 'Neu', visibility: ListVisibility.Public }]]),
      )
    })

    it('deletes after confirmation and returns to the lists tab', async () => {
      vi.stubGlobal('confirm', () => true)
      const deleted: string[] = []
      const { wrapper, router } = await mountListView({
        deleteList: (listId) => {
          deleted.push(listId)
          return Promise.resolve()
        },
      })

      await wrapper.get('[aria-label="Liste löschen"]').trigger('click')

      await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/profile?tab=lists'))
      expect(deleted).toEqual(['list-1'])
    })

    it('keeps the list when the confirmation is declined', async () => {
      vi.stubGlobal('confirm', () => false)
      const deleted: string[] = []
      const { wrapper } = await mountListView({
        deleteList: (listId) => {
          deleted.push(listId)
          return Promise.resolve()
        },
      })

      await wrapper.get('[aria-label="Liste löschen"]').trigger('click')

      expect(deleted).toEqual([])
    })
  })

  describe('given the list has products', () => {
    const listedProducts = [
      { ...createProductWithImages({ id: 'p-new', name: 'Neu' }), addedAt: '2026-10-05T00:00:00Z' },
      { ...createProductWithImages({ id: 'p-old', name: 'Alt' }), addedAt: '2026-10-01T00:00:00Z' },
    ]

    it('shows them in the given order with their added date', async () => {
      const { wrapper } = await mountListView({
        fetchListProducts: () => Promise.resolve(listedProducts),
      })

      await vi.waitFor(() => expect(wrapper.findAll('li a')).toHaveLength(2))
      expect(wrapper.findAll('li a').map((link) => link.text())).toEqual(['Neu', 'Alt'])
      expect(wrapper.text()).toContain('hinzugefügt am')
    })

    it('lets the owner remove one without confirmation', async () => {
      const removed: unknown[] = []
      const { wrapper } = await mountListView({
        fetchListProducts: () => Promise.resolve(listedProducts),
        removeProductFromList: (listId, productId) => {
          removed.push([listId, productId])
          return Promise.resolve()
        },
      })
      await vi.waitFor(() => expect(wrapper.findAll('[aria-label="Entfernen"]')).toHaveLength(2))

      await wrapper.findAll('[aria-label="Entfernen"]')[0]?.trigger('click')

      await vi.waitFor(() => expect(wrapper.findAll('li a')).toHaveLength(1))
      expect(removed).toEqual([['list-1', 'p-new']])
    })

    it('offers someone else neither removing nor searching', async () => {
      const { wrapper } = await mountListView(
        {
          fetchList: () => Promise.resolve(createListSummary()),
          fetchListProducts: () => Promise.resolve(listedProducts),
        },
        'other-user',
      )

      await vi.waitFor(() => expect(wrapper.findAll('li a')).toHaveLength(2))
      expect(wrapper.find('[aria-label="Entfernen"]').exists()).toBe(false)
      expect(wrapper.find('input[role="combobox"]').exists()).toBe(false)
    })

    it('shows a load more button for a full page', async () => {
      const fullPage = Array.from({ length: 20 }, (_, index) => ({
        ...createProductWithImages({ id: `p-${index}`, name: `Produkt ${index}` }),
        addedAt: '2026-10-01T00:00:00Z',
      }))
      const { wrapper } = await mountListView({
        fetchListProducts: () => Promise.resolve(fullPage),
      })

      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Mehr Produkte laden"]').exists()).toBe(true),
      )
    })
  })

  describe('given the list has no products', () => {
    it('hints the owner at the search', async () => {
      const { wrapper } = await mountListView({})

      await vi.waitFor(() => expect(wrapper.text()).toContain('Suche oben nach Produkten'))
    })

    it('tells someone else that the list is empty', async () => {
      const { wrapper } = await mountListView(
        { fetchList: () => Promise.resolve(createListSummary()) },
        'other-user',
      )

      await vi.waitFor(() => expect(wrapper.text()).toContain('Noch keine Produkte'))
      expect(wrapper.text()).not.toContain('Suche oben')
    })
  })

  describe('given the owner searches for products to add', () => {
    const candidate = (id: string, name: string) => ({
      id,
      name,
      brand: null,
      category: 'drink',
      storagePath: null,
    })

    it('marks products already on the list and adds the others at the top', async () => {
      const added: unknown[] = []
      let stored = [
        {
          ...createProductWithImages({ id: 'p-old', name: 'Alt' }),
          addedAt: '2026-10-01T00:00:00Z',
        },
      ]
      const { wrapper } = await mountListView(
        {
          fetchListProducts: () => Promise.resolve(stored),
          fetchProductIdsOnList: () => Promise.resolve(['p-old']),
          addProductToList: (listId, productId) => {
            added.push([listId, productId])
            stored = [
              {
                ...createProductWithImages({ id: productId, name: 'Frisch' }),
                addedAt: '2026-10-05T00:00:00Z',
              },
              ...stored,
            ]
            return Promise.resolve()
          },
        },
        OWNER_ID,
        {
          searchProductCandidates: () =>
            Promise.resolve([candidate('p-old', 'Alt'), candidate('p-fresh', 'Frisch')]),
        },
      )
      await vi.waitFor(() => expect(wrapper.findAll('li a')).toHaveLength(1))

      await wrapper.get('input[role="combobox"]').setValue('a')
      await wrapper.get('input[role="combobox"]').trigger('focus')
      await vi.waitFor(() => expect(wrapper.findAll('[role="option"]')).toHaveLength(2))

      const [alreadyListed, addable] = wrapper.findAll('[role="option"] button')
      expect(alreadyListed?.text()).toContain('bereits auf der Liste')
      expect(alreadyListed?.attributes('disabled')).toBeDefined()
      await addable?.trigger('mousedown')

      await vi.waitFor(() =>
        expect(wrapper.findAll('li a').map((link) => link.text())).toEqual(['Frisch', 'Alt']),
      )
      expect(added).toEqual([['list-1', 'p-fresh']])
    })
    it('shows suggestions again when typing after adding, without refocusing', async () => {
      const { wrapper } = await mountListView(
        { fetchProductIdsOnList: () => Promise.resolve([]) },
        OWNER_ID,
        { searchProductCandidates: () => Promise.resolve([candidate('p-fresh', 'Frisch')]) },
      )
      const input = wrapper.get('input[role="combobox"]')
      await input.setValue('f')
      await vi.waitFor(() => expect(wrapper.findAll('[role="option"]')).toHaveLength(1))
      await wrapper.get('[role="option"] button').trigger('mousedown')
      await vi.waitFor(() => expect(wrapper.findAll('[role="option"]')).toHaveLength(0))

      await input.setValue('fr')

      await vi.waitFor(() => expect(wrapper.findAll('[role="option"]')).toHaveLength(1))
    })
  })

  describe('given someone else views the list', () => {
    it('hides visibility and management and links to the owner', async () => {
      const { wrapper } = await mountListView(
        { fetchList: () => Promise.resolve(createListSummary()) },
        'other-user',
      )

      expect(wrapper.text()).not.toContain('Öffentlich')
      expect(wrapper.find('[aria-label="Liste bearbeiten"]').exists()).toBe(false)
      expect(wrapper.get(`a[href="/profile/${OWNER_ID}"]`).text()).toBe('Grüne Gabel')
    })
  })
})

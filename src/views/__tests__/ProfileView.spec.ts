import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import type { ProfileGateway } from '@/services/ProfileGateway'
import type { ListGateway } from '@/services/ListGateway'
import { ListNameClashError } from '@/lib/ListNameClashError'
import { createFakeListGateway } from '@/__tests__/createFakeListGateway'
import { createListSummary } from '@/__tests__/createListSummary'
import { ListVisibility } from '@/config/ListVisibility'
import { useAuthStore } from '@/stores/auth'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeProfileGateway } from '@/__tests__/createFakeProfileGateway'
import { createProductWithImages } from '@/__tests__/createProductWithImages'
import { createProfile } from '@/__tests__/createProfile'
import { createReviewWithMeta } from '@/__tests__/createReviewWithMeta'
import { createSession } from '@/__tests__/createSession'
import ProfileView from '@/views/ProfileView.vue'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const USER_ID = 'user-1'

const createSessionWithEmail = () => {
  const session = createSession(USER_ID)
  return { ...session, user: { ...session.user, email: 'tester@example.com' } }
}

interface MountOptions {
  profile?: Partial<ProfileGateway>
  list?: Partial<ListGateway>
  displayName?: string | null
  bio?: string | null
}

// The view loads for the signed-in user on mount, so it is only rendered once the session is known.
const SignedInHost = defineComponent({
  setup: () => {
    const authStore = useAuthStore()
    const ready = ref(false)
    void authStore.init().then(() => {
      ready.value = true
    })
    return () => (ready.value ? h(ProfileView) : null)
  },
})

const mountProfileView = async ({
  profile = {},
  list = {},
  displayName = null,
  bio = null,
}: MountOptions) => {
  const mounted = await mountView({
    view: SignedInHost,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/profile', name: 'profile', component: EmptyRouteComponent },
      { path: '/list/:id', name: 'list', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
      { path: '/product/:id/edit', name: 'product-edit', component: EmptyRouteComponent },
      { path: '/product/:id/review', name: 'review-new', component: EmptyRouteComponent },
      { path: '/review/:reviewId/edit', name: 'review-edit', component: EmptyRouteComponent },
    ],
    initialPath: '/profile',
    gateways: {
      profile: createFakeProfileGateway(profile),
      list: createFakeListGateway(list),
      auth: createFakeAuthGateway({
        getSession: () => Promise.resolve(createSessionWithEmail()),
        fetchProfile: () => Promise.resolve(createProfile({ displayName, bio })),
      }),
    },
    stubs: { StarDisplay: true },
  })
  await vi.waitFor(() => expect(mounted.wrapper.find('[role="tab"]').exists()).toBe(true))
  return mounted
}

describe('ProfileView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('given the user has a display name and bio', () => {
    it('shows name, username, email and bio', async () => {
      const { wrapper } = await mountProfileView({
        displayName: 'Grüne Gabel',
        bio: 'Ich mag Hafer.',
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Grüne Gabel'))
      expect(wrapper.text()).toContain('@tester')
      expect(wrapper.text()).toContain('tester@example.com')
      expect(wrapper.text()).toContain('Ich mag Hafer.')
    })
  })

  describe('given loading fails', () => {
    it('shows the error', async () => {
      const { wrapper } = await mountProfileView({
        profile: { fetchUserProducts: () => Promise.reject(new Error('offline')) },
      })

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('offline'))
    })
  })

  describe('given reviews and products', () => {
    const profile: Partial<ProfileGateway> = {
      fetchUserReviews: () =>
        Promise.resolve([
          createReviewWithMeta({ id: 'review-1', isCurrent: true }),
          createReviewWithMeta({ id: 'review-2', isCurrent: false }),
        ]),
      fetchUserProducts: () =>
        Promise.resolve([createProductWithImages({ name: 'Mandelmilch', category: 'milk' })]),
    }

    it('shows the total counts', async () => {
      const { wrapper } = await mountProfileView({
        profile: {
          ...profile,
          countCurrentUserReviews: () => Promise.resolve(42),
          countUserProducts: () => Promise.resolve(17),
        },
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Hafermilch'))
      expect(wrapper.text()).toMatch(/42\s*Bewertungen/)
      expect(wrapper.text()).toMatch(/17\s*Produkte/)
    })

    it('loads superseded reviews too', async () => {
      const onlyCurrentFlags: boolean[] = []
      const { wrapper } = await mountProfileView({
        profile: {
          fetchUserReviews: (_userId, { onlyCurrent }) => {
            onlyCurrentFlags.push(onlyCurrent)
            return Promise.resolve([])
          },
        },
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Noch keine Bewertungen'))
      expect(onlyCurrentFlags).toEqual([false])
    })

    it('keeps the selected tab in the URL', async () => {
      const { wrapper, router } = await mountProfileView({ profile })
      await vi.waitFor(() => expect(wrapper.text()).toContain('Hafermilch'))

      await wrapper.get('[role="tab"][aria-label="Meine Produkte"]').trigger('click')

      await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('products'))
    })

    it('marks reviews as current or outdated and offers editing only for current ones', async () => {
      const { wrapper } = await mountProfileView({ profile })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Aktuell'))
      expect(wrapper.text()).toContain('Veraltet')
      expect(wrapper.findAll('a').filter((link) => link.text() === 'Bearbeiten')).toHaveLength(1)
      expect(wrapper.findAll('a').filter((link) => link.text() === 'Neu bewerten')).toHaveLength(2)
    })

    it('shows the products on the products tab', async () => {
      const { wrapper } = await mountProfileView({ profile })
      await vi.waitFor(() => expect(wrapper.text()).toContain('Hafermilch'))

      await wrapper.get('[role="tab"][aria-label="Meine Produkte"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.text()).toContain('Mandelmilch'))
      expect(wrapper.text()).toMatch(/Milch-Alternative\s*·\s*Alpro/)
    })
  })

  describe('given the user has lists', () => {
    const profile: Partial<ProfileGateway> = {
      fetchUserLists: () =>
        Promise.resolve([
          createListSummary({
            id: 'list-1',
            name: 'Favoriten',
            visibility: ListVisibility.Private,
          }),
          createListSummary({ id: 'list-2', name: 'Probieren', productCount: 1 }),
        ]),
      countUserLists: () => Promise.resolve(2),
    }

    const openListsTab = async (options: MountOptions) => {
      const mounted = await mountProfileView(options)
      await mounted.wrapper.get('[role="tab"][aria-label="Meine Listen"]').trigger('click')
      return mounted
    }

    it('shows the count and every list with visibility badge and product count', async () => {
      const { wrapper } = await openListsTab({ profile })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Favoriten'))
      expect(wrapper.text()).toMatch(/2\s*Listen/)
      expect(wrapper.text()).toContain('Privat')
      expect(wrapper.text()).toContain('Öffentlich')
      expect(wrapper.text()).toContain('1 Produkt')
      expect(wrapper.text()).toContain('2 Produkte')
    })

    it('links each list to its page', async () => {
      const { wrapper } = await openListsTab({ profile })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Favoriten'))
      expect(wrapper.get('a[href="/list/list-1"]').text()).toBe('Favoriten')
    })

    it('loads all of the own lists', async () => {
      const onlyPublicFlags: boolean[] = []
      await openListsTab({
        profile: {
          fetchUserLists: (_userId, { onlyPublic }) => {
            onlyPublicFlags.push(onlyPublic)
            return Promise.resolve([])
          },
        },
      })

      await vi.waitFor(() => expect(onlyPublicFlags).toEqual([false]))
    })
  })

  describe('when creating a list', () => {
    const openNewListForm = async (options: MountOptions) => {
      const mounted = await mountProfileView(options)
      await mounted.wrapper.get('[role="tab"][aria-label="Meine Listen"]').trigger('click')
      await vi.waitFor(() =>
        expect(mounted.wrapper.find('[aria-label="Neue Liste"]').exists()).toBe(true),
      )
      await mounted.wrapper.get('[aria-label="Neue Liste"]').trigger('click')
      return mounted
    }

    it('asks for a visibility when none was chosen', async () => {
      const { wrapper } = await openNewListForm({})
      await wrapper.get('#new-list-name').setValue('Favoriten')

      await wrapper.get('form').trigger('submit')

      await vi.waitFor(() => expect(wrapper.text()).toContain('Bitte Sichtbarkeit wählen'))
    })

    it('shows the name clash', async () => {
      const { wrapper } = await openNewListForm({
        list: { createList: () => Promise.reject(new ListNameClashError()) },
      })
      await wrapper.get('#new-list-name').setValue('favoriten')
      await wrapper.get('input[type="radio"][value="public"]').setValue()

      await wrapper.get('form').trigger('submit')

      await vi.waitFor(() =>
        expect(wrapper.text()).toContain('Du hast bereits eine Liste mit diesem Namen.'),
      )
    })

    it('saves the list for the user and closes the form', async () => {
      const created: unknown[] = []
      const { wrapper } = await openNewListForm({
        list: {
          createList: (ownerId, input) => {
            created.push([ownerId, input])
            return Promise.resolve('new-list')
          },
        },
      })
      await wrapper.get('#new-list-name').setValue('Probieren')
      await wrapper.get('input[type="radio"][value="private"]').setValue()

      await wrapper.get('form').trigger('submit')

      await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(false))
      expect(created).toEqual([
        [USER_ID, { name: 'Probieren', visibility: ListVisibility.Private }],
      ])
    })
  })

  describe('given nothing was written yet', () => {
    it('shows hints for reviews and products', async () => {
      const { wrapper } = await mountProfileView({})

      await vi.waitFor(() => expect(wrapper.text()).toContain('Noch keine Bewertungen abgegeben.'))
      await wrapper.get('[role="tab"][aria-label="Meine Produkte"]').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toContain('Noch keine Produkte hinzugefügt.'))
    })
  })

  describe('when editing the profile', () => {
    it('saves trimmed values and closes the form', async () => {
      const updates: unknown[] = []
      const { wrapper } = await mountProfileView({
        profile: {
          updateProfile: (userId, values) => {
            updates.push([userId, values])
            return Promise.resolve()
          },
        },
      })
      await wrapper.get('[aria-label="Profil bearbeiten"]').trigger('click')
      await wrapper.get('#displayName').setValue('  Neue Gabel ')
      await wrapper.get('#bio').setValue('')

      await wrapper.get('form').trigger('submit')

      await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(false))
      expect(updates).toEqual([[USER_ID, { displayName: 'Neue Gabel', bio: null }]])
    })

    it('shows the error when saving fails', async () => {
      const { wrapper } = await mountProfileView({
        profile: { updateProfile: () => Promise.reject(new Error('denied')) },
      })
      await wrapper.get('[aria-label="Profil bearbeiten"]').trigger('click')

      await wrapper.get('form').trigger('submit')

      await vi.waitFor(() => expect(wrapper.get('form [role="alert"]').text()).toBe('denied'))
    })

    it('discards the form when cancelling', async () => {
      const { wrapper } = await mountProfileView({})
      await wrapper.get('[aria-label="Profil bearbeiten"]').trigger('click')

      await wrapper.get('[aria-label="Abbrechen"]').trigger('click')

      expect(wrapper.find('form').exists()).toBe(false)
    })
  })

  describe('given more products than fit on a page', () => {
    it('loads the next page on demand', async () => {
      const requestedPages: number[] = []
      const firstPage = Array.from({ length: 20 }, (_, index) =>
        createProductWithImages({ id: `product-${index}` }),
      )
      const { wrapper } = await mountProfileView({
        profile: {
          fetchUserProducts: (_userId, { page }) => {
            requestedPages.push(page)
            return Promise.resolve(
              page === 0 ? firstPage : [createProductWithImages({ id: 'product-last' })],
            )
          },
        },
      })
      await wrapper.get('[role="tab"][aria-label="Meine Produkte"]').trigger('click')
      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Mehr Produkte laden"]').exists()).toBe(true),
      )

      await wrapper.get('[aria-label="Mehr Produkte laden"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.findAll('li')).toHaveLength(21))
      expect(requestedPages).toEqual([0, 1])
    })
  })

  describe('when deleting a review after confirming', () => {
    it('refreshes the counts', async () => {
      vi.stubGlobal('confirm', () => true)
      let reviewCount = 1
      const { wrapper } = await mountProfileView({
        profile: {
          fetchUserReviews: () => Promise.resolve([createReviewWithMeta({ id: 'review-1' })]),
          countCurrentUserReviews: () => Promise.resolve(reviewCount),
          deleteReview: () => {
            reviewCount = 0
            return Promise.resolve()
          },
        },
      })
      await vi.waitFor(() => expect(wrapper.text()).toMatch(/1\s*Bewertungen/))

      await wrapper.get('[aria-label="Bewertung löschen"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.text()).toMatch(/0\s*Bewertungen/))
    })

    it('deletes it and removes it from the list', async () => {
      vi.stubGlobal('confirm', () => true)
      const deletedIds: string[] = []
      const reviews = [createReviewWithMeta({ id: 'review-1' })]
      const { wrapper } = await mountProfileView({
        profile: {
          fetchUserReviews: () => Promise.resolve(reviews),
          deleteReview: (id) => {
            deletedIds.push(id)
            return Promise.resolve()
          },
        },
      })
      await vi.waitFor(() => expect(wrapper.text()).toContain('Hafermilch'))

      await wrapper.get('[aria-label="Bewertung löschen"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.text()).toContain('Noch keine Bewertungen abgegeben.'))
      expect(deletedIds).toEqual(['review-1'])
    })
  })

  describe('when deleting a product after confirming', () => {
    it('deletes it and removes it from the list', async () => {
      vi.stubGlobal('confirm', () => true)
      const deletedIds: string[] = []
      const { wrapper } = await mountProfileView({
        profile: {
          fetchUserProducts: () => Promise.resolve([createProductWithImages({ id: 'product-9' })]),
          deleteProduct: (id) => {
            deletedIds.push(id)
            return Promise.resolve()
          },
        },
      })
      await vi.waitFor(() => expect(wrapper.find('[role="tab"]').exists()).toBe(true))
      await wrapper.get('[role="tab"][aria-label="Meine Produkte"]').trigger('click')
      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Produkt löschen"]').exists()).toBe(true),
      )

      await wrapper.get('[aria-label="Produkt löschen"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.text()).toContain('Noch keine Produkte hinzugefügt.'))
      expect(deletedIds).toEqual(['product-9'])
    })
  })

  describe('given deleting a review fails', () => {
    it('shows the error and keeps the review', async () => {
      vi.stubGlobal('confirm', () => true)
      const { wrapper } = await mountProfileView({
        profile: {
          fetchUserReviews: () => Promise.resolve([createReviewWithMeta({ id: 'review-1' })]),
          deleteReview: () => Promise.reject(new Error('denied')),
        },
      })
      await vi.waitFor(() => expect(wrapper.text()).toContain('Hafermilch'))

      await wrapper.get('[aria-label="Bewertung löschen"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('denied'))
      expect(wrapper.text()).toContain('Hafermilch')
    })
  })

  describe('given deleting a product fails', () => {
    it('shows the error and keeps the product', async () => {
      vi.stubGlobal('confirm', () => true)
      const { wrapper } = await mountProfileView({
        profile: {
          fetchUserProducts: () =>
            Promise.resolve([createProductWithImages({ name: 'Mandelmilch' })]),
          deleteProduct: () => Promise.reject(new Error('denied')),
        },
      })
      await wrapper.get('[role="tab"][aria-label="Meine Produkte"]').trigger('click')
      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Produkt löschen"]').exists()).toBe(true),
      )

      await wrapper.get('[aria-label="Produkt löschen"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('denied'))
      expect(wrapper.text()).toContain('Mandelmilch')
    })
  })

  describe('when signing out', () => {
    it('navigates to the home page', async () => {
      const { wrapper, router } = await mountProfileView({})

      await wrapper.get('[aria-label="Abmelden"]').trigger('click')

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'))
    })
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import type { ProfileGateway } from '@/services/ProfileGateway'
import { useAuthStore } from '@/stores/auth'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeProfileGateway } from '@/__tests__/createFakeProfileGateway'
import { createProduct } from '@/__tests__/createProduct'
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

const mountProfileView = async ({ profile = {}, displayName = null, bio = null }: MountOptions) => {
  const mounted = await mountView({
    view: SignedInHost,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/profile', name: 'profile', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
      { path: '/product/:id/edit', name: 'product-edit', component: EmptyRouteComponent },
      { path: '/product/:id/review', name: 'review-new', component: EmptyRouteComponent },
      { path: '/review/:reviewId/edit', name: 'review-edit', component: EmptyRouteComponent },
    ],
    initialPath: '/profile',
    gateways: {
      profile: createFakeProfileGateway(profile),
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
        Promise.resolve([createProduct({ name: 'Mandelmilch', category: 'milk' })]),
    }

    it('counts only current reviews', async () => {
      const { wrapper } = await mountProfileView({ profile })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Hafermilch'))
      expect(wrapper.text()).toMatch(/1\s*Bewertungen/)
      expect(wrapper.text()).toMatch(/1\s*Produkte/)
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

      expect(wrapper.text()).toContain('Mandelmilch')
      expect(wrapper.text()).toMatch(/Milch-Alternative\s*·\s*Alpro/)
    })
  })

  describe('given nothing was written yet', () => {
    it('shows hints for reviews and products', async () => {
      const { wrapper } = await mountProfileView({})

      await vi.waitFor(() => expect(wrapper.text()).toContain('Noch keine Bewertungen abgegeben.'))
      await wrapper.get('[role="tab"][aria-label="Meine Produkte"]').trigger('click')
      expect(wrapper.text()).toContain('Noch keine Produkte hinzugefügt.')
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

  describe('when deleting a review after confirming', () => {
    it('deletes it and reloads the reviews', async () => {
      vi.stubGlobal('confirm', () => true)
      const deletedIds: string[] = []
      let reviews = [createReviewWithMeta({ id: 'review-1' })]
      const { wrapper } = await mountProfileView({
        profile: {
          fetchUserReviews: () => Promise.resolve(reviews),
          deleteReview: (id) => {
            deletedIds.push(id)
            reviews = []
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
          fetchUserProducts: () => Promise.resolve([createProduct({ id: 'product-9' })]),
          deleteProduct: (id) => {
            deletedIds.push(id)
            return Promise.resolve()
          },
        },
      })
      await vi.waitFor(() => expect(wrapper.find('[role="tab"]').exists()).toBe(true))
      await wrapper.get('[role="tab"][aria-label="Meine Produkte"]').trigger('click')

      await wrapper.get('[aria-label="Produkt löschen"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.text()).toContain('Noch keine Produkte hinzugefügt.'))
      expect(deletedIds).toEqual(['product-9'])
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

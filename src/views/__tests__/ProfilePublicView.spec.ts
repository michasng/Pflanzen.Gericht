import { describe, expect, it, vi } from 'vitest'
import type { ProfileGateway } from '@/services/ProfileGateway'
import ProfilePublicView from '@/views/ProfilePublicView.vue'
import { createFakeProfileGateway } from '@/__tests__/createFakeProfileGateway'
import { createProduct } from '@/__tests__/createProduct'
import { createReviewWithMeta } from '@/__tests__/createReviewWithMeta'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const profileData = {
  id: 'user-1',
  username: 'tester',
  displayName: 'Grüne Gabel',
  bio: 'Ich mag Hafer.',
  createdAt: '2026-09-11T00:00:00.000Z',
}

const mountProfilePublicView = (profile: Partial<ProfileGateway> = {}) =>
  mountView({
    view: ProfilePublicView,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/profile/:id', name: 'profile-public', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
    ],
    initialPath: '/profile/user-1',
    gateways: {
      profile: createFakeProfileGateway({
        fetchPublicProfile: () => Promise.resolve(profileData),
        ...profile,
      }),
    },
    stubs: { StarDisplay: true },
  })

describe('ProfilePublicView', () => {
  describe('given the profile does not exist', () => {
    it('shows a not found message', async () => {
      const { wrapper } = await mountProfilePublicView({
        fetchPublicProfile: () => Promise.resolve(null),
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Profil nicht gefunden.'))
    })
  })

  describe('given loading fails', () => {
    it('shows the error', async () => {
      const { wrapper } = await mountProfilePublicView({
        fetchUserReviews: () => Promise.reject(new Error('offline')),
      })

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('offline'))
    })
  })

  describe('given the profile exists', () => {
    it('shows the name, username, member since date and bio', async () => {
      const { wrapper } = await mountProfilePublicView()

      await vi.waitFor(() => expect(wrapper.text()).toContain('Grüne Gabel'))
      expect(wrapper.text()).toContain('@tester')
      expect(wrapper.text()).toContain('Dabei seit 11. Sept. 2026')
      expect(wrapper.text()).toContain('Ich mag Hafer.')
    })

    it('shows the username as name when there is no display name', async () => {
      const { wrapper } = await mountProfilePublicView({
        fetchPublicProfile: () => Promise.resolve({ ...profileData, displayName: null }),
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('tester'))
      expect(wrapper.text()).not.toContain('@tester')
    })

    it('loads only current reviews and shows the counts', async () => {
      const onlyCurrentFlags: (boolean | undefined)[] = []
      const { wrapper } = await mountProfilePublicView({
        fetchUserReviews: (_userId, onlyCurrent) => {
          onlyCurrentFlags.push(onlyCurrent)
          return Promise.resolve([createReviewWithMeta(), createReviewWithMeta({ id: 'review-2' })])
        },
        fetchUserProducts: () => Promise.resolve([createProduct()]),
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Bewertungen'))
      expect(onlyCurrentFlags).toEqual([true])
      expect(wrapper.text()).toMatch(/2\s*Bewertungen/)
      expect(wrapper.text()).toMatch(/1\s*Produkte/)
    })

    it('shows the reviews first', async () => {
      const { wrapper } = await mountProfilePublicView({
        fetchUserReviews: () => Promise.resolve([createReviewWithMeta({ comment: 'Sehr lecker' })]),
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Sehr lecker'))
      expect(wrapper.text()).toContain('Hafermilch')
    })

    it('shows a hint when there are no reviews', async () => {
      const { wrapper } = await mountProfilePublicView()

      await vi.waitFor(() => expect(wrapper.text()).toContain('Noch keine Bewertungen.'))
    })

    describe('when switching to the products tab', () => {
      it('shows the products with category and brand', async () => {
        const { wrapper } = await mountProfilePublicView({
          fetchUserProducts: () =>
            Promise.resolve([createProduct({ name: 'Mandelmilch', category: 'milk' })]),
        })
        await vi.waitFor(() => expect(wrapper.find('[role="tab"]').exists()).toBe(true))

        await wrapper.get('[role="tab"][aria-label="Produkte"]').trigger('click')

        expect(wrapper.text()).toContain('Mandelmilch')
        expect(wrapper.text()).toMatch(/Milch-Alternative\s*·\s*Alpro/)
      })

      it('shows a hint when there are no products', async () => {
        const { wrapper } = await mountProfilePublicView()
        await vi.waitFor(() => expect(wrapper.find('[role="tab"]').exists()).toBe(true))

        await wrapper.get('[role="tab"][aria-label="Produkte"]').trigger('click')

        expect(wrapper.text()).toContain('Noch keine Produkte hinzugefügt.')
      })
    })
  })
})

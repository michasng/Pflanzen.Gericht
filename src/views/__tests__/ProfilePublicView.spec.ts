import { describe, expect, it, vi } from 'vitest'
import type { ProfileGateway } from '@/services/ProfileGateway'
import ProfilePublicView from '@/views/ProfilePublicView.vue'
import { createFakeProfileGateway } from '@/__tests__/createFakeProfileGateway'
import { createListSummary } from '@/__tests__/createListSummary'
import { createProductWithImages } from '@/__tests__/createProductWithImages'
import { createReviewWithMeta } from '@/__tests__/createReviewWithMeta'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const profileData = {
  id: 'user-1',
  username: 'tester',
  displayName: 'Grüne Gabel',
  bio: 'Ich mag Hafer.',
  createdAt: '2026-09-11T00:00:00.000Z',
}

const mountProfilePublicView = (profile: Partial<ProfileGateway> = {}, search = '') =>
  mountView({
    view: ProfilePublicView,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/profile/:id', name: 'profile-public', component: EmptyRouteComponent },
      { path: '/list/:id', name: 'list', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
    ],
    initialPath: `/profile/user-1${search}`,
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

  describe('given the profile has public lists', () => {
    it('shows only public lists without visibility badges', async () => {
      const onlyPublicFlags: boolean[] = []
      const { wrapper } = await mountProfilePublicView(
        {
          fetchUserLists: (_userId, { onlyPublic }) => {
            onlyPublicFlags.push(onlyPublic)
            return Promise.resolve([createListSummary({ name: 'Favoriten' })])
          },
          countUserLists: (_userId, onlyPublic) => Promise.resolve(onlyPublic ? 1 : 5),
        },
        '?tab=lists',
      )

      await vi.waitFor(() => expect(wrapper.text()).toContain('Favoriten'))
      expect(onlyPublicFlags).toEqual([true])
      expect(wrapper.text()).toMatch(/1\s*Listen/)
      expect(wrapper.text()).not.toContain('Öffentlich')
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

    it('loads only current reviews and shows the totals', async () => {
      const onlyCurrentFlags: boolean[] = []
      const { wrapper } = await mountProfilePublicView({
        fetchUserReviews: (_userId, { onlyCurrent }) => {
          onlyCurrentFlags.push(onlyCurrent)
          return Promise.resolve([createReviewWithMeta(), createReviewWithMeta({ id: 'review-2' })])
        },
        fetchUserProducts: () => Promise.resolve([createProductWithImages()]),
        countCurrentUserReviews: () => Promise.resolve(42),
        countUserProducts: () => Promise.resolve(17),
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Bewertungen'))
      expect(onlyCurrentFlags).toEqual([true])
      expect(wrapper.text()).toMatch(/42\s*Bewertungen/)
      expect(wrapper.text()).toMatch(/17\s*Produkte/)
    })

    describe('given more reviews than fit on a page', () => {
      it('loads the next page on demand', async () => {
        const requestedPages: number[] = []
        const firstPage = Array.from({ length: 20 }, (_, index) =>
          createReviewWithMeta({ id: `review-${index}` }),
        )
        const { wrapper } = await mountProfilePublicView({
          fetchUserReviews: (_userId, { page }) => {
            requestedPages.push(page)
            return Promise.resolve(
              page === 0 ? firstPage : [createReviewWithMeta({ id: 'review-last' })],
            )
          },
        })
        await vi.waitFor(() =>
          expect(wrapper.find('[aria-label="Mehr Bewertungen laden"]').exists()).toBe(true),
        )

        await wrapper.get('[aria-label="Mehr Bewertungen laden"]').trigger('click')

        await vi.waitFor(() => expect(wrapper.findAll('li')).toHaveLength(21))
        expect(requestedPages).toEqual([0, 1])
        expect(wrapper.find('[aria-label="Mehr Bewertungen laden"]').exists()).toBe(false)
      })

      it('shows the error when loading more fails', async () => {
        const firstPage = Array.from({ length: 20 }, (_, index) =>
          createReviewWithMeta({ id: `review-${index}` }),
        )
        const { wrapper } = await mountProfilePublicView({
          fetchUserReviews: (_userId, { page }) =>
            page === 0 ? Promise.resolve(firstPage) : Promise.reject(new Error('offline')),
        })
        await vi.waitFor(() =>
          expect(wrapper.find('[aria-label="Mehr Bewertungen laden"]').exists()).toBe(true),
        )

        await wrapper.get('[aria-label="Mehr Bewertungen laden"]').trigger('click')

        await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('offline'))
        expect(wrapper.findAll('li')).toHaveLength(20)
      })
    })

    describe('given the tab is in the URL', () => {
      it('shows the products tab', async () => {
        const { wrapper } = await mountProfilePublicView(
          {
            fetchUserProducts: () =>
              Promise.resolve([createProductWithImages({ name: 'Mandelmilch' })]),
          },
          '?tab=products',
        )

        await vi.waitFor(() => expect(wrapper.text()).toContain('Mandelmilch'))
      })
    })

    it('keeps the selected tab in the URL', async () => {
      const { wrapper, router } = await mountProfilePublicView()
      await vi.waitFor(() => expect(wrapper.find('[role="tab"]').exists()).toBe(true))

      await wrapper.get('[role="tab"][aria-label="Produkte"]').trigger('click')

      await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('products'))
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
            Promise.resolve([createProductWithImages({ name: 'Mandelmilch', category: 'milk' })]),
        })
        await vi.waitFor(() => expect(wrapper.find('[role="tab"]').exists()).toBe(true))

        await wrapper.get('[role="tab"][aria-label="Produkte"]').trigger('click')

        await vi.waitFor(() => expect(wrapper.text()).toContain('Mandelmilch'))
        expect(wrapper.text()).toMatch(/Milch-Alternative\s*·\s*Alpro/)
      })

      it('shows a hint when there are no products', async () => {
        const { wrapper } = await mountProfilePublicView()
        await vi.waitFor(() => expect(wrapper.find('[role="tab"]').exists()).toBe(true))

        await wrapper.get('[role="tab"][aria-label="Produkte"]').trigger('click')

        await vi.waitFor(() => expect(wrapper.text()).toContain('Noch keine Produkte hinzugefügt.'))
      })
    })
  })
})

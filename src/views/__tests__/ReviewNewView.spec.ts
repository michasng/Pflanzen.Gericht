import { describe, expect, it, vi } from 'vitest'
import type { ReviewEditingGateway } from '@/services/ReviewEditingGateway'
import { useAuthStore } from '@/stores/auth'
import ReviewNewView from '@/views/ReviewNewView.vue'
import ReviewForm, { type ReviewFormValues } from '@/components/ReviewForm.vue'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeReviewEditingGateway } from '@/__tests__/createFakeReviewEditingGateway'
import { createProduct } from '@/__tests__/createProduct'
import { createReviewWithDetails } from '@/__tests__/createReviewWithDetails'
import { createSession } from '@/__tests__/createSession'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const USER_ID = 'user-1'

const formValues: ReviewFormValues = {
  overall: 4,
  taste: 5,
  consistency: null,
  appearance: null,
  value: null,
  comment: 'Lecker',
  tags: ['cremig'],
}

const mountReviewNewView = async (reviewEditing: Partial<ReviewEditingGateway>) => {
  const mounted = await mountView({
    view: ReviewNewView,
    routes: [
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
      { path: '/product/:id/review', name: 'review-new', component: EmptyRouteComponent },
    ],
    initialPath: '/product/product-1/review',
    gateways: {
      reviewEditing: createFakeReviewEditingGateway({
        fetchProduct: () => Promise.resolve(createProduct()),
        ...reviewEditing,
      }),
      auth: createFakeAuthGateway({ getSession: () => Promise.resolve(createSession(USER_ID)) }),
    },
    stubs: { ReviewForm: true },
  })
  await useAuthStore().init()
  return mounted
}

describe('ReviewNewView', () => {
  describe('given the product does not exist', () => {
    it('shows a not found message', async () => {
      const { wrapper } = await mountReviewNewView({ fetchProduct: () => Promise.resolve(null) })

      await vi.waitFor(() =>
        expect(wrapper.get('[role="alert"]').text()).toBe('Produkt nicht gefunden.'),
      )
    })
  })

  describe('given the product loads', () => {
    it('shows the product name and brand in the heading', async () => {
      const { wrapper } = await mountReviewNewView({})

      await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Hafermilch'))
      expect(wrapper.text()).toContain('Bewertung für')
      expect(wrapper.text()).toContain('Alpro')
    })
  })

  describe('when the review is submitted', () => {
    it('creates the review with images and opens the product', async () => {
      const createdTags: string[][] = []
      const uploads: { reviewId: string; sortOrder: number }[] = []
      const { wrapper, router } = await mountReviewNewView({
        createReview: (_productId, _userId, _fields, tags) => {
          createdTags.push(tags)
          return Promise.resolve(createReviewWithDetails({ id: 'new-review' }))
        },
        uploadReviewImage: (reviewId, _userId, _file, sortOrder) => {
          uploads.push({ reviewId, sortOrder })
          return Promise.resolve({
            id: 'image-1',
            reviewId,
            storagePath: 'path',
            sortOrder,
            createdAt: '2026-09-11T00:00:00.000Z',
          })
        },
      })
      const form = await vi.waitFor(() => wrapper.getComponent(ReviewForm))

      form.vm.$emit('filesChanged', [new File(['image'], 'image.png')])
      form.vm.$emit('submit', formValues)

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('product-detail'))
      expect(createdTags).toEqual([['cremig']])
      expect(uploads).toEqual([{ reviewId: 'new-review', sortOrder: 0 }])
    })
  })

  describe('when saving fails', () => {
    it('shows the error and lets the user retry', async () => {
      const { wrapper } = await mountReviewNewView({
        createReview: () => Promise.reject(new Error('offline')),
      })
      const form = await vi.waitFor(() => wrapper.getComponent(ReviewForm))

      form.vm.$emit('submit', formValues)

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('offline'))
      expect(form.props('submitting')).toBe(false)
    })
  })
})

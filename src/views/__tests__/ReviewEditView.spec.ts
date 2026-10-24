import { describe, expect, it, vi } from 'vitest'
import type { ReviewEditingGateway } from '@/services/ReviewEditingGateway'
import { useAuthStore } from '@/stores/auth'
import ReviewEditView from '@/views/ReviewEditView.vue'
import ReviewForm, { type ReviewFormValues } from '@/components/ReviewForm.vue'
import { createDeferred, type Deferred } from '@/__tests__/createDeferred'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeReviewEditingGateway } from '@/__tests__/createFakeReviewEditingGateway'
import { createProduct } from '@/__tests__/createProduct'
import { createProfile } from '@/__tests__/createProfile'
import { createReviewWithDetails } from '@/__tests__/createReviewWithDetails'
import { createSession } from '@/__tests__/createSession'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const AUTHOR_ID = 'user-1'
const OTHER_USER_ID = 'user-2'

const formValues: ReviewFormValues = {
  overall: 3,
  taste: null,
  consistency: null,
  appearance: null,
  value: null,
  comment: null,
  tags: ['süß'],
}

interface MountOptions {
  signedInUserId: string
  isAdmin?: boolean
  reviewEditing?: Partial<ReviewEditingGateway>
}

// The view decides about access while loading, so loading waits for the signed-in user.
const gateUntilAuthReady = (
  gateway: ReviewEditingGateway,
  authReady: Deferred<void>,
): ReviewEditingGateway => ({
  ...gateway,
  fetchReviewForEdit: (reviewId) =>
    authReady.promise.then(() => gateway.fetchReviewForEdit(reviewId)),
})

const mountReviewEditView = async ({
  signedInUserId,
  isAdmin = false,
  reviewEditing = {},
}: MountOptions) => {
  const authReady = createDeferred<void>()
  const mounted = await mountView({
    view: ReviewEditView,
    routes: [
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
      {
        path: '/product/:id/review/:reviewId/edit',
        name: 'review-edit',
        component: EmptyRouteComponent,
      },
    ],
    initialPath: '/product/product-1/review/review-1/edit',
    gateways: {
      reviewEditing: gateUntilAuthReady(
        createFakeReviewEditingGateway({
          fetchReviewForEdit: () =>
            Promise.resolve(createReviewWithDetails({ userId: AUTHOR_ID, tags: ['cremig'] })),
          fetchProduct: () => Promise.resolve(createProduct()),
          ...reviewEditing,
        }),
        authReady,
      ),
      auth: createFakeAuthGateway({
        getSession: () => Promise.resolve(createSession(signedInUserId)),
        fetchProfile: () => Promise.resolve(createProfile({ id: signedInUserId, isAdmin })),
      }),
    },
    stubs: { ReviewForm: true },
  })
  await useAuthStore().init()
  authReady.resolve()
  return mounted
}

describe('ReviewEditView', () => {
  describe('given the review does not exist', () => {
    it('shows a not found message', async () => {
      const { wrapper } = await mountReviewEditView({
        signedInUserId: AUTHOR_ID,
        reviewEditing: { fetchReviewForEdit: () => Promise.resolve(null) },
      })

      await vi.waitFor(() =>
        expect(wrapper.get('[role="alert"]').text()).toBe('Bewertung nicht gefunden.'),
      )
    })
  })

  describe('given the user is neither author nor admin', () => {
    it('redirects to the product', async () => {
      const { router } = await mountReviewEditView({ signedInUserId: OTHER_USER_ID })

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('product-detail'))
    })
  })

  describe('given the user is the author', () => {
    it('shows the heading and fills the form with the review', async () => {
      const { wrapper } = await mountReviewEditView({ signedInUserId: AUTHOR_ID })

      const form = await vi.waitFor(() => wrapper.getComponent(ReviewForm))

      expect(wrapper.get('h1').text()).toBe('Hafermilch')
      expect(wrapper.text()).toContain('Bewertung bearbeiten für')
      expect(form.props('initial')).toMatchObject({ overall: 4, tags: ['cremig'] })
    })

    it('saves the review and opens the product', async () => {
      const updates: { reviewId: string; tags: string[] }[] = []
      const { wrapper, router } = await mountReviewEditView({
        signedInUserId: AUTHOR_ID,
        reviewEditing: {
          updateReview: (reviewId, _fields, tags) => {
            updates.push({ reviewId, tags })
            return Promise.resolve()
          },
        },
      })
      const form = await vi.waitFor(() => wrapper.getComponent(ReviewForm))

      form.vm.$emit('submit', formValues)

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('product-detail'))
      expect(updates).toEqual([{ reviewId: 'review-1', tags: ['süß'] }])
    })

    it('shows the error when saving fails', async () => {
      const { wrapper } = await mountReviewEditView({
        signedInUserId: AUTHOR_ID,
        reviewEditing: { updateReview: () => Promise.reject(new Error('offline')) },
      })
      const form = await vi.waitFor(() => wrapper.getComponent(ReviewForm))

      form.vm.$emit('submit', formValues)

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('offline'))
      expect(form.props('submitting')).toBe(false)
    })
  })

  describe('given an admin who is not the author', () => {
    it('offers the product images for copying', async () => {
      const productImage = {
        id: 'image-1',
        productId: 'product-1',
        storagePath: 'path',
        sortOrder: 0,
        createdAt: '2026-09-11T00:00:00.000Z',
      }
      const { wrapper } = await mountReviewEditView({
        signedInUserId: OTHER_USER_ID,
        isAdmin: true,
        reviewEditing: { fetchProductImages: () => Promise.resolve([productImage]) },
      })

      const form = await vi.waitFor(() => wrapper.getComponent(ReviewForm))

      expect(form.props('imageCopySources')).toEqual([{ label: 'Produkt', images: [productImage] }])
    })
  })
})

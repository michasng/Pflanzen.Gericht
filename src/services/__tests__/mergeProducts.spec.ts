import { describe, expect, it } from 'vitest'
import { mergeProducts, type MergeProductsInput } from '../mergeProducts'
import type { ProductMergeGateway } from '../ProductMergeGateway'
import type {
  PriceReport,
  Product,
  ProductImage,
  ProductSimilarityVote,
  ReviewImage,
} from '@/types'
import type { ReviewWithDetails } from '../reviews'

const MERGED_ID = 'merged'
const MERGED_PRODUCT: Product = {
  allergens: [],
  avg_overall: null,
  barcode: null,
  base: null,
  brand: null,
  category: 'drink',
  created_at: '2026-01-01T00:00:00Z',
  created_by: 'owner',
  description: null,
  energy_joules: null,
  id: MERGED_ID,
  is_organic: false,
  min_price_euro_cents: null,
  name: 'Merged',
  normalized_name: 'merged',
  reviews_count: 0,
  tags: [],
  updated_at: '2026-01-01T00:00:00Z',
}

const buildReview = (overrides: Partial<ReviewWithDetails>): ReviewWithDetails => ({
  appearance: null,
  comment: null,
  consistency: null,
  created_at: '2026-01-01T00:00:00Z',
  id: 'review',
  images: [],
  is_current: true,
  nutrition: null,
  overall: 4,
  product_id: 'a',
  taste: null,
  tags: [],
  updated_at: '2026-01-01T00:00:00Z',
  user_id: 'user-1',
  value: null,
  ...overrides,
})

const buildPriceReport = (overrides: Partial<PriceReport>): PriceReport => ({
  city_name: 'Berlin',
  created_at: '2026-01-01T00:00:00Z',
  effective_price_euro_cents: 100,
  id: 'report',
  observed_at: '2026-01-01',
  price_euro_cents: 100,
  product_id: 'a',
  sale_price_euro_cents: null,
  store: 'Rewe',
  user_id: 'user-1',
  ...overrides,
})

const buildVote = (overrides: Partial<ProductSimilarityVote>): ProductSimilarityVote => ({
  agreed: true,
  created_at: '2026-01-01T00:00:00Z',
  id: 'vote',
  product_id_a: 'a',
  product_id_b: 'x',
  updated_at: '2026-01-01T00:00:00Z',
  user_id: 'user-1',
  ...overrides,
})

const buildImage = (id: string): ProductImage => ({
  created_at: '2026-01-01T00:00:00Z',
  id,
  product_id: 'a',
  sort_order: 0,
  storage_path: `user/a/${id}`,
})

const buildReviewImage = (id: string): ReviewImage => ({
  created_at: '2026-01-01T00:00:00Z',
  id,
  review_id: 'new',
  sort_order: 0,
  storage_path: `user/new/${id}`,
})

interface FakeData {
  reviews: ReviewWithDetails[]
  priceReports: PriceReport[]
  votes: ProductSimilarityVote[]
}

const buildFakeGateway = (data: FakeData, failingStep?: keyof ProductMergeGateway) => {
  const calls: string[] = []
  const createdNames: string[] = []
  const updatedFields: string[] = []
  const createdReviews: { createdAt: string | undefined; tags: string[] }[] = []
  const copiedReviewImageIds: string[] = []
  const upsertedPriceReports: (string | undefined)[][] = []
  const votes: (string | undefined)[][] = []
  const copiedImages: { image: ProductImage; ownerId: string; sortOrder: number }[] = []
  const record = async (step: keyof ProductMergeGateway, detail = ''): Promise<void> => {
    calls.push(`${step}${detail}`)
    if (step === failingStep) throw new Error(`${step} failed`)
  }
  const gateway: ProductMergeGateway = {
    createProduct: async (fields, ownerId) => {
      await record('createProduct', `:${ownerId}`)
      createdNames.push(fields.name)
      return { ...MERGED_PRODUCT }
    },
    updateProduct: async (id, fields) => {
      await record('updateProduct', `:${id}`)
      updatedFields.push(fields.name)
    },
    replaceIngredients: (_id, _ingredients) => record('replaceIngredients'),
    replaceNutrients: (_id, _nutrients) => record('replaceNutrients'),
    copyImage: async (image, _productId, ownerId, sortOrder) => {
      await record('copyImage')
      copiedImages.push({ image, ownerId, sortOrder })
    },
    fetchReviews: async (id) => data.reviews.filter((review) => review.product_id === id),
    createReview: async (_productId, _userId, _fields, tags, history) => {
      await record('createReview')
      createdReviews.push({ createdAt: history?.created_at, tags })
      return buildReview({ id: `copy-${createdReviews.length}` })
    },
    copyReviewImage: async (image) => {
      await record('copyReviewImage')
      copiedReviewImageIds.push(image.id)
    },
    fetchPriceReports: async (id) =>
      data.priceReports
        .filter((r) => r.product_id === id)
        .map((r) => ({ ...r, profile: { username: 'user', display_name: null } })),
    upsertPriceReport: async (
      _productId,
      _userId,
      _store,
      _city,
      _price,
      _sale,
      observedAt,
      createdAt,
    ) => {
      await record('upsertPriceReport')
      upsertedPriceReports.push([observedAt, createdAt])
    },
    fetchSimilarityVotes: async (id) =>
      data.votes.filter((vote) => vote.product_id_a === id || vote.product_id_b === id),
    voteSimilarity: async (productId, otherProductId, _agreed, _userId, history) => {
      await record('voteSimilarity')
      votes.push([productId, otherProductId, history?.created_at])
    },
    deleteProduct: (id) => record('deleteProduct', `:${id}`),
  }
  return {
    gateway,
    calls,
    createdNames,
    updatedFields,
    createdReviews,
    copiedReviewImageIds,
    upsertedPriceReports,
    votes,
    copiedImages,
  }
}

const input: MergeProductsInput = {
  productIds: ['a', 'b'],
  ownerId: 'owner',
  acceptedImages: [buildImage('one'), buildImage('two')],
  values: {
    name: 'Merged',
    category: 'drink',
    base: null,
    brand: null,
    description: null,
    energyJoules: null,
    allergens: [],
    isOrganic: false,
    barcode: null,
    ingredients: [],
    nutrients: [],
  },
}

const emptyData: FakeData = { reviews: [], priceReports: [], votes: [] }

describe('mergeProducts', () => {
  describe('given reviews, price reports and votes on both products', () => {
    it('combines them and deletes the originals last', async () => {
      const fake = buildFakeGateway({
        reviews: [
          buildReview({ id: 'old', product_id: 'a' }),
          buildReview({
            id: 'new',
            product_id: 'b',
            created_at: '2026-05-01T00:00:00Z',
            tags: ['sweet'],
            images: [buildReviewImage('photo')],
          }),
        ],
        priceReports: [
          buildPriceReport({ id: 'old', product_id: 'a' }),
          buildPriceReport({
            id: 'new',
            product_id: 'b',
            observed_at: '2026-05-01',
            created_at: '2026-05-02T00:00:00Z',
          }),
        ],
        votes: [
          buildVote({ id: 'self', product_id_a: 'a', product_id_b: 'b' }),
          buildVote({
            id: 'kept',
            product_id_a: 'a',
            product_id_b: 'x',
            created_at: '2026-03-01T00:00:00Z',
          }),
        ],
      })

      await mergeProducts(fake.gateway, input)

      expect(fake.createdReviews).toEqual([
        { createdAt: '2026-01-01T00:00:00Z', tags: [] },
        { createdAt: '2026-05-01T00:00:00Z', tags: ['sweet'] },
      ])
      expect(fake.copiedReviewImageIds).toEqual(['photo'])
      expect(fake.upsertedPriceReports).toEqual([['2026-05-01', '2026-05-02T00:00:00Z']])
      expect(fake.votes).toEqual([[MERGED_ID, 'x', '2026-03-01T00:00:00Z']])
      expect(fake.calls.slice(-3, -1)).toEqual(['deleteProduct:a', 'deleteProduct:b'])
      expect(fake.calls).not.toContain(`deleteProduct:${MERGED_ID}`)
    })
  })

  describe('given the final name could collide with an original', () => {
    it('creates with a temporary name and renames after deleting the originals', async () => {
      const fake = buildFakeGateway(emptyData)

      await mergeProducts(fake.gateway, input)

      expect(fake.createdNames).not.toContain(input.values.name)
      expect(fake.updatedFields).toEqual([input.values.name])
      expect(fake.calls.slice(-3)).toEqual([
        'deleteProduct:a',
        'deleteProduct:b',
        `updateProduct:${MERGED_ID}`,
      ])
    })
  })

  describe('given accepted images', () => {
    it('copies each one for the owner in order', async () => {
      const fake = buildFakeGateway(emptyData)

      await mergeProducts(fake.gateway, input)

      expect(
        fake.copiedImages.map(({ image, ownerId, sortOrder }) => [image.id, ownerId, sortOrder]),
      ).toEqual([
        ['one', 'owner', 0],
        ['two', 'owner', 1],
      ])
    })
  })

  describe.each([
    'replaceIngredients',
    'copyImage',
    'createReview',
    'upsertPriceReport',
    'voteSimilarity',
  ] as const)('given %s fails', (failingStep) => {
    it('deletes only the merged product and rethrows', async () => {
      const fake = buildFakeGateway(
        {
          reviews: [buildReview({})],
          priceReports: [buildPriceReport({})],
          votes: [buildVote({})],
        },
        failingStep,
      )

      await expect(mergeProducts(fake.gateway, input)).rejects.toThrow(`${failingStep} failed`)

      expect(fake.calls.filter((call) => call.startsWith('deleteProduct'))).toEqual([
        `deleteProduct:${MERGED_ID}`,
      ])
    })
  })

  describe('given the rollback itself fails', () => {
    it('still surfaces the original error', async () => {
      const fake = buildFakeGateway(emptyData, 'copyImage')
      fake.gateway.deleteProduct = () => Promise.reject(new Error('cleanup failed'))

      await expect(mergeProducts(fake.gateway, input)).rejects.toThrow('copyImage failed')
    })
  })

  describe('given deleting an original fails', () => {
    it('keeps the merged product and rethrows', async () => {
      const fake = buildFakeGateway(emptyData, 'deleteProduct')

      await expect(mergeProducts(fake.gateway, input)).rejects.toThrow('deleteProduct failed')

      expect(fake.calls).not.toContain(`deleteProduct:${MERGED_ID}`)
    })
  })
})

import { describe, expect, it } from 'vitest'
import { mergeProducts, type MergeProductsInput } from '../mergeProducts'
import type { MergedProductFields, ProductMergeGateway } from '../ProductMergeGateway'
import type {
  PriceReport,
  Product,
  ProductImage,
  ProductSimilarityVote,
  ReviewImage,
} from '@/types'
import { QuantityUnit } from '@/config/quantity'
import type { ReviewWithDetails } from '../reviews'

const MERGED_ID = 'merged'
const MERGED_PRODUCT: Product = {
  allergens: [],
  avgOverall: null,
  barcode: null,
  base: null,
  brand: 'Alpro',
  category: 'drink',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'owner',
  description: null,
  energyJoules: null,
  id: MERGED_ID,
  isOrganic: false,
  minPriceEuroCents: null,
  name: 'Merged',
  quantityUnit: 'piece',
  quantityValue: 1,
  normalizedName: 'merged',
  reviewsCount: 0,
  tags: [],
  updatedAt: '2026-01-01T00:00:00Z',
}

const buildReview = (overrides: Partial<ReviewWithDetails>): ReviewWithDetails => ({
  appearance: null,
  comment: null,
  consistency: null,
  createdAt: '2026-01-01T00:00:00Z',
  id: 'review',
  images: [],
  isCurrent: true,
  nutrition: null,
  overall: 4,
  productId: 'a',
  taste: null,
  tags: [],
  updatedAt: '2026-01-01T00:00:00Z',
  userId: 'user-1',
  value: null,
  ...overrides,
})

const buildPriceReport = (overrides: Partial<PriceReport>): PriceReport => ({
  cityName: 'Berlin',
  createdAt: '2026-01-01T00:00:00Z',
  effectivePriceEuroCents: 100,
  id: 'report',
  observedAt: '2026-01-01',
  priceEuroCents: 100,
  productId: 'a',
  salePriceEuroCents: null,
  store: 'Rewe',
  userId: 'user-1',
  ...overrides,
})

const buildVote = (overrides: Partial<ProductSimilarityVote>): ProductSimilarityVote => ({
  agreed: true,
  createdAt: '2026-01-01T00:00:00Z',
  id: 'vote',
  productIdA: 'a',
  productIdB: 'x',
  updatedAt: '2026-01-01T00:00:00Z',
  userId: 'user-1',
  ...overrides,
})

const buildImage = (id: string): ProductImage => ({
  createdAt: '2026-01-01T00:00:00Z',
  id,
  productId: 'a',
  sortOrder: 0,
  storagePath: `user/a/${id}`,
})

const buildReviewImage = (id: string): ReviewImage => ({
  createdAt: '2026-01-01T00:00:00Z',
  id,
  reviewId: 'new',
  sortOrder: 0,
  storagePath: `user/new/${id}`,
})

interface FakeData {
  reviews: ReviewWithDetails[]
  priceReports: PriceReport[]
  votes: ProductSimilarityVote[]
}

const buildFakeGateway = (data: FakeData, failingStep?: keyof ProductMergeGateway) => {
  const calls: string[] = []
  const createdNames: string[] = []
  const createdProductFields: MergedProductFields[] = []
  const updatedProductFields: MergedProductFields[] = []
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
      createdProductFields.push(fields)
      return { ...MERGED_PRODUCT }
    },
    updateProduct: async (id, fields) => {
      await record('updateProduct', `:${id}`)
      updatedFields.push(fields.name)
      updatedProductFields.push(fields)
    },
    replaceIngredients: (_id, _ingredients) => record('replaceIngredients'),
    replaceNutrients: (_id, _nutrients) => record('replaceNutrients'),
    replaceSources: (_id, _urls) => record('replaceSources'),
    copyImage: async (image, _productId, ownerId, sortOrder) => {
      await record('copyImage')
      copiedImages.push({ image, ownerId, sortOrder })
    },
    fetchReviews: async (id) => data.reviews.filter((review) => review.productId === id),
    createReview: async (_productId, _userId, _fields, tags, history) => {
      await record('createReview')
      createdReviews.push({ createdAt: history?.createdAt, tags })
      return buildReview({ id: `copy-${createdReviews.length}` })
    },
    copyReviewImage: async (image) => {
      await record('copyReviewImage')
      copiedReviewImageIds.push(image.id)
    },
    fetchPriceReports: async (id) =>
      data.priceReports
        .filter((r) => r.productId === id)
        .map((r) => ({ ...r, profile: { username: 'user', displayName: null } })),
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
      data.votes.filter((vote) => vote.productIdA === id || vote.productIdB === id),
    voteSimilarity: async (productId, otherProductId, _agreed, _userId, history) => {
      await record('voteSimilarity')
      votes.push([productId, otherProductId, history?.createdAt])
    },
    deleteProduct: (id) => record('deleteProduct', `:${id}`),
  }
  return {
    gateway,
    calls,
    createdNames,
    createdProductFields,
    updatedProductFields,
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
    brand: 'Alpro',
    description: null,
    energyJoules: null,
    allergens: [],
    isOrganic: false,
    barcode: null,
    quantityUnit: QuantityUnit.Milliliter,
    quantityValue: 1500,
    ingredients: [],
    nutrients: [],
    sourceUrls: [],
  },
}

const emptyData: FakeData = { reviews: [], priceReports: [], votes: [] }

describe('mergeProducts', () => {
  describe('given reviews, price reports and votes on both products', () => {
    it('combines them and deletes the originals last', async () => {
      const fake = buildFakeGateway({
        reviews: [
          buildReview({ id: 'old', productId: 'a' }),
          buildReview({
            id: 'new',
            productId: 'b',
            createdAt: '2026-05-01T00:00:00Z',
            tags: ['sweet'],
            images: [buildReviewImage('photo')],
          }),
        ],
        priceReports: [
          buildPriceReport({ id: 'old', productId: 'a' }),
          buildPriceReport({
            id: 'new',
            productId: 'b',
            observedAt: '2026-05-01',
            createdAt: '2026-05-02T00:00:00Z',
          }),
        ],
        votes: [
          buildVote({ id: 'self', productIdA: 'a', productIdB: 'b' }),
          buildVote({
            id: 'kept',
            productIdA: 'a',
            productIdB: 'x',
            createdAt: '2026-03-01T00:00:00Z',
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
      expect(fake.createdProductFields[0]).toMatchObject({
        quantityUnit: input.values.quantityUnit,
        quantityValue: input.values.quantityValue,
      })
      expect(fake.updatedProductFields[0]).toMatchObject({
        quantityUnit: input.values.quantityUnit,
        quantityValue: input.values.quantityValue,
      })
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

import { describe, expect, it } from 'vitest'
import type { TablesInsert } from '@/types/database'
import {
  createSimilarProductsService,
  MAX_SIMILARITY_CANDIDATES,
  type CandidateImageRow,
  type CandidateProductRow,
  type SimilarProductsDependencies,
} from '../similarProducts'

const PRODUCT_ID_A = 'a-product-id'
const PRODUCT_ID_B = 'b-product-id'
const PRODUCT_ID_C = 'c-product-id'
const USER_ID = 'user-id'
const CATEGORY = 'Milchalternative'
const SOURCE_PRODUCT = { id: PRODUCT_ID_A, category: CATEGORY }

const createService = () => {
  const rpcCalls: Array<{ productId: string }> = []
  const searchCalls: Array<{ search: string; category: string; limit: number }> = []
  const imageCalls: string[][] = []
  const upsertCalls: Array<{
    options: { onConflict: string }
    vote: TablesInsert<'product_similarity_vote'>
  }> = []
  const matchCalls: Array<{ product_id_a: string; product_id_b: string; user_id?: string }> = []

  let fetchRows: Array<{
    agree_count: number
    agreement_rate: number
    allergens: string[] | null
    avg_overall: number | null
    avg_taste: number | null
    avg_consistency: number | null
    avg_appearance: number | null
    avg_nutrition: number | null
    avg_value: number | null
    base: string | null
    brand: string | null
    category: string
    id: string
    is_organic: boolean
    my_vote: boolean | null
    name: string
    reviews_count: number
    storage_path: string | null
    total_count: number
  }> | null = null
  let searchRows: CandidateProductRow[] | null = null
  let imageRows: CandidateImageRow[] | null = null

  const dependencies: SimilarProductsDependencies = {
    deleteVote: async (query) => {
      matchCalls.push(query)
      return { error: null }
    },
    fetchProductImages: async (productIds) => {
      imageCalls.push(productIds)
      return { data: imageRows, error: null }
    },
    fetchSimilarProductsRpc: async (productId) => {
      rpcCalls.push({ productId })
      return { data: fetchRows, error: null }
    },
    searchProductsRpc: async (query) => {
      searchCalls.push(query)
      return { data: searchRows, error: null }
    },
    upsertVote: async (vote, options) => {
      upsertCalls.push({ options, vote })
      return { error: null }
    },
  }

  return {
    imageCalls,
    matchCalls,
    rpcCalls,
    searchCalls,
    service: createSimilarProductsService(dependencies),
    setFetchRows: (rows: typeof fetchRows) => {
      fetchRows = rows
    },
    setImageRows: (rows: CandidateImageRow[] | null) => {
      imageRows = rows
    },
    setSearchRows: (rows: CandidateProductRow[] | null) => {
      searchRows = rows
    },
    upsertCalls,
  }
}

describe('createSimilarProductsService', () => {
  it('given similar products rpc data, when fetching, returns normalized values', async () => {
    const { service, setFetchRows, rpcCalls } = createService()
    setFetchRows([
      {
        agree_count: 3,
        agreement_rate: 0.6,
        allergens: null,
        avg_overall: null,
        avg_taste: null,
        avg_consistency: null,
        avg_appearance: null,
        avg_nutrition: null,
        avg_value: null,
        base: null,
        brand: null,
        category: 'Milchalternative',
        id: PRODUCT_ID_B,
        is_organic: true,
        my_vote: null,
        name: 'Sojadrink',
        reviews_count: 12,
        storage_path: null,
        total_count: 5,
      },
    ])

    const result = await service.fetchSimilarProducts(PRODUCT_ID_A)

    expect(rpcCalls).toEqual([{ productId: PRODUCT_ID_A }])
    expect(result).toEqual([
      {
        agreeCount: 3,
        agreementRate: 0.6,
        allergens: [],
        avgOverall: null,
        avgTaste: null,
        avgConsistency: null,
        avgAppearance: null,
        avgNutrition: null,
        avgValue: null,
        base: null,
        brand: null,
        category: 'Milchalternative',
        id: PRODUCT_ID_B,
        isOrganic: true,
        myVote: null,
        name: 'Sojadrink',
        reviewsCount: 12,
        storagePath: null,
        totalCount: 5,
      },
    ])
  })

  it('given blank search, when searching candidates, skips rpc call', async () => {
    const { searchCalls, service } = createService()

    const result = await service.searchSimilarityCandidates(SOURCE_PRODUCT, '   ')

    expect(result).toEqual([])
    expect(searchCalls).toEqual([])
  })

  it('given search text, when searching candidates, searches within the category', async () => {
    const { searchCalls, service } = createService()

    await service.searchSimilarityCandidates(SOURCE_PRODUCT, 'Hafer')

    expect(searchCalls).toEqual([
      { search: 'Hafer', category: CATEGORY, limit: MAX_SIMILARITY_CANDIDATES + 1 },
    ])
  })

  it('given matches including the product itself, when searching candidates, returns only other products with their cover image', async () => {
    const { service, setImageRows, setSearchRows } = createService()
    setSearchRows([
      { brand: 'Oatly', category: CATEGORY, id: PRODUCT_ID_A, name: 'Haferdrink' },
      { brand: 'Alpro', category: CATEGORY, id: PRODUCT_ID_B, name: 'Haferdrink Barista' },
      { brand: null, category: CATEGORY, id: PRODUCT_ID_C, name: 'Hafermilch' },
    ])
    setImageRows([
      { product_id: PRODUCT_ID_B, storage_path: 'b-cover' },
      { product_id: PRODUCT_ID_B, storage_path: 'b-second' },
    ])

    const result = await service.searchSimilarityCandidates(SOURCE_PRODUCT, 'Hafer')

    expect(result).toEqual([
      {
        brand: 'Alpro',
        category: CATEGORY,
        id: PRODUCT_ID_B,
        name: 'Haferdrink Barista',
        storagePath: 'b-cover',
      },
      {
        brand: null,
        category: CATEGORY,
        id: PRODUCT_ID_C,
        name: 'Hafermilch',
        storagePath: null,
      },
    ])
  })

  it('given more matches than the maximum, when searching candidates, returns only the maximum', async () => {
    const { imageCalls, service, setSearchRows } = createService()
    setSearchRows(
      Array.from({ length: MAX_SIMILARITY_CANDIDATES + 1 }, (_, index) => ({
        brand: null,
        category: CATEGORY,
        id: `candidate-${index}`,
        name: `Hafer ${index}`,
      })),
    )

    const result = await service.searchSimilarityCandidates(SOURCE_PRODUCT, 'Hafer')

    expect(result).toHaveLength(MAX_SIMILARITY_CANDIDATES)
    expect(imageCalls[0]).toHaveLength(MAX_SIMILARITY_CANDIDATES)
  })

  it('given only the product itself matches, when searching candidates, skips image lookup', async () => {
    const { imageCalls, service, setSearchRows } = createService()
    setSearchRows([{ brand: 'Oatly', category: CATEGORY, id: PRODUCT_ID_A, name: 'Haferdrink' }])

    const result = await service.searchSimilarityCandidates(SOURCE_PRODUCT, 'Hafer')

    expect(result).toEqual([])
    expect(imageCalls).toEqual([])
  })

  it('given two different products, when voting, upserts canonical pair', async () => {
    const { service, upsertCalls } = createService()

    await service.voteSimilarity(PRODUCT_ID_B, PRODUCT_ID_A, true, USER_ID)

    expect(upsertCalls).toEqual([
      {
        vote: {
          agreed: true,
          product_id_a: PRODUCT_ID_A,
          product_id_b: PRODUCT_ID_B,
          user_id: USER_ID,
        },
        options: { onConflict: 'product_id_a,product_id_b,user_id' },
      },
    ])
  })

  it('given identical products, when voting, throws and skips persistence', async () => {
    const { service, upsertCalls } = createService()

    await expect(service.voteSimilarity(PRODUCT_ID_A, PRODUCT_ID_A, true, USER_ID)).rejects.toThrow(
      'Ein Produkt kann nicht mit sich selbst verknüpft werden.',
    )
    expect(upsertCalls).toEqual([])
  })

  it('given a vote exists, when removing own vote, deletes canonical pair with user id', async () => {
    const { matchCalls, service } = createService()

    await service.removeSimilarityVote(PRODUCT_ID_B, PRODUCT_ID_A, USER_ID)

    expect(matchCalls).toEqual([
      { product_id_a: PRODUCT_ID_A, product_id_b: PRODUCT_ID_B, user_id: USER_ID },
    ])
  })

  it('given a similarity exists, when admin removes it, deletes canonical pair', async () => {
    const { matchCalls, service } = createService()

    await service.adminRemoveSimilarity(PRODUCT_ID_B, PRODUCT_ID_A)

    expect(matchCalls).toEqual([{ product_id_a: PRODUCT_ID_A, product_id_b: PRODUCT_ID_B }])
  })
})

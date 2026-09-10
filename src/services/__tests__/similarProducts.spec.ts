import { describe, expect, it } from 'vitest'
import type { ProductSimilarityVoteInsert } from '@/types'
import {
  createSimilarProductsService,
  type SimilarProductsDependencies,
  type SimilarityCandidate,
} from '../similarProducts'

const PRODUCT_ID_A = 'a-product-id'
const PRODUCT_ID_B = 'b-product-id'
const USER_ID = 'user-id'

const createService = () => {
  const rpcCalls: Array<{ productId: string; search?: string }> = []
  const upsertCalls: Array<{
    options: { onConflict: string }
    vote: ProductSimilarityVoteInsert
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
    ratings_count: number
    storage_path: string | null
    total_count: number
  }> | null = null
  let searchRows: SimilarityCandidate[] | null = null

  const dependencies: SimilarProductsDependencies = {
    deleteVote: async (query) => {
      matchCalls.push(query)
      return { error: null }
    },
    fetchSimilarProductsRpc: async (productId) => {
      rpcCalls.push({ productId })
      return { data: fetchRows, error: null }
    },
    searchSimilarityCandidatesRpc: async (productId, search) => {
      rpcCalls.push({ productId, search })
      return { data: searchRows, error: null }
    },
    upsertVote: async (vote, options) => {
      upsertCalls.push({ options, vote })
      return { error: null }
    },
  }

  return {
    matchCalls,
    rpcCalls,
    service: createSimilarProductsService(dependencies),
    setFetchRows: (rows: typeof fetchRows) => {
      fetchRows = rows
    },
    setSearchRows: (rows: SimilarityCandidate[] | null) => {
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
        ratings_count: 12,
        storage_path: null,
        total_count: 5,
      },
    ])

    const result = await service.fetchSimilarProducts(PRODUCT_ID_A)

    expect(rpcCalls).toEqual([{ productId: PRODUCT_ID_A }])
    expect(result).toEqual([
      {
        agree_count: 3,
        agreement_rate: 0.6,
        allergens: [],
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
        ratings_count: 12,
        storage_path: null,
        total_count: 5,
      },
    ])
  })

  it('given blank search, when searching candidates, skips rpc call', async () => {
    const { rpcCalls, service } = createService()

    const result = await service.searchSimilarityCandidates(PRODUCT_ID_A, '   ')

    expect(result).toEqual([])
    expect(rpcCalls).toEqual([])
  })

  it('given search text, when searching candidates, calls rpc', async () => {
    const { service, setSearchRows, rpcCalls } = createService()
    setSearchRows([
      {
        brand: null,
        category: 'Milchalternative',
        id: PRODUCT_ID_B,
        name: 'Haferdrink',
        storage_path: null,
      },
    ])

    const result = await service.searchSimilarityCandidates(PRODUCT_ID_A, 'Hafer')

    expect(rpcCalls).toEqual([
      {
        productId: PRODUCT_ID_A,
        search: 'Hafer',
      },
    ])
    expect(result).toEqual([
      {
        brand: null,
        category: 'Milchalternative',
        id: PRODUCT_ID_B,
        name: 'Haferdrink',
        storage_path: null,
      },
    ])
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

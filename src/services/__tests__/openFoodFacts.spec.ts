import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchOpenFoodFactsProduct } from '../openFoodFacts'

describe('fetchOpenFoodFactsProduct', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('given the response body is not valid json, throws a user-facing error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          new Response('not-json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )

    await expect(fetchOpenFoodFactsProduct('4006381333931')).rejects.toThrow(
      'Produktdaten konnten nicht verarbeitet werden. Bitte versuche es später erneut.',
    )
  })

  it('given the response shape does not match the api contract, throws a user-facing error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              status: '1',
              product: [],
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        ),
      ),
    )

    await expect(fetchOpenFoodFactsProduct('4006381333931')).rejects.toThrow(
      'Produktdaten konnten nicht verarbeitet werden. Bitte versuche es später erneut.',
    )
  })

  it('given the response is valid, returns the product data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              status: 1,
              product: {
                product_name: 'Soja Drink',
                nutriments: {
                  calcium_100g: 120,
                  calcium_unit: 'mg',
                },
              },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        ),
      ),
    )

    await expect(fetchOpenFoodFactsProduct('4006381333931')).resolves.toEqual({
      product_name: 'Soja Drink',
      nutriments: {
        calcium_100g: 120,
        calcium_unit: 'mg',
      },
    })
  })
})

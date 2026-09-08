import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchOpenFoodFactsProduct, fetchOpenFoodFactsProductImage } from '../openFoodFacts'

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

describe('fetchOpenFoodFactsProductImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('given the image request fails, throws a user-facing error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.reject(new Error('network'))),
    )

    await expect(
      fetchOpenFoodFactsProductImage('https://example.com/soja-drink.jpg'),
    ).rejects.toThrow('Produktbild konnte nicht abgerufen werden.')
  })

  it('given the image response is not ok, throws a user-facing error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 404 }))),
    )

    await expect(
      fetchOpenFoodFactsProductImage('https://example.com/soja-drink.jpg'),
    ).rejects.toThrow('Produktbild konnte nicht abgerufen werden.')
  })

  it('given the image url is not http or https, throws a user-facing error', async () => {
    await expect(
      fetchOpenFoodFactsProductImage('ftp://example.com/soja-drink.jpg'),
    ).rejects.toThrow('Produktbild konnte nicht abgerufen werden.')
  })

  it('given the image response is not an image, throws a user-facing error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          new Response('not-image', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }),
        ),
      ),
    )

    await expect(
      fetchOpenFoodFactsProductImage('https://example.com/soja-drink.jpg'),
    ).rejects.toThrow('Produktbild konnte nicht abgerufen werden.')
  })

  it('given the image request succeeds, returns a file named after the url path', async () => {
    const imageBlob = new Blob(['data'], { type: 'image/jpeg' })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          new Response(imageBlob, {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' },
          }),
        ),
      ),
    )

    const file = await fetchOpenFoodFactsProductImage(
      'https://example.com/soja-drink.jpg?rev=1#thumbnail',
    )

    expect(file.name).toBe('soja-drink.jpg')
    expect(file.type).toBe('image/jpeg')
  })
})

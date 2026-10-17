import { describe, expect, it } from 'vitest'
import { createApp, type InjectionKey } from 'vue'
import { injectGateway } from '@/composables/injectGateway'

interface FakeGateway {
  name: string
}

const fakeGatewayKey: InjectionKey<FakeGateway> = Symbol('fakeGateway')

describe('injectGateway', () => {
  describe('given the gateway was provided at app level', () => {
    it('returns it', () => {
      const gateway: FakeGateway = { name: 'fake' }
      const app = createApp({})
      app.provide(fakeGatewayKey, gateway)

      const injected = app.runWithContext(() => injectGateway(fakeGatewayKey))

      expect(injected).toBe(gateway)
    })
  })

  describe('given nothing was provided', () => {
    it('throws an error naming the gateway', () => {
      const app = createApp({})

      expect(() => app.runWithContext(() => injectGateway(fakeGatewayKey))).toThrow(
        new Error('No gateway provided for fakeGateway.'),
      )
    })
  })
})

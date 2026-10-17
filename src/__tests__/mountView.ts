import { defineComponent, type Component } from 'vue'
import { createPinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type RouteRecordRaw, type Router } from 'vue-router'
import { adminGatewayKey } from '@/services/adminGatewayKey'
import { authGatewayKey } from '@/services/authGatewayKey'
import { productDetailGatewayKey } from '@/services/productDetailGatewayKey'
import type { AdminGateway } from '@/services/AdminGateway'
import type { AuthGateway } from '@/services/AuthGateway'
import type { ProductDetailGateway } from '@/services/ProductDetailGateway'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'

export const EmptyRouteComponent = defineComponent({ render: () => null })

interface FakeGateways {
  admin?: AdminGateway
  auth?: AuthGateway
  productDetail?: ProductDetailGateway
}

interface MountViewOptions {
  view: Component
  routes: RouteRecordRaw[]
  initialPath: string
  gateways?: FakeGateways
  stubs?: Record<string, boolean>
}

interface MountedView {
  wrapper: VueWrapper
  router: Router
}

export const mountView = async ({
  view,
  routes,
  initialPath,
  gateways = {},
  stubs,
}: MountViewOptions): Promise<MountedView> => {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(initialPath)

  const provide: Record<symbol, unknown> = {
    [authGatewayKey]: gateways.auth ?? createFakeAuthGateway(),
  }
  if (gateways.admin) provide[adminGatewayKey] = gateways.admin
  if (gateways.productDetail) provide[productDetailGatewayKey] = gateways.productDetail

  const wrapper = mount(view, { global: { plugins: [createPinia(), router], provide, stubs } })
  return { wrapper, router }
}

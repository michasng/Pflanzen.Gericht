import { defineComponent, type Component } from 'vue'
import { createPinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type RouteRecordRaw, type Router } from 'vue-router'
import { adminGatewayKey, type AdminGateway } from '@/services/AdminGateway'
import { authGatewayKey, type AuthGateway } from '@/services/AuthGateway'
import { catalogGatewayKey, type CatalogGateway } from '@/services/CatalogGateway'
import { imageUrlGatewayKey, type ImageUrlGateway } from '@/services/ImageUrlGateway'
import {
  nameSuggestionGatewayKey,
  type NameSuggestionGateway,
} from '@/services/NameSuggestionGateway'
import { productDetailGatewayKey, type ProductDetailGateway } from '@/services/ProductDetailGateway'
import {
  productEditingGatewayKey,
  type ProductEditingGateway,
} from '@/services/ProductEditingGateway'
import { profileGatewayKey, type ProfileGateway } from '@/services/ProfileGateway'
import { reviewEditingGatewayKey, type ReviewEditingGateway } from '@/services/ReviewEditingGateway'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeImageUrlGateway } from '@/__tests__/createFakeImageUrlGateway'
import { createFakeNameSuggestionGateway } from '@/__tests__/createFakeNameSuggestionGateway'

export const EmptyRouteComponent = defineComponent({ render: () => null })

interface FakeGateways {
  admin?: AdminGateway
  auth?: AuthGateway
  catalog?: CatalogGateway
  imageUrl?: ImageUrlGateway
  nameSuggestion?: NameSuggestionGateway
  productDetail?: ProductDetailGateway
  productEditing?: ProductEditingGateway
  profile?: ProfileGateway
  reviewEditing?: ReviewEditingGateway
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
    [imageUrlGatewayKey]: gateways.imageUrl ?? createFakeImageUrlGateway(),
    [nameSuggestionGatewayKey]: gateways.nameSuggestion ?? createFakeNameSuggestionGateway(),
  }
  if (gateways.admin) provide[adminGatewayKey] = gateways.admin
  if (gateways.catalog) provide[catalogGatewayKey] = gateways.catalog
  if (gateways.productDetail) provide[productDetailGatewayKey] = gateways.productDetail
  if (gateways.productEditing) provide[productEditingGatewayKey] = gateways.productEditing
  if (gateways.profile) provide[profileGatewayKey] = gateways.profile
  if (gateways.reviewEditing) provide[reviewEditingGatewayKey] = gateways.reviewEditing

  const wrapper = mount(view, { global: { plugins: [createPinia(), router], provide, stubs } })
  return { wrapper, router }
}

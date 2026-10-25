import { defineComponent, type Component } from 'vue'
import { createPinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type RouteRecordRaw, type Router } from 'vue-router'
import { adminGatewayKey, type AdminGateway } from '@/services/AdminGateway'
import { authGatewayKey, type AuthGateway } from '@/services/AuthGateway'
import { catalogGatewayKey, type CatalogGateway } from '@/services/CatalogGateway'
import { imageUrlGatewayKey, type ImageUrlGateway } from '@/services/ImageUrlGateway'
import { listGatewayKey, type ListGateway } from '@/services/ListGateway'
import {
  nameSuggestionGatewayKey,
  type NameSuggestionGateway,
} from '@/services/NameSuggestionGateway'
import { openFoodFactsGatewayKey, type OpenFoodFactsGateway } from '@/services/OpenFoodFactsGateway'
import { productDetailGatewayKey, type ProductDetailGateway } from '@/services/ProductDetailGateway'
import {
  productEditingGatewayKey,
  type ProductEditingGateway,
} from '@/services/ProductEditingGateway'
import { profileGatewayKey, type ProfileGateway } from '@/services/ProfileGateway'
import { reviewEditingGatewayKey, type ReviewEditingGateway } from '@/services/ReviewEditingGateway'
import {
  similarProductsGatewayKey,
  type SimilarProductsGateway,
} from '@/services/SimilarProductsGateway'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeImageUrlGateway } from '@/__tests__/createFakeImageUrlGateway'
import { createFakeNameSuggestionGateway } from '@/__tests__/createFakeNameSuggestionGateway'
import { createFakeOpenFoodFactsGateway } from '@/__tests__/createFakeOpenFoodFactsGateway'

export const EmptyRouteComponent = defineComponent({ render: () => null })

interface FakeGateways {
  admin?: AdminGateway
  auth?: AuthGateway
  catalog?: CatalogGateway
  imageUrl?: ImageUrlGateway
  list?: ListGateway
  nameSuggestion?: NameSuggestionGateway
  openFoodFacts?: OpenFoodFactsGateway
  productDetail?: ProductDetailGateway
  productEditing?: ProductEditingGateway
  profile?: ProfileGateway
  reviewEditing?: ReviewEditingGateway
  similarProducts?: SimilarProductsGateway
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
    [openFoodFactsGatewayKey]: gateways.openFoodFacts ?? createFakeOpenFoodFactsGateway(),
  }
  if (gateways.admin) provide[adminGatewayKey] = gateways.admin
  if (gateways.catalog) provide[catalogGatewayKey] = gateways.catalog
  if (gateways.list) provide[listGatewayKey] = gateways.list
  if (gateways.productDetail) provide[productDetailGatewayKey] = gateways.productDetail
  if (gateways.productEditing) provide[productEditingGatewayKey] = gateways.productEditing
  if (gateways.profile) provide[profileGatewayKey] = gateways.profile
  if (gateways.reviewEditing) provide[reviewEditingGatewayKey] = gateways.reviewEditing
  if (gateways.similarProducts) provide[similarProductsGatewayKey] = gateways.similarProducts

  const wrapper = mount(view, { global: { plugins: [createPinia(), router], provide, stubs } })
  return { wrapper, router }
}

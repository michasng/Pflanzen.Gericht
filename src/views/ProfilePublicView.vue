<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  fetchPublicProfile,
  fetchUserReviews,
  fetchUserProducts,
  type PublicProfile,
  type ReviewWithMeta,
} from '@/services/profile'
import type { Product } from '@/types'
import StarDisplay from '@/components/StarDisplay.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import TagList from '@/components/TagList.vue'
import TabButton from '@/components/primitives/TabButton.vue'
import Card from '@/components/primitives/CardComponent.vue'
import { categoryToLabel } from '@/config/categories'
import { toErrorMessage } from '@/lib/error'
import { formatDate } from '@/lib/date'

const route = useRoute()

const profile = ref<PublicProfile | null>(null)
const reviews = ref<ReviewWithMeta[]>([])
const products = ref<Product[]>([])
const loading = ref(true)
const notFound = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'reviews' | 'products'>('reviews')

onMounted(async () => {
  const userId = route.params.id as string
  try {
    const p = await fetchPublicProfile(userId)
    if (!p) {
      notFound.value = true
      return
    }
    profile.value = p
    const [r, prods] = await Promise.all([
      fetchUserReviews(userId, true),
      fetchUserProducts(userId),
    ])
    reviews.value = r
    products.value = prods
  } catch (err) {
    error.value = toErrorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-lg mx-auto space-y-4">
    <div v-if="loading" class="py-20 text-center text-gray-400 text-sm">Wird geladen …</div>

    <div v-else-if="notFound" class="py-20 text-center">
      <p class="font-semibold text-gray-600 mb-2">Profil nicht gefunden.</p>
      <RouterLink :to="{ name: 'home' }" class="text-sm text-primary-600 hover:underline">
        Zur Startseite
      </RouterLink>
    </div>

    <AlertMessage v-else-if="error" :message="error" />

    <template v-else-if="profile">
      <div class="flex items-center gap-4 pt-2">
        <div
          class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold shrink-0"
          aria-hidden="true"
        >
          {{ profile.username.charAt(0).toUpperCase() }}
        </div>
        <div class="min-w-0">
          <p class="font-bold text-gray-900 text-lg leading-tight truncate">
            {{ profile.display_name || profile.username }}
          </p>
          <p v-if="profile.display_name" class="text-sm text-gray-500 truncate">
            @{{ profile.username }}
          </p>
          <p class="text-xs text-gray-400 mt-0.5">
            Dabei seit {{ formatDate(profile.created_at) }}
          </p>
        </div>
      </div>

      <p v-if="profile.bio" class="text-sm text-gray-600">{{ profile.bio }}</p>

      <div class="flex gap-6 py-3 border-t border-b border-gray-100">
        <div class="text-center">
          <p class="text-xl font-bold text-gray-900">{{ reviews.length }}</p>
          <p class="text-xs text-gray-500">Bewertungen</p>
        </div>
        <div class="text-center">
          <p class="text-xl font-bold text-gray-900">{{ products.length }}</p>
          <p class="text-xs text-gray-500">Produkte</p>
        </div>
      </div>

      <div role="tablist" class="flex border-b border-gray-200 -mx-4 px-4">
        <TabButton
          ariaLabel="Bewertungen"
          :active="activeTab === 'reviews'"
          @click="activeTab = 'reviews'"
        >
          Bewertungen
        </TabButton>
        <TabButton
          ariaLabel="Produkte"
          :active="activeTab === 'products'"
          @click="activeTab = 'products'"
        >
          Produkte
        </TabButton>
      </div>

      <template v-if="activeTab === 'reviews'">
        <p v-if="reviews.length === 0" class="py-12 text-center text-gray-400 text-sm">
          Noch keine Bewertungen.
        </p>
        <ul v-else class="space-y-3">
          <li v-for="review in reviews" :key="review.id">
            <Card>
              <RouterLink
                :to="{ name: 'product-detail', params: { id: review.product.id } }"
                class="font-semibold text-gray-900 hover:text-primary-600 transition-colors leading-tight block mb-2"
              >
                {{ review.product.name }}
              </RouterLink>

              <div class="flex items-center gap-2 mb-2">
                <StarDisplay :value="review.overall" />
                <span class="text-xs text-gray-400">{{ formatDate(review.created_at) }}</span>
              </div>

              <TagList :tags="review.tags" class="mb-2" />

              <p v-if="review.comment" class="text-sm text-gray-600 mb-2 line-clamp-2">
                {{ review.comment }}
              </p>
            </Card>
          </li>
        </ul>
      </template>

      <template v-else>
        <p v-if="products.length === 0" class="py-12 text-center text-gray-400 text-sm">
          Noch keine Produkte hinzugefügt.
        </p>
        <ul v-else class="space-y-2">
          <li v-for="product in products" :key="product.id">
            <Card>
              <RouterLink
                :to="{ name: 'product-detail', params: { id: product.id } }"
                class="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {{ product.name }}
              </RouterLink>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ categoryToLabel(product.category) }}
                <span v-if="product.brand"> · {{ product.brand }}</span>
              </p>
            </Card>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>

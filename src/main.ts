import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { adminGatewayKey } from '@/services/AdminGateway'
import { authGatewayKey } from '@/services/AuthGateway'
import { catalogGatewayKey } from '@/services/CatalogGateway'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'
import { nameSuggestionGatewayKey } from '@/services/NameSuggestionGateway'
import { openFoodFactsGatewayKey } from '@/services/OpenFoodFactsGateway'
import { productDetailGatewayKey } from '@/services/ProductDetailGateway'
import { productEditingGatewayKey } from '@/services/ProductEditingGateway'
import { profileGatewayKey } from '@/services/ProfileGateway'
import { reviewEditingGatewayKey } from '@/services/ReviewEditingGateway'
import { similarProductsGatewayKey } from '@/services/SimilarProductsGateway'
import { httpOpenFoodFactsGateway } from '@/services/httpOpenFoodFactsGateway'
import { supabaseAdminGateway } from '@/services/supabaseAdminGateway'
import { supabaseAuthGateway } from '@/services/supabaseAuthGateway'
import { supabaseCatalogGateway } from '@/services/supabaseCatalogGateway'
import { supabaseImageUrlGateway } from '@/services/supabaseImageUrlGateway'
import { supabaseNameSuggestionGateway } from '@/services/supabaseNameSuggestionGateway'
import { supabaseProductDetailGateway } from '@/services/supabaseProductDetailGateway'
import { supabaseProductEditingGateway } from '@/services/supabaseProductEditingGateway'
import { supabaseProfileGateway } from '@/services/supabaseProfileGateway'
import { supabaseReviewEditingGateway } from '@/services/supabaseReviewEditingGateway'
import { supabaseSimilarProductsGateway } from '@/services/supabaseSimilarProductsGateway'

const app = createApp(App)
const pinia = createPinia()

app.provide(adminGatewayKey, supabaseAdminGateway)
app.provide(authGatewayKey, supabaseAuthGateway)
app.provide(catalogGatewayKey, supabaseCatalogGateway)
app.provide(imageUrlGatewayKey, supabaseImageUrlGateway)
app.provide(nameSuggestionGatewayKey, supabaseNameSuggestionGateway)
app.provide(openFoodFactsGatewayKey, httpOpenFoodFactsGateway)
app.provide(productDetailGatewayKey, supabaseProductDetailGateway)
app.provide(productEditingGatewayKey, supabaseProductEditingGateway)
app.provide(profileGatewayKey, supabaseProfileGateway)
app.provide(reviewEditingGatewayKey, supabaseReviewEditingGateway)
app.provide(similarProductsGatewayKey, supabaseSimilarProductsGateway)

app.use(pinia)
app.use(router)

const authStore = useAuthStore()
await authStore.init()

app.mount('#app')

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { adminGatewayKey } from '@/services/AdminGateway'
import { authGatewayKey } from '@/services/AuthGateway'
import { productDetailGatewayKey } from '@/services/ProductDetailGateway'
import { productEditingGatewayKey } from '@/services/ProductEditingGateway'
import { profileGatewayKey } from '@/services/ProfileGateway'
import { reviewEditingGatewayKey } from '@/services/ReviewEditingGateway'
import { supabaseAdminGateway } from '@/services/supabaseAdminGateway'
import { supabaseAuthGateway } from '@/services/supabaseAuthGateway'
import { supabaseProductDetailGateway } from '@/services/supabaseProductDetailGateway'
import { supabaseProductEditingGateway } from '@/services/supabaseProductEditingGateway'
import { supabaseProfileGateway } from '@/services/supabaseProfileGateway'
import { supabaseReviewEditingGateway } from '@/services/supabaseReviewEditingGateway'

const app = createApp(App)
const pinia = createPinia()

app.provide(adminGatewayKey, supabaseAdminGateway)
app.provide(authGatewayKey, supabaseAuthGateway)
app.provide(productDetailGatewayKey, supabaseProductDetailGateway)
app.provide(productEditingGatewayKey, supabaseProductEditingGateway)
app.provide(profileGatewayKey, supabaseProfileGateway)
app.provide(reviewEditingGatewayKey, supabaseReviewEditingGateway)

app.use(pinia)
app.use(router)

const authStore = useAuthStore()
await authStore.init()

app.mount('#app')

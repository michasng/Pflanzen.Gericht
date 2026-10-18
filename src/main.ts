import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { adminGatewayKey } from '@/services/adminGatewayKey'
import { authGatewayKey } from '@/services/authGatewayKey'
import { productDetailGatewayKey } from '@/services/productDetailGatewayKey'
import { productEditingGatewayKey } from '@/services/productEditingGatewayKey'
import { profileGatewayKey } from '@/services/profileGatewayKey'
import { reviewEditingGatewayKey } from '@/services/reviewEditingGatewayKey'
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

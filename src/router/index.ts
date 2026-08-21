import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          // Static segment before dynamic — matched first
          path: 'produkt/neu',
          name: 'product-new',
          component: () => import('@/views/ProductNewView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'produkt/:id',
          name: 'product-detail',
          component: () => import('@/views/ProductDetailView.vue'),
        },
        {
          path: 'produkt/:id/bearbeiten',
          name: 'product-edit',
          component: () => import('@/views/ProductEditView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'produkt/:id/bewerten',
          name: 'rating-new',
          component: () => import('@/views/RatingNewView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'profil',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'profil/:id',
          name: 'profile-public',
          component: () => import('@/views/ProfilePublicView.vue'),
        },
        {
          path: 'admin',
          name: 'admin',
          component: () => import('@/views/AdminView.vue'),
          meta: { requiresAuth: true, requiresAdmin: true },
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
    {
      path: '/registrieren',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
    },
    {
      path: '/passwort-vergessen',
      name: 'password-forgot',
      component: () => import('@/views/auth/PasswordForgotView.vue'),
    },
    {
      path: '/passwort-neu',
      name: 'password-new',
      component: () => import('@/views/auth/PasswordNewView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router

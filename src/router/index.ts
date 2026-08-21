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
          // Static segment matched before dynamic segment
          path: 'product/new',
          name: 'product-new',
          component: () => import('@/views/ProductNewView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'product/:id',
          name: 'product-detail',
          component: () => import('@/views/ProductDetailView.vue'),
        },
        {
          path: 'product/:id/edit',
          name: 'product-edit',
          component: () => import('@/views/ProductEditView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'product/:id/rate',
          name: 'rating-new',
          component: () => import('@/views/RatingNewView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'profile/:id',
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
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
    },
    {
      path: '/password-forgot',
      name: 'password-forgot',
      component: () => import('@/views/auth/PasswordForgotView.vue'),
    },
    {
      path: '/password-new',
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

  if (to.meta.requiresAdmin) {
    const { data: profileData } = await supabase
      .from('profile')
      .select('is_admin')
      .eq('id', data.session.user.id)
      .single()
    if (!profileData?.is_admin) return { name: 'home' }
  }

  return true
})

export default router

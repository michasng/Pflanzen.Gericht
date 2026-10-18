import { describe, expect, it } from 'vitest'
import type { AuthGateway } from '@/services/AuthGateway'
import LoginView from '@/views/auth/LoginView.vue'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const mountLoginView = (auth: AuthGateway, initialPath = '/login') =>
  mountView({
    view: LoginView,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/login', name: 'login', component: EmptyRouteComponent },
      { path: '/register', name: 'register', component: EmptyRouteComponent },
      { path: '/password-forgot', name: 'password-forgot', component: EmptyRouteComponent },
      { path: '/profile', name: 'profile', component: EmptyRouteComponent },
    ],
    initialPath,
    gateways: { auth },
  })

describe('LoginView', () => {
  describe('when signing in', () => {
    it('sends the entered credentials and goes home', async () => {
      const credentials: string[] = []
      const { wrapper, router } = await mountLoginView(
        createFakeAuthGateway({
          signIn: (email, password) => {
            credentials.push(email, password)
            return Promise.resolve({ session: null })
          },
        }),
      )

      await wrapper.find('#email').setValue('a@b.de')
      await wrapper.find('#password').setValue('secret')
      await wrapper.find('form').trigger('submit')

      await expect.poll(() => router.currentRoute.value.name).toBe('home')
      expect(credentials).toEqual(['a@b.de', 'secret'])
    })
  })

  describe('given the user came from a protected page', () => {
    it('goes back to that page after signing in', async () => {
      const { wrapper, router } = await mountLoginView(
        createFakeAuthGateway(),
        '/login?redirect=/profile',
      )

      await wrapper.find('form').trigger('submit')

      await expect.poll(() => router.currentRoute.value.path).toBe('/profile')
    })
  })

  describe('given signing in fails', () => {
    it('shows the error', async () => {
      const { wrapper } = await mountLoginView(
        createFakeAuthGateway({ signIn: () => Promise.reject(new Error('wrong password')) }),
      )

      await wrapper.find('form').trigger('submit')

      await expect.poll(() => wrapper.find('[role="alert"]').text()).toBe('wrong password')
    })
  })

  describe('when looking at the page', () => {
    it('links home, to registration and to password reset', async () => {
      const { wrapper } = await mountLoginView(createFakeAuthGateway())

      const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))

      expect(hrefs).toEqual(['/', '/password-forgot', '/register'])
    })
  })
})

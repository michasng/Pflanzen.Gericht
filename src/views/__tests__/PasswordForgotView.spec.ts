import { describe, expect, it } from 'vitest'
import type { AuthGateway } from '@/services/AuthGateway'
import PasswordForgotView from '@/views/auth/PasswordForgotView.vue'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const mountPasswordForgotView = (auth: AuthGateway) =>
  mountView({
    view: PasswordForgotView,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/login', name: 'login', component: EmptyRouteComponent },
      { path: '/password-forgot', name: 'password-forgot', component: EmptyRouteComponent },
    ],
    initialPath: '/password-forgot',
    gateways: { auth },
  })

describe('PasswordForgotView', () => {
  describe('when requesting a reset link', () => {
    it('sends the email and confirms it', async () => {
      const emails: string[] = []
      const { wrapper } = await mountPasswordForgotView(
        createFakeAuthGateway({
          resetPassword: (email) => {
            emails.push(email)
            return Promise.resolve()
          },
        }),
      )

      await wrapper.find('#email').setValue('a@b.de')
      await wrapper.find('form').trigger('submit')

      await expect.poll(() => wrapper.text()).toContain('E-Mail gesendet')
      expect(emails).toEqual(['a@b.de'])
      expect(wrapper.find('form').exists()).toBe(false)
    })
  })

  describe('given the request fails', () => {
    it('shows the error and keeps the form', async () => {
      const { wrapper } = await mountPasswordForgotView(
        createFakeAuthGateway({ resetPassword: () => Promise.reject(new Error('rate limited')) }),
      )

      await wrapper.find('form').trigger('submit')

      await expect.poll(() => wrapper.find('[role="alert"]').text()).toBe('rate limited')
      expect(wrapper.find('form').exists()).toBe(true)
    })
  })

  describe('when looking at the page', () => {
    it('links home and back to the login', async () => {
      const { wrapper } = await mountPasswordForgotView(createFakeAuthGateway())

      const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))

      expect(hrefs).toEqual(['/', '/login'])
    })
  })
})

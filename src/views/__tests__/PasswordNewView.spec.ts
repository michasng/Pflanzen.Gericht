import { describe, expect, it } from 'vitest'
import type { AuthGateway } from '@/services/AuthGateway'
import PasswordNewView from '@/views/auth/PasswordNewView.vue'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const mountPasswordNewView = (auth: AuthGateway) =>
  mountView({
    view: PasswordNewView,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/password-new', name: 'password-new', component: EmptyRouteComponent },
    ],
    initialPath: '/password-new',
    gateways: { auth },
  })

describe('PasswordNewView', () => {
  describe('given the passwords differ', () => {
    it('shows an error and does not update the password', async () => {
      const updated: string[] = []
      const { wrapper } = await mountPasswordNewView(
        createFakeAuthGateway({
          updatePassword: (password) => {
            updated.push(password)
            return Promise.resolve()
          },
        }),
      )

      await wrapper.find('#password').setValue('password-one')
      await wrapper.find('#password-confirm').setValue('password-two')
      await wrapper.find('form').trigger('submit')

      await expect.poll(() => wrapper.find('[role="alert"]').text()).toContain('stimmen nicht')
      expect(updated).toEqual([])
    })
  })

  describe('given the password is too short', () => {
    it('shows an error', async () => {
      const { wrapper } = await mountPasswordNewView(createFakeAuthGateway())

      await wrapper.find('#password').setValue('short')
      await wrapper.find('#password-confirm').setValue('short')
      await wrapper.find('form').trigger('submit')

      await expect.poll(() => wrapper.find('[role="alert"]').text()).toContain('mindestens 8')
    })
  })

  describe('when saving a valid password', () => {
    it('updates the password and goes home', async () => {
      const updated: string[] = []
      const { wrapper, router } = await mountPasswordNewView(
        createFakeAuthGateway({
          updatePassword: (password) => {
            updated.push(password)
            return Promise.resolve()
          },
        }),
      )

      await wrapper.find('#password').setValue('long-enough')
      await wrapper.find('#password-confirm').setValue('long-enough')
      await wrapper.find('form').trigger('submit')

      await expect.poll(() => router.currentRoute.value.name).toBe('home')
      expect(updated).toEqual(['long-enough'])
    })
  })

  describe('given saving fails', () => {
    it('shows the error', async () => {
      const { wrapper } = await mountPasswordNewView(
        createFakeAuthGateway({ updatePassword: () => Promise.reject(new Error('expired')) }),
      )

      await wrapper.find('#password').setValue('long-enough')
      await wrapper.find('#password-confirm').setValue('long-enough')
      await wrapper.find('form').trigger('submit')

      await expect.poll(() => wrapper.find('[role="alert"]').text()).toBe('expired')
    })
  })
})

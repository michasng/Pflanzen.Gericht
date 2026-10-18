import { describe, expect, it } from 'vitest'
import type { AuthGateway } from '@/services/AuthGateway'
import RegisterView from '@/views/auth/RegisterView.vue'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const mountRegisterView = (auth: AuthGateway) =>
  mountView({
    view: RegisterView,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/login', name: 'login', component: EmptyRouteComponent },
      { path: '/register', name: 'register', component: EmptyRouteComponent },
    ],
    initialPath: '/register',
    gateways: { auth },
  })

describe('RegisterView', () => {
  describe('when typing a display name', () => {
    it('suggests a username', async () => {
      const { wrapper } = await mountRegisterView(createFakeAuthGateway())

      await wrapper.find('#displayName').setValue('Grüne Gabel')

      expect(wrapper.find<HTMLInputElement>('#username').element.value).toBe('gruene_gabel')
    })

    it('keeps an edited username', async () => {
      const { wrapper } = await mountRegisterView(createFakeAuthGateway())

      await wrapper.find('#username').setValue('mine')
      await wrapper.find('#displayName').setValue('Grüne Gabel')

      expect(wrapper.find<HTMLInputElement>('#username').element.value).toBe('mine')
    })
  })

  describe('given an invalid username', () => {
    it('shows the format hint', async () => {
      const { wrapper } = await mountRegisterView(createFakeAuthGateway())

      await wrapper.find('#username').setValue('A!')

      expect(wrapper.find('[role="alert"]').text()).toContain('Nur Kleinbuchstaben')
    })
  })

  describe('given the username is taken', () => {
    it('shows that it is taken', async () => {
      const { wrapper } = await mountRegisterView(
        createFakeAuthGateway({ isUsernameAvailable: () => Promise.resolve(false) }),
      )

      await wrapper.find('#username').setValue('taken_name')

      await expect.poll(() => wrapper.text()).toContain('bereits vergeben')
    })
  })

  describe('given the passwords differ', () => {
    it('shows an error and does not sign up', async () => {
      const signUps: string[] = []
      const { wrapper } = await mountRegisterView(
        createFakeAuthGateway({
          signUp: (email) => {
            signUps.push(email)
            return Promise.resolve({ session: null })
          },
        }),
      )

      await wrapper.find('#username').setValue('valid_name')
      await wrapper.find('#password').setValue('password-one')
      await wrapper.find('#password-confirm').setValue('password-two')
      await wrapper.find('form').trigger('submit')

      await expect.poll(() => wrapper.text()).toContain('stimmen nicht')
      expect(signUps).toEqual([])
    })
  })

  describe('given the password is too short', () => {
    it('shows an error', async () => {
      const { wrapper } = await mountRegisterView(createFakeAuthGateway())

      await wrapper.find('#username').setValue('valid_name')
      await wrapper.find('#password').setValue('short')
      await wrapper.find('#password-confirm').setValue('short')
      await wrapper.find('form').trigger('submit')

      await expect.poll(() => wrapper.text()).toContain('mindestens 8')
    })
  })

  describe('when registering and email confirmation is needed', () => {
    it('sends the entered data and asks to check the email', async () => {
      const signUps: string[][] = []
      const { wrapper } = await mountRegisterView(
        createFakeAuthGateway({
          signUp: (...args) => {
            signUps.push(args)
            return Promise.resolve({ session: null })
          },
        }),
      )

      await wrapper.find('#displayName').setValue(' Grüne Gabel ')
      await wrapper.find('#username').setValue('gabel')
      await wrapper.find('#email').setValue('a@b.de')
      await wrapper.find('#password').setValue('long-enough')
      await wrapper.find('#password-confirm').setValue('long-enough')
      await wrapper.find('form').trigger('submit')

      await expect.poll(() => wrapper.text()).toContain('Fast geschafft!')
      expect(signUps).toEqual([['a@b.de', 'long-enough', 'gabel', 'Grüne Gabel']])
      expect(wrapper.text()).toContain('a@b.de')
    })
  })

  describe('given signing up fails', () => {
    it('shows the error', async () => {
      const { wrapper } = await mountRegisterView(
        createFakeAuthGateway({ signUp: () => Promise.reject(new Error('already registered')) }),
      )

      await wrapper.find('#username').setValue('valid_name')
      await wrapper.find('#password').setValue('long-enough')
      await wrapper.find('#password-confirm').setValue('long-enough')
      await wrapper.find('form').trigger('submit')

      await expect.poll(() => wrapper.text()).toContain('already registered')
    })
  })
})

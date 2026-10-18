import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { authGatewayKey, type AuthGateway } from '@/services/AuthGateway'
import UsernameField from '@/components/UsernameField.vue'
import { USERNAME_CHECK_DEBOUNCE_MILLISECONDS } from '@/composables/useUsernameAvailability'
import { createDeferred } from '@/__tests__/createDeferred'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'

const mountField = (auth: AuthGateway) =>
  mount(UsernameField, {
    props: {
      modelValue: '',
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
    global: { provide: { [authGatewayKey as symbol]: auth } },
  })

let wrapper: ReturnType<typeof mountField>

describe('UsernameField', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('given an invalid username', () => {
    it('shows the format hint', async () => {
      wrapper = mountField(createFakeAuthGateway())

      await wrapper.find('input').setValue('A!')

      expect(wrapper.find('[role="alert"]').text()).toContain('Nur Kleinbuchstaben')
    })
  })

  describe('given the username is taken', () => {
    it('shows that it is taken and reports it as unavailable', async () => {
      wrapper = mountField(
        createFakeAuthGateway({ isUsernameAvailable: () => Promise.resolve(false) }),
      )

      await wrapper.find('input').setValue('taken_name')
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)

      expect(wrapper.find('[role="alert"]').text()).toContain('bereits vergeben')
      expect(wrapper.emitted('update:available')?.pop()).toEqual([false])
    })
  })

  describe('given the username is free', () => {
    it('shows a checkmark', async () => {
      wrapper = mountField(createFakeAuthGateway())

      await wrapper.find('input').setValue('free_name')
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)

      expect(wrapper.text()).toContain('✓')
    })
  })

  describe('while the check is pending', () => {
    it('shows the checking indicator', async () => {
      const pending = createDeferred<boolean>()
      wrapper = mountField(createFakeAuthGateway({ isUsernameAvailable: () => pending.promise }))

      await wrapper.find('input').setValue('valid_name')

      expect(wrapper.text()).toContain('…')
    })
  })

  describe('given the check fails', () => {
    it('shows the error instead of the checking indicator', async () => {
      wrapper = mountField(
        createFakeAuthGateway({ isUsernameAvailable: () => Promise.reject(new Error('offline')) }),
      )

      await wrapper.find('input').setValue('valid_name')
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)

      expect(wrapper.find('[role="alert"]').text()).toBe('offline')
      expect(wrapper.text()).not.toContain('…')
    })
  })

  describe('when the user types', () => {
    it('emits edit', async () => {
      wrapper = mountField(createFakeAuthGateway())

      await wrapper.find('input').setValue('abc')

      expect(wrapper.emitted('edit')).toHaveLength(1)
    })
  })
})

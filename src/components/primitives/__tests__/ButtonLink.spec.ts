import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { EmptyRouteComponent } from '@/__tests__/mountView'
import ButtonLink from '../ButtonLink.vue'
import ButtonComponent from '../ButtonComponent.vue'
import { ButtonSize } from '../ButtonSize'
import { ButtonTone } from '../ButtonTone'
import { ButtonVariant } from '../ButtonVariant'

const mountButtonLink = async (props: Record<string, unknown> = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/target', name: 'target', component: EmptyRouteComponent }],
  })
  await router.push('/target')
  return mount(ButtonLink, {
    props: { to: { name: 'target' }, ...props },
    slots: { default: 'Go' },
    global: { plugins: [router] },
  })
}

describe('ButtonLink', () => {
  it('renders a link to the target with its content', async () => {
    const wrapper = await mountButtonLink()

    expect(wrapper.get('a').attributes('href')).toBe('/target')
    expect(wrapper.text()).toBe('Go')
  })

  it('looks like a Button with the same variant, size and tone', async () => {
    const style = {
      variant: ButtonVariant.Outlined,
      size: ButtonSize.Large,
      tone: ButtonTone.Danger,
      fullWidth: true,
    }
    const wrapper = await mountButtonLink(style)
    const button = mount(ButtonComponent, { props: { ...style, ariaLabel: 'Go' } })

    expect(wrapper.get('a').classes()).toEqual(expect.arrayContaining(button.classes()))
  })
})

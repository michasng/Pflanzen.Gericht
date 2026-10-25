import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { ListVisibility } from '@/config/ListVisibility'
import type { ListGateway } from '@/services/ListGateway'
import { useAuthStore } from '@/stores/auth'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeListGateway } from '@/__tests__/createFakeListGateway'
import { createFakeProfileGateway } from '@/__tests__/createFakeProfileGateway'
import { createListSummary } from '@/__tests__/createListSummary'
import { createProfile } from '@/__tests__/createProfile'
import { createSession } from '@/__tests__/createSession'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'
import ListView from '@/views/ListView.vue'

const OWNER_ID = 'user-1'

const owner = {
  id: OWNER_ID,
  username: 'tester',
  displayName: 'Grüne Gabel',
  bio: null,
  createdAt: '2026-09-11T00:00:00.000Z',
}

const SignedInHost = defineComponent({
  setup: () => {
    const authStore = useAuthStore()
    const ready = ref(false)
    void authStore.init().then(() => {
      ready.value = true
    })
    return () => (ready.value ? h(ListView) : null)
  },
})

const mountListView = async (list: Partial<ListGateway>, viewerId: string | null = OWNER_ID) => {
  const mounted = await mountView({
    view: SignedInHost,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/profile', name: 'profile', component: EmptyRouteComponent },
      { path: '/profile/:id', name: 'profile-public', component: EmptyRouteComponent },
      { path: '/list/:id', name: 'list', component: EmptyRouteComponent },
    ],
    initialPath: '/list/list-1',
    gateways: {
      list: createFakeListGateway({
        fetchList: () => Promise.resolve(createListSummary({ visibility: ListVisibility.Private })),
        ...list,
      }),
      profile: createFakeProfileGateway({ fetchPublicProfile: () => Promise.resolve(owner) }),
      auth: createFakeAuthGateway({
        getSession: () => Promise.resolve(viewerId ? createSession(viewerId) : null),
        fetchProfile: () => Promise.resolve(createProfile({})),
      }),
    },
  })
  await vi.waitFor(() => expect(mounted.wrapper.find('h1, [role="alert"]').exists()).toBe(true))
  return mounted
}

describe('ListView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('given the list cannot be seen', () => {
    it('shows not found', async () => {
      const { wrapper } = await mountView({
        view: ListView,
        routes: [
          { path: '/', name: 'home', component: EmptyRouteComponent },
          { path: '/list/:id', name: 'list', component: EmptyRouteComponent },
        ],
        initialPath: '/list/list-1',
        gateways: { list: createFakeListGateway(), profile: createFakeProfileGateway() },
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Liste nicht gefunden.'))
    })
  })

  describe('given the viewer owns the list', () => {
    it('shows name, visibility and the way to manage it', async () => {
      const { wrapper } = await mountListView({})

      expect(wrapper.get('h1').text()).toBe('Favoriten')
      expect(wrapper.text()).toContain('Privat')
      expect(wrapper.find('[aria-label="Liste bearbeiten"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Liste löschen"]').exists()).toBe(true)
    })

    it('preselects the current visibility when editing', async () => {
      const { wrapper } = await mountListView({})

      await wrapper.get('[aria-label="Liste bearbeiten"]').trigger('click')

      const privateOption = wrapper.get('input[type="radio"][value="private"]')
      expect((privateOption.element as HTMLInputElement).checked).toBe(true)
    })

    it('saves the changes', async () => {
      const updates: unknown[] = []
      const { wrapper } = await mountListView({
        updateList: (listId, input) => {
          updates.push([listId, input])
          return Promise.resolve()
        },
      })
      await wrapper.get('[aria-label="Liste bearbeiten"]').trigger('click')
      await wrapper.get('#edit-list-name').setValue('Neu')
      await wrapper.get('input[type="radio"][value="public"]').setValue()

      await wrapper.get('form').trigger('submit')

      await vi.waitFor(() =>
        expect(updates).toEqual([['list-1', { name: 'Neu', visibility: ListVisibility.Public }]]),
      )
    })

    it('deletes after confirmation and returns to the lists tab', async () => {
      vi.stubGlobal('confirm', () => true)
      const deleted: string[] = []
      const { wrapper, router } = await mountListView({
        deleteList: (listId) => {
          deleted.push(listId)
          return Promise.resolve()
        },
      })

      await wrapper.get('[aria-label="Liste löschen"]').trigger('click')

      await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/profile?tab=lists'))
      expect(deleted).toEqual(['list-1'])
    })

    it('keeps the list when the confirmation is declined', async () => {
      vi.stubGlobal('confirm', () => false)
      const deleted: string[] = []
      const { wrapper } = await mountListView({
        deleteList: (listId) => {
          deleted.push(listId)
          return Promise.resolve()
        },
      })

      await wrapper.get('[aria-label="Liste löschen"]').trigger('click')

      expect(deleted).toEqual([])
    })
  })

  describe('given someone else views the list', () => {
    it('hides visibility and management and links to the owner', async () => {
      const { wrapper } = await mountListView(
        { fetchList: () => Promise.resolve(createListSummary()) },
        'other-user',
      )

      expect(wrapper.text()).not.toContain('Öffentlich')
      expect(wrapper.find('[aria-label="Liste bearbeiten"]').exists()).toBe(false)
      expect(wrapper.get(`a[href="/profile/${OWNER_ID}"]`).text()).toBe('Grüne Gabel')
    })
  })
})

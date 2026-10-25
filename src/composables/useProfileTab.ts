import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ProfileTab } from '@/components/profile/ProfileTab'

const TAB_QUERY_KEY = 'tab'
const DEFAULT_TAB = ProfileTab.Reviews

const isProfileTab = (value: unknown): value is ProfileTab =>
  Object.values(ProfileTab).some((tab) => tab === value)

export const useProfileTab = () => {
  const route = useRoute()
  const router = useRouter()

  return computed<ProfileTab>({
    get: () => {
      const tab = route.query[TAB_QUERY_KEY]
      return isProfileTab(tab) ? tab : DEFAULT_TAB
    },
    set: (tab) => {
      void router.replace({ query: { ...route.query, [TAB_QUERY_KEY]: tab } })
    },
  })
}

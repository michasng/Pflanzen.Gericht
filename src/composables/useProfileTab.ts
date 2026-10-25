import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ProfileTab } from '@/components/profile/ProfileTab'
import { PROFILE_TAB_QUERY_KEY } from '@/config/profileTabQueryKey'

const DEFAULT_TAB = ProfileTab.Reviews

const isProfileTab = (value: unknown): value is ProfileTab =>
  Object.values(ProfileTab).some((tab) => tab === value)

export const useProfileTab = () => {
  const route = useRoute()
  const router = useRouter()

  return computed<ProfileTab>({
    get: () => {
      const tab = route.query[PROFILE_TAB_QUERY_KEY]
      return isProfileTab(tab) ? tab : DEFAULT_TAB
    },
    set: (tab) => {
      void router.replace({ query: { ...route.query, [PROFILE_TAB_QUERY_KEY]: tab } })
    },
  })
}

import type { RouteLocationRaw } from 'vue-router'
import type { ProfileTab } from '@/components/profile/ProfileTab'
import { PROFILE_TAB_QUERY_KEY } from '@/config/profileTabQueryKey'

export const toOwnProfileTabLocation = (tab: ProfileTab): RouteLocationRaw => ({
  name: 'profile',
  query: { [PROFILE_TAB_QUERY_KEY]: tab },
})

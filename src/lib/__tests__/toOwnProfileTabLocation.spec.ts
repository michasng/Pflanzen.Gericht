import { describe, expect, it } from 'vitest'
import { ProfileTab } from '@/components/profile/ProfileTab'
import { toOwnProfileTabLocation } from '@/lib/toOwnProfileTabLocation'

describe('toOwnProfileTabLocation', () => {
  describe('given a tab', () => {
    it('targets the own profile with that tab selected', () => {
      expect(toOwnProfileTabLocation(ProfileTab.Lists)).toEqual({
        name: 'profile',
        query: { tab: 'lists' },
      })
    })
  })
})

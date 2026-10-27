export interface ReviewReaction {
  emoji: string
  userId: string
  profile: { username: string; displayName: string | null }
  createdAt: string
}

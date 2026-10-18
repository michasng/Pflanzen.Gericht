import type { InjectionKey } from 'vue'
import type { ReviewEditingGateway } from '@/services/ReviewEditingGateway'

export const reviewEditingGatewayKey: InjectionKey<ReviewEditingGateway> =
  Symbol('reviewEditingGateway')

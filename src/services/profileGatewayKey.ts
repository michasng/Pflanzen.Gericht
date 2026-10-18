import type { InjectionKey } from 'vue'
import type { ProfileGateway } from '@/services/ProfileGateway'

export const profileGatewayKey: InjectionKey<ProfileGateway> = Symbol('profileGateway')

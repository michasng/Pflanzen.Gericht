import type { InjectionKey } from 'vue'
import type { AuthGateway } from '@/services/AuthGateway'

export const authGatewayKey: InjectionKey<AuthGateway> = Symbol('authGateway')

import type { InjectionKey } from 'vue'
import type { AdminGateway } from '@/services/AdminGateway'

export const adminGatewayKey: InjectionKey<AdminGateway> = Symbol('adminGateway')

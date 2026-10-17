import { injectGateway } from '@/composables/injectGateway'
import { adminGatewayKey } from '@/services/adminGatewayKey'
import type { AdminGateway } from '@/services/AdminGateway'

export const useAdminGateway = (): AdminGateway => injectGateway(adminGatewayKey)

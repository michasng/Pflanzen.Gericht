import { injectGateway } from '@/composables/injectGateway'
import { authGatewayKey } from '@/services/authGatewayKey'
import type { AuthGateway } from '@/services/AuthGateway'

export const useAuthGateway = (): AuthGateway => injectGateway(authGatewayKey)

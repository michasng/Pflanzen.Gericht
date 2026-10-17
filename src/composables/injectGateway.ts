import { inject, type InjectionKey } from 'vue'

export const injectGateway = <Gateway>(key: InjectionKey<Gateway>): Gateway => {
  const gateway = inject(key)
  if (!gateway) throw new Error(`No gateway provided for ${key.description}.`)
  return gateway
}

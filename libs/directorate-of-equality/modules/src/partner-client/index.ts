/**
 * Public surface of the `partner-client` module: approved intermediary firms
 * and their credentials.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 */

export * from './dto/company-partner-delegation.dto'
export * from './dto/create-partner-client.dto'
export * from './dto/create-partner-client-key.dto'
export * from './dto/get-company-partner-delegations-response.dto'
export * from './dto/get-partner-client-keys-response.dto'
export * from './dto/get-partner-clients-response.dto'
export * from './dto/get-partner-delegations-response.dto'
export * from './dto/get-partner-providers-response.dto'
export * from './dto/grant-partner-delegation.dto'
export * from './dto/partner-client.dto'
export * from './dto/partner-client-key.dto'
export * from './dto/partner-delegation.dto'
export * from './dto/partner-provider.dto'
export * from './models/partner-client.model'
export * from './models/partner-client-key.model'
export * from './models/partner-delegation.model'
export * from './partner-client.core.module'
export * from './partner-client.service.interface'
export * from './partner-delegation.service.interface'

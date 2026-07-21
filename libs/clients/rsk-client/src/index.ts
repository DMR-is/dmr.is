// NestJS module + injectable service (recommended entry point for apps)
export { RskCompanyRegistryModule } from './lib/rsk-company-registry.module'
export { RskCompanyRegistryService } from './lib/rsk-company-registry.service'
export {
  IRskCompanyRegistryService,
  type RskLanguage,
} from './lib/rsk-company-registry.service.interface'

// Configured client instance + config helper
export {
  configureRskCompanyRegistryClient,
  rskCompanyRegistryClient,
} from './lib/rsk-company-registry.config'

// Generated SDK functions and types (Hey API — @hey-api/openapi-ts)
export * from './gen/fetch'

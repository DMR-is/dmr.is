# @dmr.is/clients-rsk-client

Client for the Icelandic tax authority (Skatturinn / RSK) **Company Registry — Legal Entities v2** API.

API portal: https://api.skatturinn.is/api-details#api=company-registry-legalentities-v2-210

The client is **generated** from the OpenAPI spec with [Hey API](https://heyapi.dev)
(`@hey-api/openapi-ts`). The spec lives in `clientConfig.yaml`; the generated
output in `src/gen/fetch` is **git-ignored** and produced by the `codegen` target
(a dependency of `tsc`/`build`).

## Endpoints

| Method | Path                     | SDK function            | Returns          |
| ------ | ------------------------ | ----------------------- | ---------------- |
| GET    | `/{nationalId}`          | `getNationalid`         | `LegalEntity`    |
| GET    | `/{nationalId}/overview` | `getNationalidOverview` | PDF (binary)     |

Both accept an optional `language` query parameter (`'is'` \| `'en'`, default `'is'`).

## Configuration

Read from the environment by `configureRskCompanyRegistryClient()` (called on import):

- `RSK_COMPANY_REGISTRY_API_PATH` — base URL (falls back to the spec's server,
  `https://api.skattur.cloud/legalentities/v2.1`)
- `RSK_PRIMARY_KEY` / `RSK_SECONDARY_KEY` — the two interchangeable APIM
  subscription keys. The primary is used, falling back to the secondary, and is
  sent as the `Ocp-Apim-Subscription-Key` header (resolved lazily per request)

Override explicitly if needed:

```ts
import { configureRskCompanyRegistryClient } from '@dmr.is/clients-rsk-client'

configureRskCompanyRegistryClient({
  baseUrl: config.rskBaseUrl,
  auth: () => config.rskSubscriptionKey,
})
```

## Usage

### NestJS (recommended)

```ts
import {
  IRskCompanyRegistryService,
  RskCompanyRegistryModule,
} from '@dmr.is/clients-rsk-client'

@Module({ imports: [RskCompanyRegistryModule] })
export class MyModule {}

// then inject the service by its token
constructor(
  @Inject(IRskCompanyRegistryService)
  private readonly rsk: IRskCompanyRegistryService,
) {}

const entity = await this.rsk.getLegalEntityByNationalId('5402696029', 'en')
const pdf = await this.rsk.getLegalEntityOverview('5402696029')
```

### Generated SDK (direct)

```ts
import { getNationalid, getNationalidOverview } from '@dmr.is/clients-rsk-client'

const { data, error } = await getNationalid({
  path: { nationalId: '5402696029' },
  query: { language: 'en' },
})

const pdf = await getNationalidOverview({
  path: { nationalId: '5402696029' },
  parseAs: 'blob',
})
```

## Regenerating

Regenerate the client from the local `clientConfig.yaml`:

```sh
nx run clients-rsk-client:codegen
```

Refresh `clientConfig.yaml` from the portal **and** regenerate in one step:

```sh
nx run clients-rsk-client:update-client
```

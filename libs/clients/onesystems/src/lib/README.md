# @dmr.is/clients-onesystems

Client for **OneExternalAPI**, the web service OneSystems runs in front of
Jafnréttisstofa's One case system. We send One a document, One files it under a
case, and One delivers it to the recipient's island.is digital mailbox (Stafrænt
pósthólf). One acts as the island.is document provider (Skjalaveita), so there
is no inbound callback to implement.

The HTTP layer is **generated** from the OpenAPI spec with
[Hey API](https://heyapi.dev) (`@hey-api/openapi-ts`). The spec is committed as
`clientConfig.json`. The generated output in `src/gen/fetch` is **git-ignored**
and produced by the `codegen` target, which `tsc` and `test` depend on.
`openapi-ts.config.ts` patches the spec at codegen time: it makes Login's
response untyped (`TokenRequest` is `{}` in the spec) and removes the global
Bearer requirement from Login.

## Flow

```text
Login -> CreateCase -> CreateDocument -> SendDocToIslandIs (-> CloseCase)
```

| Service method      | Endpoint                              | Returns                                         |
| ------------------- | ------------------------------------- | ----------------------------------------------- |
| `createCase`        | `POST /api/actions/CreateCase`        | `caseItemId` (the case `ItemID`), `caseNumber`  |
| `createDocument`    | `POST /api/actions/CreateDocument`    | `documentItemId` (the document `ItemID` in One) |
| `sendDocToIslandIs` | `POST /api/actions/SendDocToIslandIs` | `islandIsDocumentId` (the id island.is issued)  |
| `closeCase`         | `POST /api/actions/CloseCase`         | `caseItemId` of the closed case                 |

`createCase` finds the party's existing case for the template or creates one,
so repeating it is safe. **`createDocument` and `sendDocToIslandIs` are not
idempotent**: repeating either can file or deliver the document twice.

`closeCase` is not ready to use: the guide does not say whether `CaseID` is the
`CaseNumber` or the case `ItemID`.

## Configuration

Read when a call is made, never at import:

- `ONESYSTEMS_API_URL`: optional base URL override. Defaults to
  `https://jafnrettisstofa-one.onecrm.is/OneExternalAPI`.
- `ONESYSTEMS_USERNAME`, `ONESYSTEMS_PASSWORD`: the Login credentials. If either
  is missing, the call throws an `InternalServerErrorException` before any
  request is sent.

## Behaviour

- **Token.** Login's response shape is undocumented. The body is read as text
  and accepted as a JSON string, a JSON object with `token`, `access_token`,
  `Token` or `accessToken`, or a raw JWT. The token expires at the JWT `exp`
  minus 60s, or at `expires_in` minus 60s, or after 10 minutes. Concurrent
  callers share one Login. On a 401 the token is dropped and the action is sent
  once more with a fresh token.
- **Timeout.** Every request, including Login and the retry, has its own 30s
  timeout.
- **Response checks.** Every action response is JSON-parsed whatever its
  `Content-Type`, and must carry `Success: true` and an `ItemID`.
- **Logging.** The password, the token, kennitölur and the document bytes are
  never logged.

## Errors

Every failed call throws a `OneSystemsError` (a `BadGatewayException`) with
`operation`, `reason` and, when a response arrived, `upstreamStatus`:

| `reason`              | Meaning                                                         | Definitive   |
| --------------------- | --------------------------------------------------------------- | ------------ |
| `REJECTED`            | 200 with `Success: false`; see `errorNumber`/`errorMessage`     | yes          |
| `HTTP`                | non-2xx status                                                  | only for 4xx |
| `TRANSPORT`           | no response: network error, DNS/TLS failure or timeout          | no           |
| `UNEXPECTED_RESPONSE` | 2xx without `Success`, unparseable, or success with no `ItemID` | no           |

Any failure of Login is definitive, because the action was never sent.

`isDefinitiveOneSystemsFailure(error)` is true only when One certainly did not
act on the action, so repeating it cannot create a duplicate. When it is false,
the outcome is unknown and the call must not be retried automatically.

## Usage

```ts
import {
  IOneSystemsService,
  isDefinitiveOneSystemsFailure,
  OneSystemsModule,
} from '@dmr.is/clients-onesystems'

@Module({ imports: [OneSystemsModule] })
export class MyModule {}

constructor(
  @Inject(IOneSystemsService)
  private readonly oneSystems: IOneSystemsService,
) {}

const { caseItemId } = await this.oneSystems.createCase({
  nationalId,
  customerName,
  caseType,
})
```

The package exports the module, the `IOneSystemsService` token, the input and
result types, and the errors. It does not export the concrete service class or
the generated SDK.

## Regenerating

```sh
yarn nx run clients-onesystems:codegen
```

Refresh `clientConfig.json` from the server and regenerate:

```sh
yarn nx run clients-onesystems:update-client
```

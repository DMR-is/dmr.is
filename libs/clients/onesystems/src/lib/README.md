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
| `sendDocToIslandIs` | `POST /api/actions/SendDocToIslandIs` | `islandIsDocumentId` (see below), or `null`     |
| `closeCase`         | `POST /api/actions/CloseCase`         | `caseItemId` of the closed case                 |

`createCase` finds the party's existing case for the template or creates one,
so repeating it is expected to be safe (this is how the connection guide reads;
OneSystems has not confirmed it). **`createDocument` and `sendDocToIslandIs`
are not idempotent**: repeating either can file or deliver the document twice.

`sendDocToIslandIs` returns the response `ItemID` as `islandIsDocumentId`,
assumed to be the id island.is issued (unconfirmed). The spec makes `ItemID`
nullable and does not say what this call puts there, so `Success: true` without
an `ItemID` counts as sent: it resolves with `islandIsDocumentId: null` and logs
a warning. Every other action requires an `ItemID`.

`closeCase` is not ready to use: the guide does not say whether `CaseID` is the
`CaseNumber` or the case `ItemID`.

## Configuration

Read when a call is made, never at import:

- `ONESYSTEMS_API_URL`: the OneExternalAPI base URL. **There is no default.**
  For Jafnréttisstofa's instance it is, for example,
  `https://jafnrettisstofa-one.onecrm.is/OneExternalAPI`.
- `ONESYSTEMS_USERNAME`, `ONESYSTEMS_PASSWORD`: the Login credentials.

If any of the three is missing (or blank), the call throws a `OneSystemsError`
with reason `CONFIG` before any request is sent.

**The client is not gated by `ONESYSTEMS_ENABLED`.** A configured client
reaches One on every call. Whether delivery is switched on is the caller's
decision: the DoE mailbox-delivery service checks the flag before it calls
anything here, and any new consumer must do the same.

## Behaviour

- **Input.** Required text fields must be non-empty, `file` must be a
  non-empty `Buffer` and `createDate`, when given, a valid `Date`. Otherwise
  the call throws a `OneSystemsError` with reason `INVALID_INPUT` before any
  request (including Login) is sent. The message names the field, never its
  value.
- **Token.** Login's response shape is undocumented. The body is read as text
  and accepted as a JSON string, a JSON object with `token`, `access_token`,
  `Token` or `accessToken`, or a raw JWT. The token expires at the JWT `exp`
  minus 60s (an `exp` above 1e12 is read as milliseconds), or at `expires_in`
  minus 60s, or after 10 minutes, clamped to between 30s and 24h from now.
  Concurrent callers share one Login. On a 401 the token is dropped and the
  action is sent once more with a fresh token. For `CreateDocument` and
  `SendDocToIslandIs` that happens only when the 401 has an **empty** body
  (whitespace only counts as empty), which is how ASP.NET's JwtBearer
  challenge answers before any action runs. A 401 with any body, One's
  `GeneralResponse` or a `ProblemDetails` (what `[ApiController]` turns a bare
  `Unauthorized()` from inside the action into), may come from an action that
  already ran. It is never re-sent, and is thrown as not definitive.
- **Timeout.** Every request, including Login and the retry, has its own
  timeout: 30s (`ONESYSTEMS_REQUEST_TIMEOUT_MS`), except `SendDocToIslandIs`,
  which gets 120s (`ONESYSTEMS_SEND_DOC_TIMEOUT_MS`) because One makes its own
  round trip to island.is inside that call. `oneSystemsTimeoutMs(operation)`
  returns the timeout for any operation. One call can take up to
  2 x (Login + action): a 401 can arrive as the first action times out, and
  the Login and retry after it each get a full timeout. Anything that holds a
  lock across a call must outlast that.
- **Response checks.** Every action response is JSON-parsed whatever its
  `Content-Type`, and must carry `Success: true` and (except for
  `SendDocToIslandIs`) an `ItemID`.
- **Logging.** Logs carry the operation, HTTP status, One's `ErrorNumber`
  (only when it looks like a code), body lengths and One's ids. The password,
  the token, kennitölur, names, subjects, the document bytes, response bodies
  and One's `ErrorMessage` are never logged. `errorMessage` is kept on the
  error object only; do not log it. `errorNumber` is kept raw on the error
  too: a consumer that logs it must pass it through `toLoggableErrorNumber`,
  which withholds anything that is not code-shaped or that could be a
  kennitala (ten digits, or six digits, a hyphen and four).
- **Serialising the error.** The repo's exception filters log the whole
  exception object, so `errorMessage` and `errorNumber` are non-enumerable
  properties: readable as `error.errorMessage` and `error.errorNumber`, but
  skipped by `JSON.stringify`, object spread and the logger's PII masking.
  `toJSON()` returns only the safe fields (`name`, `message`, `operation`,
  `reason`, `upstreamStatus`, the three body flags, and `errorNumber` passed
  through `toLoggableErrorNumber`), and `util.inspect` prints the same plus
  the cause's name only. The message, and so `getResponse()`, never holds
  One's `ErrorMessage` or a raw `ErrorNumber`.

## Errors

Every failed call throws a `OneSystemsError` (a `BadGatewayException`) with
`operation`, `reason` and, when a response arrived, `upstreamStatus`,
`hasGeneralResponseBody`, `isValidationProblemBody`, `hasEmptyBody`,
`errorNumber` and `errorMessage`:

| `reason`              | Meaning                                                         |
| --------------------- | --------------------------------------------------------------- |
| `CONFIG`              | a required environment variable is missing; nothing was sent    |
| `INVALID_INPUT`       | the input cannot be sent; nothing was sent                      |
| `REJECTED`            | 200 with `Success: false`; see `errorNumber`/`errorMessage`     |
| `HTTP`                | non-2xx status                                                  |
| `TRANSPORT`           | no response: network error, DNS/TLS failure or timeout          |
| `UNEXPECTED_RESPONSE` | 2xx without `Success`, unparseable, or success with no `ItemID` |

`isDefinitiveOneSystemsFailure(error)` is true only when One certainly did not
act on the action, so repeating it cannot create a duplicate. When it is false,
the outcome is unknown and the call must not be retried automatically.

| Operation                             | Definitive                                                                                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| any                                   | `CONFIG`, `INVALID_INPUT`                                                                                                                          |
| `Login`                               | every failure (the action was never sent)                                                                                                          |
| `CreateCase`, `CloseCase`             | `REJECTED`, `HTTP` 4xx                                                                                                                             |
| `CreateDocument`, `SendDocToIslandIs` | `HTTP` 401, 403, 404 with an empty body, and a 400 whose body is ASP.NET's `ValidationProblemDetails`; otherwise only an allowlisted `errorNumber` |

For `CreateDocument` and `SendDocToIslandIs`, `Success: false`, other 4xx, 5xx,
`TRANSPORT` and `UNEXPECTED_RESPONSE` are **not** definitive. One calls
island.is itself inside `SendDocToIslandIs`, so a rejection may arrive after
the document was registered. The exception is an `errorNumber` listed in
`ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS` for that operation, which is **empty**
until OneSystems confirms which error numbers are raised before a document is
filed or sent.

A 401, 403 or 404 counts as "never reached the action" only when its body is
empty or whitespace only (`hasEmptyBody`). ASP.NET's pipeline (the JwtBearer
challenge, authorization, routing) rejects that way before any action runs.
Under `[ApiController]` a bare `Unauthorized()`, `Forbid()` or `NotFound()`
returned from inside an action becomes a `ProblemDetails` body, so any body,
One's `GeneralResponse`, a `ProblemDetails`, plain text or even `{}`, means the
action may have run. The generated client JSON-parses an error body and turns
a falsy result into `{}`, so an empty body looks like `{}` and a JSON `""` body
looks empty. The action client therefore decides emptiness from the raw bytes:
a response interceptor reads a copy of each non-2xx body before it is parsed,
and an error interceptor marks only those responses. A literal `{}` or a JSON
`""` body is never mistaken for an empty one.

A 400 counts as "never reached the action" only when its body is
`ValidationProblemDetails`: a JSON object with an `errors` object
(`isValidationProblemBody`). Only ASP.NET's automatic model validation, which
runs before the action, produces that. Any other 400 body is not definitive,
because an action can return `BadRequest(...)` after One has already called
island.is. That includes an empty body, plain text, HTML, and a
`ProblemDetails` without `errors` (what `[ApiController]` turns a bare
`BadRequest()` into).

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

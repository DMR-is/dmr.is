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
  `SendDocToIslandIs` that happens only on the JwtBearer challenge: a 401 with
  an **empty** body (whitespace only counts as empty) **and** a
  `WWW-Authenticate` header whose scheme is `Bearer`, which ASP.NET writes
  before any action runs. Any other 401 may come from an action that already
  ran: an in-action `Unauthorized(null)` is an empty 401 without the header,
  and one with a body is One's `GeneralResponse` or a `ProblemDetails`. It is
  never re-sent, and is thrown as not definitive. So an expired token on
  either of those two calls is recovered only if One's challenge looks like
  that; otherwise the delivery ends UNCERTAIN, never duplicated.
- **Timeout.** Every request, including Login and the retry, has its own
  timeout: 30s (`ONESYSTEMS_REQUEST_TIMEOUT_MS`), except `CreateDocument` and
  `SendDocToIslandIs`, which get 120s (`ONESYSTEMS_DOCUMENT_TIMEOUT_MS`).
  Both must never repeat, so a timeout on either leaves the outcome unknown:
  `CreateDocument` uploads the PDF, and inside `SendDocToIslandIs` One makes
  its own round trip to island.is. `oneSystemsTimeoutMs(operation)` returns
  the timeout for any operation. One call can take up to 2 x (Login + action),
  2 x (30s + 120s) = 5 min for either of the two: a 401 can arrive as the
  first action times out, and the Login and retry after it each get a full
  timeout. Anything that holds a lock across a call must outlast that.
- **Response checks.** Every action response is JSON-parsed whatever its
  `Content-Type`, and must carry `Success: true` and (except for
  `SendDocToIslandIs`) an `ItemID`.
- **Logging.** Logs carry the operation, HTTP status, One's `ErrorNumber`
  (only when it looks like a code), body lengths and One's ids. The password,
  the token, kennitölur, names, subjects, the document bytes, response bodies
  and One's `ErrorMessage` are never logged. `errorMessage` is kept on the
  error object only; do not log it. `errorNumber` is kept raw on the error
  too: a consumer that logs or stores it must pass it through
  `toLoggableErrorNumber`, which withholds anything that is not code-shaped or
  that contains anything that could be a kennitala, anywhere in the value: a
  run of nine or more digits, or six digits, an optional hyphen and four
  (`E0101302989`, `0101302989_1` and `010130-2989x` are all withheld). A
  numeric `ErrorNumber` is kept as its string and filtered the same way.
  Node's transport error codes (`ECONNREFUSED`,
  `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`) are logged through their own filter,
  upper-case letters, digits and `_`, up to 64 characters.
- **Serialising the error.** The repo's exception filters log the whole
  exception object, so `errorMessage`, `errorNumber` and `cause` (and
  `HttpException`'s own `options`, which holds the cause too) are
  non-enumerable properties: readable as `error.errorMessage`,
  `error.errorNumber` and `error.cause`, but skipped by `JSON.stringify`,
  object spread and the logger's PII masking. `toJSON()` returns only the safe
  fields (`name`, `message`, `operation`, `reason`, `upstreamStatus`, the four
  body flags, and `errorNumber` passed through `toLoggableErrorNumber`), and
  `util.inspect` prints the same plus the cause's name only. The message, and
  so `getResponse()`, never holds One's `ErrorMessage` or a raw
  `ErrorNumber`.

## Errors

Every failed call throws a `OneSystemsError` (a `BadGatewayException`) with
`operation`, `reason` and, when a response arrived, `upstreamStatus`,
`hasGeneralResponseBody`, `isValidationProblemBody`, `hasEmptyBody`,
`hasBearerChallenge`, `errorNumber` and `errorMessage`:

| `reason`              | Meaning                                                         |
| --------------------- | --------------------------------------------------------------- |
| `CONFIG`              | a required environment variable is missing; nothing was sent    |
| `INVALID_INPUT`       | the input cannot be sent; nothing was sent                      |
| `REJECTED`            | 200 with `Success: false`; see `errorNumber`/`errorMessage`     |
| `HTTP`                | non-2xx status                                                  |
| `TRANSPORT`           | no usable response: network, DNS/TLS, timeout, unreadable body  |
| `UNEXPECTED_RESPONSE` | 2xx without `Success`, unparseable, or success with no `ItemID` |

`isDefinitiveOneSystemsFailure(error)` is true only when One certainly did not
act on the action, so repeating it cannot create a duplicate. When it is false,
the outcome is unknown and the call must not be retried automatically.

| Operation                             | Definitive                                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| any                                   | `CONFIG`, `INVALID_INPUT`                                                                                                                                      |
| `Login`                               | every failure (the action was never sent)                                                                                                                      |
| `CreateCase`, `CloseCase`             | `REJECTED`, `HTTP` 4xx (with or without a body)                                                                                                                |
| `CreateDocument`, `SendDocToIslandIs` | an empty `HTTP` 401 with `WWW-Authenticate: Bearer`, and a 400 whose body is ASP.NET's `ValidationProblemDetails`; otherwise only an allowlisted `errorNumber` |

For `CreateDocument` and `SendDocToIslandIs`, `Success: false`, an empty 403
or 404, other 4xx, 5xx, `TRANSPORT` and `UNEXPECTED_RESPONSE` are **not**
definitive. One calls
island.is itself inside `SendDocToIslandIs`, so a rejection may arrive after
the document was registered. The exception is an `errorNumber` listed in
`ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS` for that operation, which is **empty**
until OneSystems confirms which error numbers are raised before a document is
filed or sent.

An empty body alone does not prove that the request never reached the action.
`NotFound(null)` and `Unauthorized(null)` from inside an action keep their
status with an empty body (`Content-Length: 0`), and `Forbid()` and
`Challenge()` go through the auth handler, where JwtBearer writes an empty 403
or 401. So a 401 counts as "never reached the action" only when its body is
empty or whitespace only (`hasEmptyBody`) **and** its `WWW-Authenticate` header
names the Bearer scheme (`hasBearerChallenge`). The JwtBearer challenge always
sets that header, and an in-action `Unauthorized(null)` does not. An empty 403
or 404 never counts for these two calls. A wrong base URL already fails at
`CreateCase`, which runs first, is idempotent, and treats any 4xx as
definitive. A missing permission fails there too only if `CreateCase` needs the
same One permission as `CreateDocument` and `SendDocToIslandIs`, which is
unconfirmed; if it does not, that call's empty 403 leaves the delivery
UNCERTAIN (never a duplicate). A 401, 403 or 404 with any body
(One's `GeneralResponse`, a `ProblemDetails`, plain text or even `{}`) never
counts either.

The generated client JSON-parses an error body and turns a falsy result into
`{}`, so an empty body looks like `{}` and a JSON `""` body looks empty. The
action client therefore decides emptiness from the raw bytes: a response
interceptor reads a copy of each non-2xx body before it is parsed, and records
whether it was empty and, for a 401, whether `WWW-Authenticate` names Bearer.
An error interceptor then swaps in a marker for only those responses. A literal
`{}` or a JSON `""` body is never mistaken for an empty one. The interceptors
rely on the call order of the client generated by `@hey-api/openapi-ts`
0.97.3 (pinned); the real-`Response` rows in `onesystems.service.spec.ts` guard
it, so rerun them after any upgrade.

A non-2xx whose body fails to arrive in full (the connection drops mid-body)
is `TRANSPORT`, not `HTTP`, and is not definitive for **any** operation,
including `CreateCase` and `CloseCase`: what it would have said is unknown.
The read error is the `cause`; only its name is logged, with no body length.

A 400 counts as "never reached the action" only when its body is
`ValidationProblemDetails`: a JSON object with an `errors` object
(`isValidationProblemBody`). Only ASP.NET's automatic model validation, which
runs before the action, produces that. Any other 400 body is not definitive,
because an action can return `BadRequest(...)` after One has already called
island.is. That includes an empty body, plain text, HTML, and a
`ProblemDetails` without `errors` (what `[ApiController]` turns a bare
`BadRequest()` into).

## Open questions for OneSystems

Each needs a live call or an answer from OneSystems before
`ONESYSTEMS_ENABLED` is turned on. They are marked `TODO(OneSystems)` in the
code.

- What does Login return? The spec documents its response as `{}`.
- Can any One action, **after** it has filed/sent, return `NotFound(null)`,
  `Unauthorized(null)`, `Forbid()`, `Challenge()` or `ValidationProblem()`?
  `Challenge()` is indistinguishable client-side from a real expired-token
  challenge, which is treated as definitive and retried. Is the 401 challenge
  body empty, and does it carry `WWW-Authenticate: Bearer`? If it does not carry
  the header, an expired token on `CreateDocument` or `SendDocToIslandIs`
  ends UNCERTAIN instead of being retried.
- Which `ErrorNumber`s are raised before a document is filed or sent
  (`ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS`)?
- Does `CreateCase` find-or-create? Is `CloseCase`'s `CaseID` the
  `CaseNumber` or the case `ItemID`?
- What does `SendDocToIslandIs` put in `ItemID`?
- Do `CreateCase`, `CreateDocument` and `SendDocToIslandIs` need the same One
  permission? An empty 403 on the later two is treated as not definitive on
  the assumption that a missing permission already failed at `CreateCase`.

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

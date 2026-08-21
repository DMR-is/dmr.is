/**
 * Physical table name.
 *
 * The DoE app names its tables through the `DoeModels` enum in
 * `apps/directorate-of-equality-api/src/core/constants.ts`, but this model lives
 * in a lib that both APIs consume, so it cannot reach into an app for the name.
 * The literal is declared here instead and the app has no `DoeModels` entry for
 * it — there is exactly one source of truth either way.
 */
export const DOE_API_KEY_TABLE = 'doe_api_key'

/**
 * How a key came to exist. Recorded because the two issuance paths carry
 * different kinds of actor: `ISLAND_IS` keys are minted by a person acting for
 * the company (kennitala, no `doe_user` row), `ADMIN` keys by a reviewer.
 */
export enum ApiKeyOriginEnum {
  ISLAND_IS = 'ISLAND_IS',
  ADMIN = 'ADMIN',
}

/**
 * What a key is permitted to do. Stored as a text array so a key can be
 * narrowed to one report type without reissuing the credential model.
 */
export enum ApiKeyScopeEnum {
  SALARY_SUBMIT = 'salary:submit',
  EQUALITY_SUBMIT = 'equality:submit',
  REPORT_READ = 'report:read',
}

/** Granted when a caller does not ask for a narrower set. */
export const DEFAULT_API_KEY_SCOPES: ApiKeyScopeEnum[] = [
  ApiKeyScopeEnum.SALARY_SUBMIT,
  ApiKeyScopeEnum.EQUALITY_SUBMIT,
  ApiKeyScopeEnum.REPORT_READ,
]

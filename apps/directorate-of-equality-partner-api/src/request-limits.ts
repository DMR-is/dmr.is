/**
 * How much of a request this surface will hold, in one place.
 *
 * Split out because the same bound has to be stated twice in two different
 * vocabularies: `express.json()` takes it for JSON bodies, and busboy takes it
 * for the JSON *part* of the one multipart route, since Express's parsers do not
 * look at `multipart/form-data` at all. Two literals would be two limits that
 * agree until someone raises one of them, and the symptom would be a vendor
 * whose group submission is refused on one route and accepted on another.
 *
 * Binary megabytes, because that is what the string `'8mb'` meant to express's
 * `bytes` parser before this was a constant — the number is unchanged.
 */
export const MAX_PARTNER_JSON_BYTES = 8 * 1024 * 1024

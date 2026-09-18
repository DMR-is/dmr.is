# doe-shared

Contract shared between the two Directorate of Equality APIs:
`directorate-of-equality-api` (island.is + admin surfaces) and
`directorate-of-equality-partner-api` (the public third-party integration).

It holds only what both sides must agree on — today the API-key model, its DTOs
and the key format/hashing primitives.

Both services write to the same database: the partner API inserts report rows
and updates `doe_api_key.last_used_at` itself rather than forwarding anything.
Only MIGRATIONS are single-writer — `directorate-of-equality-api` owns those, so
it must always deploy first. An earlier version of this file said that app was
the sole writer of the database, which was never true once the partner API
existed.

## Running unit tests

Run `nx test doe-shared` to execute the unit tests via [Jest](https://jestjs.io).

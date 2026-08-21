# doe-shared

Contract shared between the two Directorate of Equality APIs:
`directorate-of-equality-api` (island.is + admin surfaces) and
`directorate-of-equality-partner-api` (the public third-party integration).

It holds only what both sides must agree on — today the API-key model, its DTOs
and the key format/hashing primitives. Business logic stays in the app that owns
it: `directorate-of-equality-api` remains the sole writer of the database.

## Running unit tests

Run `nx test doe-shared` to execute the unit tests via [Jest](https://jestjs.io).

# doe-modules

The Directorate of Equality domain layer: Sequelize models, services, their DTOs
and the Nest core modules that wire them.

Consumed by both DoE APIs — `directorate-of-equality-api` (island.is + admin)
and the third-party integration API — because both write reports and so both
need this code in-process.

## What does NOT live here

- **Controllers and api modules.** Each app owns its own HTTP surface.
- **Guards and param decorators.** A guard answers "who may call this route",
  which is a property of the app that owns the controller. Guards depend on
  services here; the dependency never runs the other way.
- **Tasks (crons).** Only `directorate-of-equality-api` schedules them — two
  schedulers against one database would double-fire every job.
- **Migrations.** `directorate-of-equality-api` remains the sole migrator.

## Running unit tests

Run `nx test doe-modules` to execute the unit tests via [Jest](https://jestjs.io).

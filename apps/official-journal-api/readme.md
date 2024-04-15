# Official Journal of Iceland API

## Structure

Controller exposes the API endpoints, and uses the service to handle the business logic. It only handles the request and response, and delegates everything to the service. It should _never_ catch an error, but instead let the service handle it. Since we potentially can return miscellaneous responses per endpoint, each should be decorated with more rather than less responses.

Service handles the business logic, and uses the repository to interact with the database, it should do all the relevant logging and error handling. It should _never_ throw an error, but instead return a result object.

The boundary between the controller and service is defined in interfaces. Each method should return a wrapped result object, which contains the result or an error. There should not be any exceptions thrown or `null` returned.

Each model has its properites defined and decorated with the relevant validation rules. It should _never_ have any logic, and should only be used to define the shape of the data. Validation should be done by NestJS validation pipes.

## Running

To start the API, run the following command:

```bash
yarn start official-journal-api
```

## Database

Run the docker-compose file to start the database:

```bash
docker-compose -f apps/official-journal-api/docker-compose.yml up
```

Uses Sequelize as the ORM, following commands are mapped to the nx workspace in `project.json`.

### Migrations

Run the migrations to create the tables:

```bash
yarn nx run official-journal-api:migrate
```

Undo the last migration:

```bash
yarn nx run official-journal-api:migrate/undo
```

To create a new migration template:

```bash
yarn nx run official-journal-api:migrate/generate
```

### Seeds

## TODO

- [ ] versioning
- [ ] db
  - [ ] initial setup
  - [ ] migrations
  - [ ] import & seeds
- [ ] auth
- [ ] cors
- [ ] tests
- [ ] validations
  - [ ] advert (department, type) must be valid
- [ ] health & readiness checks
- [ ] logging
  - [ ] warnings
  - [ ] errors
  - [ ] tracing
  - [ ] PII

# Official Journal of Iceland API

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


## Database for local development and migrations

### Run the database locally

Make sure you have Docker installed and Docker daemon running and run the following command:
```bash
yarn nx run official-journal-api:dev-services
```

This will start a local PostgreSQL database running on port 5432 with the following credentials:
```yaml
- POSTGRES_DB=dev_db
- POSTGRES_USER=dev_db
- POSTGRES_PASSWORD=dev_db
```

### Migrations

#### Create a new migration
```bash
yarn nx run official-journal-api:migrate/generate
```

This creates a new migration file with the name of the user and the current timestamp.
It's recommended to rename the file to something more descriptive.


#### Run migrations
```bash
yarn nx run official-journal-api:migrate
```

#### Undo migrations
```bash
yarn nx run official-journal-api:migrate/undo
```


### Seed

Run the following command to seed the database with initial data located in `apps/official-journal-api/seeders`:
```bash
yan nx run official-journal-api:seed
```

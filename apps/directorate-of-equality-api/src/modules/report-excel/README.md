# `report-excel` module

Stateless Excel I/O for DoE salary reports. The third-party application
system downloads a blank template, the company fills it out, the app system
POSTs the filled workbook back, and we return a nested `ParsedReportDto` the
app system uses to prefill its UI. **No persistence** — report creation
lives on a future `/reports` endpoint.

The response contains only what the workbook carries: criteria tree, roles,
employees. Report-level metadata (admin / contact) and company identification
stay with the app-system's auth context and are never echoed back.

## Endpoints

| Method | Path                             | What it does                                                                                  |
| ------ | -------------------------------- | --------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/reports/excel/template` | Streams the blank salary-report xlsx                                                          |
| `POST` | `/api/v1/reports/excel/import`   | Multipart upload (`file` field) → `ParsedReportDto` JSON, or `400` with structured error list |

The `TokenJwtAuthGuard` is currently commented out on the controller for
local development — re-enable before shipping.

## Local testing

### Boot the API

```bash
# Postgres + migrations + seed (once)
yarn nx run doe-api:dev-init

# Serve
yarn nx run doe-api:serve
```

API listens on `http://localhost:5100/api/v1/` unless
`DIRECTORATE_OF_EQUALITY_API_PORT` is set.

### Download the blank template

```bash
curl -o /tmp/doe-template.xlsx \
  http://localhost:5100/api/v1/reports/excel/template
```

Open in Excel or Numbers, fill out **Viðmið**, **Undirviðmið**,
**Starfsmenn**, **Flokkun starfa**, **Flokkun starfsmanna**, save.
`Leiðbeiningar` and `Yfirlit` are ignored on parse.

### Import a filled workbook

```bash
curl -s -X POST \
  -F "file=@/tmp/doe-template-filled.xlsx" \
  http://localhost:5100/api/v1/reports/excel/import | jq
```

On success you'll get a `ParsedReportDto` tree. On failure, `400` with:

```json
{
  "statusCode": 400,
  "message": "Workbook failed validation",
  "errors": [
    { "sheet": "Starfsmenn", "row": 7, "column": "D", "message": "Unknown gender \"Other\"" },
    { "sheet": "Viðmið", "row": null, "column": null, "message": "Criterion weights sum to 95%, expected 100%" }
  ]
}
```

All problems are returned in one response — parser and semantic errors
accumulate into the same list, so there's no whack-a-mole.

## Editing the template

The bundled template is `template.xlsx` in this folder; its bytes are
base64-inlined into `template-data.ts` so the API has no filesystem
dependency at runtime. After editing the xlsx:

```bash
node scripts/refresh-template-data.js
```

Commit both the updated xlsx and the regenerated `template-data.ts`.

## Module layout

```
report-excel/
├── dto/                        Output DTOs (ParsedReportDto tree + ImportErrorDto)
├── parser/
│   ├── cell.ts                 Scalar extraction (string/number/date/rich-text)
│   ├── errors.ts               ErrorBag — accumulate issues with sheet+row+col
│   ├── criteria.parser.ts      Viðmið + Undirviðmið → nested tree, step scores
│   ├── employees.parser.ts     Starfsmenn → employees + auto-derived roles
│   ├── classifications.parser.ts  Flokkun sheets → step assignments by position
│   └── workbook.parser.ts      Orchestrator: chain the passes, run semantic validator
├── validators/
│   └── semantic.validator.ts   Weights sum, mandatory criteria, completeness
├── template.xlsx               Source asset (hand-authored)
├── template-data.ts            Base64-inlined bytes
└── workbook.schema.ts          Parser constants: enum translation, named ranges
```

## Known pending work

- **Auth**: controller uses `PLACEHOLDER_META/COMPANY` until
  `@CurrentUser()` is wired back to extract company context from the token.
- **Export**: `GET /reports/:id/export` deferred — needs persisted reports
  to exist first (future `/reports` endpoint).
- **Deviations**: handled post-scoring on the `/reports` side, not here.

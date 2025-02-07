# reglugerdir API

API layer on top of the associated database.

## 📦 Installation

1. **Install dependencies** (run from the root of the project):

From the root folder:

```bash
yarn install
```

2. **Ensure the database is running**.

## ⚙️ Running Locally (Development Mode)

To **serve the API locally** with automatic rebuilding on changes, run:

```bash
nx serve regulations-api
```

- Runs the API on `http://localhost:3000` (or the configured port).
- Automatically rebuilds and restarts when you modify source files.

---

## 🏗️ Building the Project

For **development** builds:

```bash
nx build regulations-api --configuration=development
```

For **production** builds:

```bash
nx build regulations-api --configuration=production
```

- The output will be located in:
  ```
  apps/regulations-api/dist
  ```

---

## 🚀 Running the Built Project

Once built, you can run the production build manually:

```bash
node dist/apps/regulations-api/server.js
```

All routes can then be accessed under `localhost:3000/api/v1/[route]`

Set `process.env.PORT` to use a different port.

## Run ESLint to check for linting errors

```bash
nx lint regulations-api
```

# Routes

## LawChapter

- `GET /api/v1/lawchapters`  
  `GET /api/v1/lawchapters?slugs=01,02a,36c`  
  Returns all lawchapters
  - optinally filter by lawchapter slugs
- `GET /api/v1/lawchapters/tree`  
  Returns all lawchapters in tree view with subchapters

## Ministry

- `GET /api/v1/ministries`  
  `GET /api/v1/ministries?slugs=fsr,dmr`  
  Returns all ministries
  - optinally filter by ministry slugs

## Years

- `GET /api/v1/years`  
  Returns all regulation years

## Regulations

- `GET /api/v1/regulations/newest`  
  `GET /api/v1/regulations/newest?page=2`  
  Returns all regulations ordered by publisheddate, 30 items per page
- `GET /api/v1/regulations/all/current/minimal`  
  Returns all current base regulations ordered by publisheddate
- `GET /api/v1/regulations/all/current/full`  
  Returns all current base regulations ordered by publisheddate
  - includes ministry and text field for generic search
- `GET /api/v1/regulations/all/extra`  
  Returns all regulations ordered by publisheddate
  - including text, law chapters and ministry for advanced search
- `GET /api/v1/regulations/optionsList?names=1719/2021,0100/2021`  
  Returns regulations optionsList filtered by RegNames

## Regulation

- `GET /api/v1/regulation/:name/current`  
  Returns current version of a regulation with all changes applied
- `GET /api/v1/regulation/:name/diff`  
  Returns current version of a regulation with all changes applied, showing the
  total changes the "original" verion.
- `GET /api/v1/regulation/:name/original`  
  Returns original version of a regulation
- `GET /api/v1/regulation/:name/d/:date`  
  Returns a version of a regulation as it was on a specific `date`
- `GET /api/v1/regulation/:name/d/:date/diff`  
  Returns a version of a regulation as it was on a specific `date`, showing the
  changes that occurred on that date
- `GET /api/v1/regulation/:name/d/:date/diff/original`  
  Returns a version of a regulation as it was on a specific `date`, showing the
  total chances since the "original" verion.
- `GET /api/v1/regulation/:name/d/:date/diff/:earilerDate`  
  Returns a version of a regulation as it was on a specific `date`, showing the
  total chances since `earlierDate`
- `GET /api/v1/regulation/:name/on/:date`  
  Returns a version of a regulation as it will be on any specific `date`

You can add `/pdf` to the end of all of the above regulation endpoints, to
download a PDF version.

## Search

- `GET /api/v1/search?q=query&year=YYYY&yearTo=YYYY&rn=ministrySlug&ch=lawChapterSlug&iA=bool&iR=bool`  
  Searches regulations by query (q), year, ministry (rn) or lawchapter (ch)
  - optionally include amending (iA) or repelled (iR) regulations
- `GET /api/v1/search/recreate`  
  Recreates index db
- `GET /api/v1/search/repopulate`  
  Repopulates index db
- `GET /api/v1/search/update?name=:name`  
  Updates regulation item in index by `name`

## Redirects

- `GET /api/v1/redirects`  
  Returns redirects for all regulations marked as `Done`

### Param types:

- `name` – Regulation publication name formatted as `nnnn-yyyy`. _(Example:
  `0221-2001`)_
- `date` – Valid ISODate _(Example: `2020-01-01`)_
- `earlierDate` – Valid ISODate _(Example: `2013-10-16`)_

---

## File/image upoads

- `POST /api/v1/file-upload?scope={regulationIdentifier}`  
  Accepts multipart form uploads from the regulations rich-text editor and saves
  them in an S3 bucket and returns the resulting URL

  - Requires `FILE_UPLOAD_KEY_DRAFT` or `FILE_UPLOAD_KEY_PUBLISH` to be sent via
    a `X-APIKey` header to A) accept/deny upload requests (security) and B) to
    select the appropriate folder to upload the files into. (See
    `assertUploadType(req)`)

  - `env.FILE_UPLOAD_KEY_DRAFT`  
    is the API key used by the Regulations-admin system on Ísland.is to upload
    images and documents for regulation drafts, while they're being authored.  
    (While drafting a new regulation the files are uploaded to an
    `/admin-drafts/:scope/` folder.)

  - `env.FILE_UPLOAD_KEY_PUBLISH`  
    is the API key used by Sæmundur's migration/cleanup admin system, to upload
    images for already published published regulations, **and** the api key used
    by the Regulations-admin system uses to publish images/documents when a
    drafted regulation is finally being published.

  - `env.MEDIA_BUCKET_FOLDER`  
    in "dev-mode" this should always be **non-empty** (e.g. `dev/valur`) but
    **must be** empty in production. This variable is used to make sure all
    images/documents we upload during testing/development end up in a separate
    folder that we can purge with a single AWS CLI command, like so:

        aws s3 --profile regulations rm --recursive  s3://island-is-reglugerd-media/dev

- `POST /api/v1/file-upload-urls`  
  This endpoint is used when a new regulation is published. All resources that
  the new regulation points/links to are automatically uploaded to a stable
  storage in an S3 bucket.

  - Requires `FILE_UPLOAD_KEY_PUBLISH` to be sent via a `X-APIKey` header

  - It accepts JSON payload in the form of
    `{ urls: Array<URLString>, regName: RegName }`

  - The endpoint then returns a JSON response of type
    `Array<{ oldUrl: URLString, newUrl: URLString }>`.  
    All the `newUrl`s point to `https://files.reglugerd.is/` (or
    `process.env.DEV_FILE_SERVER`)

  - Incoming URLs that start with `/` are assumed to be relative to
    `https://www.reglugerd.is` (provides sane back-compat with older content)

  - Incoming URLs starting with
    `https://files.reglugerd.is/admin-drafts/:draftscope/:path` are moved to
    `https://files.reglugerd.is/files/:regName/:path`

  - Other oncoming URLs starting with `https://files.reglugerd.is/` are left
    unchanged

- `POST /api/v1/file-presigned`  
  Generates and a returns a PresignedPost, i.e an object containing an url and
  all nececcessary headers to enable uploading of files straight to the relevant
  S3 bucket.

  - Requires `FILE_UPLOAD_KEY_PRESIGNED` to be sent via a `X-APIKey` header

  - It accepts JSON payload in the form of `{ fileName: string, hash: string }`

  - The endpoint then returns a `PresignedPost` object

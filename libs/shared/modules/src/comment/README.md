# Comments API

## Models

### CommentTypeModel

```typescript
  {
    id: uuid,
    title: string,
    slug: string
  }
```

### CaseStatusModel

```typescript
  {
    id: uuid,
    title: string,
    slug: string
  }
```

### ApplicationUserModel

```typescript
{
  id: uuid,
  nationalId: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  involvedParties: {
    id: string,
    title: string,
    slug: string,
  }[]
}
```

### AdminUserModel

```typescript
  {
    id: uuid,
    title: string,
    slug: string
  }
```

### CaseCommentModel

```typescript
  /**
   * id - Id of the comment
   * created - ISO date of when the comment was created
   * caseId - Case id of the comment
   * typeId - Type id of the comment
   * type - Model of the comment type
   * caseStatusId - Case status id
   * caseStatus - Model of the case status
   * source - Which source the comment was created from
   * internal - Is the comment only available to admins or everyone
   * applicationState - JSON string of the application useful for storing the history of the application
   * creatorId - Id of the user who created the user
   * creator - Model of admin/application user
   * receiverId - Id of the receiver of the comment admin/application user or null
   * receiver - Model of the admin/application user or null
   * comment - The comment itself
  */
  {
    id!: uuid,
    created!: string,
    caseId!: uuid,
    typeId!: uuid,
    type!: CommentTypeModel,
    caseStatusId!: uuid,
    caseStatus!: CaseStatusModel,
    source: API, | Application
    internal!: boolean,
    applicationState?: string
    creator?: string | null
    receiver?: string | null
    comment?: string | null
  }
```

## CommentDto

### CreateCaseCommentDto

```typescript
{
  internal: boolean
  typeId: string,
  comment: string | null | undefined
  creator: string | null
  receiver: string | null
  source: 'API' |' Application'
}
```

### CaseCommentDto example when application is submitted

```typescript
{
  id: '684bdbd8-b3c7-4747-b620-b1d0e6c0bad8',
  title: 'Innsent af',
  caseStatus: 'Innsent',
  age: 'f. 2 dögum',
  source: 'API',
  creator: 'Reykjavíkurborg'
  receiver: null,
  comment: null,
}
```

### CaseCommentDto example when case status is updated

```typescript
{
  id: '684bdbd8-b3c7-4747-b620-b1d0e6c0bad8',
  title: 'færir mál í stöðuna:',
  caseStatus: 'Grunnvinnsla',
  age: 'í dag',
  source: 'API',
  creator: 'Ármann Árni'
  receiver: 'Grunnvinnsla',
  comment: null,
}
```

## Comment Types

### Innsent af (when application is submitted)

```typescript
/** CaseCommentModel */
{
  id: '684bdbd8-b3c7-4747-b620-b1d0e6c0bad8',
  caseId: '474eefda-ceab-43d0-ae59-c738c6d4aa21',
  typeId: '03ce8876-7c94-4a06-9196-451e9081e6bf',
  type: {
    id: '03ce8876-7c94-4a06-9196-451e9081e6bf',
    title: 'Innsent af',
    slug: 'innsent-af',
  },
  caseStatusId: 'abb6fa98-727d-4e93-bccc-3f2c3ed747de',
  caseStatus: {
    id: 'abb6fa98-727d-4e93-bccc-3f2c3ed747de',
    title: 'Innsent',
    slug: 'innsent',
  },
  internal: true,
  creatorId: `ee985e48-89c2-40c7-9ccd-3788d8ff803d`,
  creator: {
    id: `ee985e48-89c2-40c7-9ccd-3788d8ff803d`,
    nationalId: '0100302789',
    firstName: 'Gervimaður',
    lastName: 'Útlönd',
    email: null,
    phone: '0107789',
    involvedParties: [
      {
        id: '10b7bd1a-5d1a-4af8-ab6b-df4034ec07be',
        title: 'Dómsmálaráðuneytið',
        slug: 'domsmalaraduneytid',
      },
      {
        id: 'afcffd28-a65b-4670-857b-2e3471de442b',
        title: 'Reykjavíkurborg',
        slug: 'reykjavikurborg',
      },
    ]
  },
  receiverId: null,
  receiver: null,
  comment: null,
  applicationState: 'JSON',
}
```

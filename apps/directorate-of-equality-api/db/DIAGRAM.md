# DoE DB Schema Diagram

Entity-relationship diagram of the DoE salary equality reporting schema. Entities show only PK + FK columns + a few key fields for readability. Full column lists live in [`README.md`](./README.md) under the Tables section.

Relationship labels are the FK column name. Cardinality notation:
- `|o` = zero-or-one (nullable FK)
- `||` = exactly one
- `o{` = zero-or-many

```mermaid
erDiagram
    user {
        uuid id PK
        text national_id
        text email
    }
    company {
        uuid id PK
        text name
        text national_id
        int employee_count
    }
    company_report {
        uuid id PK
        uuid company_id FK
        uuid report_id FK
        uuid company_parent_id FK "nullable"
    }
    report {
        uuid id PK
        ReportStatusEnum status
        uuid previous_report_id FK "nullable"
        uuid reviewed_by FK "nullable"
        timestamp approved_at
        timestamp valid_until
        date fines_started_at
    }
    report_criterion {
        uuid id PK
        uuid report_id FK
        text title
        ReportCriterionTypeEnum type
        float weight
    }
    report_sub_criterion {
        uuid id PK
        uuid report_criterion_id FK
        text title
        float weight
    }
    report_sub_criterion_step {
        uuid id PK
        uuid report_sub_criterion_id FK
        num order
        float score
    }
    report_employee {
        uuid id PK
        uuid report_id FK
        uuid role_id FK
        GenderEnum gender
        EducationEnum education
        num score
    }
    report_employee_role {
        uuid id PK
        text title
    }
    report_employee_deviation {
        uuid id PK
        uuid emp_id FK
        text reason
        text action
    }
    report_employee_role_criterion_step {
        uuid id PK
        uuid role_id FK
        uuid step_id FK
    }
    report_employee_personal_criterion_step {
        uuid id PK
        uuid employee_id FK
        uuid step_id FK
    }
    report_result {
        uuid id PK
        uuid report_id FK
    }
    report_role_result {
        uuid id PK
        uuid report_result_id FK
        uuid role_id FK
    }
    public_report {
        uuid id PK
        uuid source_report_id FK
        text size_bucket
        text isat_category
        timestamp published_at
    }

    company ||--o{ company_report : "company_id"
    report ||--o{ company_report : "report_id"
    company |o--o{ company_report : "company_parent_id"

    user |o--o{ report : "reviewed_by"
    report |o--o{ report : "previous_report_id"

    report ||--o{ report_criterion : "report_id"
    report_criterion ||--o{ report_sub_criterion : "report_criterion_id"
    report_sub_criterion ||--o{ report_sub_criterion_step : "report_sub_criterion_id"

    report ||--o{ report_employee : "report_id"
    report_employee_role ||--o{ report_employee : "role_id"
    report_employee ||--o{ report_employee_deviation : "emp_id"

    report_employee_role ||--o{ report_employee_role_criterion_step : "role_id"
    report_sub_criterion_step ||--o{ report_employee_role_criterion_step : "step_id"

    report_employee ||--o{ report_employee_personal_criterion_step : "employee_id"
    report_sub_criterion_step ||--o{ report_employee_personal_criterion_step : "step_id"

    report ||--|| report_result : "report_id"
    report_result ||--o{ report_role_result : "report_result_id"
    report_employee_role ||--o{ report_role_result : "role_id"

    report ||--o| public_report : "source_report_id"
```

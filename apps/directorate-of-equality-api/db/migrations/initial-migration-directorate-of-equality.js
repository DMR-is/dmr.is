'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- ============================================================
    -- Enums
    -- ============================================================

    CREATE TYPE gender_enum AS ENUM ('MALE', 'FEMALE', 'NEUTRAL');

    CREATE TYPE report_provider_enum AS ENUM (
      'SYSTEM',
      'ISLAND_IS',
      'OTHER'
    );

    CREATE TYPE report_criterion_type_enum AS ENUM (
      'RESPONSIBILITY',
      'STRAIN',
      'CONDITION',
      'COMPETENCE',
      'PERSONAL'
    );

    CREATE TYPE education_enum AS ENUM (
      'COMPULSORY',
      'UPPER_SECONDARY',
      'VOCATIONAL',
      'BACHELOR',
      'MASTER',
      'DOCTORATE',
      'PROFESSIONAL'
    );

    CREATE TYPE report_status_enum AS ENUM (
      'DRAFT',
      'SUBMITTED',
      'IN_REVIEW',
      'DENIED',
      'APPROVED',
      'SUPERSEDED'
    );

    CREATE TYPE report_type_enum AS ENUM ('SALARY', 'EQUALITY');

    CREATE TYPE report_event_type_enum AS ENUM (
      'SUBMITTED',
      'ASSIGNED',
      'STATUS_CHANGED'
    );

    CREATE TYPE comment_visibility_enum AS ENUM ('INTERNAL', 'EXTERNAL');

    CREATE TYPE comment_author_kind_enum AS ENUM ('REVIEWER', 'COMPANY_ADMIN');

    -- ============================================================
    -- Tables
    -- ============================================================

    CREATE TABLE doe_user (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      national_id TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT DEFAULT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE company (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postcode TEXT NOT NULL,
      average_employee_count_from_rsk INTEGER NOT NULL,
      national_id TEXT NOT NULL UNIQUE,
      isat_category TEXT NOT NULL,
      salary_report_required BOOLEAN NOT NULL DEFAULT FALSE,
      salary_report_required_override BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE report_employee_role (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      title TEXT NOT NULL
    );

    CREATE TABLE report (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      type report_type_enum NOT NULL,
      status report_status_enum NOT NULL DEFAULT 'DRAFT',

      company_admin_name TEXT DEFAULT NULL,
      company_admin_email TEXT DEFAULT NULL,
      company_admin_gender gender_enum DEFAULT NULL,
      company_national_id TEXT DEFAULT NULL,

      contact_name TEXT DEFAULT NULL,
      contact_email TEXT DEFAULT NULL,
      contact_phone TEXT DEFAULT NULL,

      average_employee_male_count DECIMAL(10, 2) DEFAULT NULL,
      average_employee_female_count DECIMAL(10, 2) DEFAULT NULL,
      average_employee_neutral_count DECIMAL(10, 2) DEFAULT NULL,

      provider_type report_provider_enum DEFAULT NULL,
      provider_id TEXT DEFAULT NULL,
      imported_from_excel BOOLEAN NOT NULL DEFAULT FALSE,
      identifier TEXT DEFAULT NULL,

      equality_report_id UUID DEFAULT NULL REFERENCES report(id),
      reviewer_user_id UUID DEFAULT NULL REFERENCES doe_user(id),

      denial_reason TEXT DEFAULT NULL,
      approved_at TIMESTAMPTZ DEFAULT NULL,
      valid_until TIMESTAMPTZ DEFAULT NULL,
      correction_deadline TIMESTAMPTZ DEFAULT NULL,
      equality_report_content TEXT DEFAULT NULL,
      fines_started_at TIMESTAMPTZ DEFAULT NULL,

      CONSTRAINT report_equality_fk_type_chk
        CHECK (equality_report_id IS NULL OR type = 'SALARY')
    );

    CREATE TABLE company_report (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      company_id UUID NOT NULL REFERENCES company(id),
      report_id UUID NOT NULL REFERENCES report(id),
      parent_company_id UUID DEFAULT NULL REFERENCES company(id),

      name TEXT NOT NULL,
      national_id TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postcode TEXT NOT NULL,
      average_employee_count_from_rsk INTEGER NOT NULL,
      isat_category TEXT NOT NULL,

      UNIQUE (company_id, report_id)
    );

    CREATE TABLE report_criterion (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      title TEXT NOT NULL,
      weight DECIMAL(6, 4) NOT NULL,
      description TEXT NOT NULL,
      type report_criterion_type_enum NOT NULL,
      report_id UUID NOT NULL REFERENCES report(id)
    );

    CREATE TABLE report_sub_criterion (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      title TEXT NOT NULL,
      description TEXT NOT NULL,
      weight DECIMAL(6, 4) NOT NULL,
      report_criterion_id UUID NOT NULL REFERENCES report_criterion(id)
    );

    CREATE TABLE report_sub_criterion_step (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      "order" INTEGER NOT NULL,
      description TEXT NOT NULL,
      report_sub_criterion_id UUID NOT NULL REFERENCES report_sub_criterion(id),
      score DECIMAL(6, 2) NOT NULL
    );

    CREATE TABLE report_employee (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      ordinal INTEGER NOT NULL,
      education education_enum NOT NULL,
      field TEXT NOT NULL,
      department TEXT NOT NULL,
      start_date DATE NOT NULL,
      work_ratio DECIMAL(5, 4) NOT NULL,
      base_salary DECIMAL(14, 2) NOT NULL,
      additional_salary DECIMAL(14, 2) NOT NULL,
      bonus_salary DECIMAL(14, 2) DEFAULT NULL,
      gender gender_enum NOT NULL,
      report_employee_role_id UUID NOT NULL REFERENCES report_employee_role(id),
      report_id UUID NOT NULL REFERENCES report(id),
      score DECIMAL(6, 2) NOT NULL
    );

    CREATE TABLE report_employee_deviation (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      report_employee_id UUID NOT NULL REFERENCES report_employee(id),
      reason TEXT NOT NULL,
      action TEXT NOT NULL,
      signature_name TEXT NOT NULL,
      signature_role TEXT NOT NULL
    );

    CREATE TABLE report_employee_role_criterion_step (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      report_employee_role_id UUID NOT NULL REFERENCES report_employee_role(id),
      report_sub_criterion_step_id UUID NOT NULL REFERENCES report_sub_criterion_step(id),

      UNIQUE (report_employee_role_id, report_sub_criterion_step_id)
    );

    CREATE TABLE report_employee_personal_criterion_step (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      report_employee_id UUID NOT NULL REFERENCES report_employee(id),
      report_sub_criterion_step_id UUID NOT NULL REFERENCES report_sub_criterion_step(id),

      UNIQUE (report_employee_id, report_sub_criterion_step_id)
    );

    CREATE TABLE report_result (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      report_id UUID NOT NULL UNIQUE REFERENCES report(id),

      salary_difference_threshold_percent DECIMAL(5, 2) DEFAULT NULL,
      calculation_version TEXT NOT NULL DEFAULT 'v1',
      base_snapshot JSONB NOT NULL,
      full_snapshot JSONB NOT NULL
    );

    CREATE TABLE report_role_result (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      report_result_id UUID NOT NULL REFERENCES report_result(id),
      report_employee_role_id UUID NOT NULL REFERENCES report_employee_role(id),
      role_title TEXT NOT NULL,
      base_snapshot JSONB NOT NULL,
      full_snapshot JSONB NOT NULL
    );

    CREATE TABLE public_report (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      source_report_id UUID NOT NULL REFERENCES report(id),
      size_bucket TEXT NOT NULL,
      isat_category TEXT NOT NULL,
      published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      valid_until TIMESTAMPTZ NOT NULL,
    );

    CREATE TABLE config (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      key TEXT NOT NULL,
      value TEXT NOT NULL,
      description TEXT DEFAULT NULL,
      superseded_at TIMESTAMPTZ DEFAULT NULL
    );

    CREATE TABLE report_event (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      report_id UUID NOT NULL REFERENCES report(id),
      event_type report_event_type_enum NOT NULL,
      actor_user_id UUID DEFAULT NULL REFERENCES doe_user(id),
      report_status report_status_enum NOT NULL,
      from_status report_status_enum DEFAULT NULL,
      to_status report_status_enum DEFAULT NULL,
      assigned_user_id UUID DEFAULT NULL REFERENCES doe_user(id),

      CONSTRAINT report_event_status_changed_chk CHECK (
        event_type <> 'STATUS_CHANGED' OR (
          from_status IS NOT NULL
          AND to_status IS NOT NULL
          AND report_status = to_status
        )
      ),
      CONSTRAINT report_event_assigned_chk CHECK (
        event_type <> 'ASSIGNED' OR assigned_user_id IS NOT NULL
      )
    );

    CREATE TABLE report_comment (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ DEFAULT NULL,

      report_id UUID NOT NULL REFERENCES report(id),
      author_kind comment_author_kind_enum NOT NULL,
      author_user_id UUID DEFAULT NULL REFERENCES doe_user(id),
      visibility comment_visibility_enum NOT NULL,
      body TEXT NOT NULL,
      report_status report_status_enum NOT NULL,

      CONSTRAINT report_comment_reviewer_chk CHECK (
        author_kind <> 'REVIEWER' OR author_user_id IS NOT NULL
      ),
      CONSTRAINT report_comment_company_admin_chk CHECK (
        author_kind <> 'COMPANY_ADMIN' OR (
          author_user_id IS NULL AND visibility = 'EXTERNAL'
        )
      )
    );

    -- ============================================================
    -- Indexes
    -- ============================================================

    -- FK indexes (Postgres does not auto-index FK columns)
    CREATE INDEX company_report_parent_company_id_idx
      ON company_report (parent_company_id);
    CREATE INDEX company_report_report_id_idx
      ON company_report (report_id);

    CREATE INDEX report_equality_report_id_idx
      ON report (equality_report_id);
    CREATE INDEX report_reviewer_user_id_idx
      ON report (reviewer_user_id);

    CREATE INDEX report_criterion_report_id_idx
      ON report_criterion (report_id);
    CREATE INDEX report_sub_criterion_report_criterion_id_idx
      ON report_sub_criterion (report_criterion_id);
    CREATE INDEX report_sub_criterion_step_report_sub_criterion_id_idx
      ON report_sub_criterion_step (report_sub_criterion_id);

    CREATE INDEX report_employee_report_id_idx
      ON report_employee (report_id);
    CREATE INDEX report_employee_role_id_idx
      ON report_employee (report_employee_role_id);
    CREATE INDEX report_employee_deviation_report_employee_id_idx
      ON report_employee_deviation (report_employee_id);

    CREATE INDEX report_employee_role_criterion_step_step_idx
      ON report_employee_role_criterion_step (report_sub_criterion_step_id);
    CREATE INDEX report_employee_personal_criterion_step_step_idx
      ON report_employee_personal_criterion_step (report_sub_criterion_step_id);

    CREATE INDEX report_role_result_report_result_id_idx
      ON report_role_result (report_result_id);
    CREATE INDEX report_role_result_report_employee_role_id_idx
      ON report_role_result (report_employee_role_id);
    CREATE UNIQUE INDEX report_role_result_report_result_role_uidx
      ON report_role_result (report_result_id, report_employee_role_id);

    CREATE INDEX public_report_source_report_id_idx
      ON public_report (source_report_id);

    -- Only one active (non-superseded) entry per key at any time
    CREATE UNIQUE INDEX config_active_key_idx
      ON config (key)
      WHERE superseded_at IS NULL;

    CREATE INDEX report_event_report_id_idx
      ON report_event (report_id);
    CREATE INDEX report_event_actor_user_id_idx
      ON report_event (actor_user_id);
    CREATE INDEX report_event_assigned_user_id_idx
      ON report_event (assigned_user_id);

    CREATE INDEX report_comment_report_id_idx
      ON report_comment (report_id);
    CREATE INDEX report_comment_author_user_id_idx
      ON report_comment (author_user_id);

    -- Query-pattern indexes
    CREATE INDEX report_reviewer_queue_idx
      ON report (status, created_at)
      WHERE status IN ('SUBMITTED', 'IN_REVIEW');

    CREATE INDEX report_fines_cron_idx
      ON report (fines_started_at)
      WHERE fines_started_at IS NOT NULL
        AND status NOT IN ('APPROVED', 'SUPERSEDED');

    CREATE INDEX report_expiry_notify_idx
      ON report (valid_until)
      WHERE status = 'APPROVED';

    CREATE INDEX report_equality_gate_idx
      ON report (valid_until)
      WHERE type = 'EQUALITY' AND status = 'APPROVED';

    CREATE INDEX report_event_timeline_idx
      ON report_event (report_id, created_at);

    CREATE INDEX report_comment_timeline_idx
      ON report_comment (report_id, created_at)
      WHERE deleted_at IS NULL;

    -- ============================================================
    -- Triggers
    -- ============================================================

    -- Sync company.salary_report_required from RSK headcount unless
    -- the row is manually flagged via salary_report_required_override.
    CREATE OR REPLACE FUNCTION company_sync_salary_report_required()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.salary_report_required_override IS DISTINCT FROM TRUE THEN
        NEW.salary_report_required := (NEW.average_employee_count_from_rsk >= 50);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER company_sync_salary_report_required_trg
      BEFORE INSERT OR UPDATE ON company
      FOR EACH ROW
      EXECUTE FUNCTION company_sync_salary_report_required();

    COMMIT;

    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP TRIGGER IF EXISTS company_sync_salary_report_required_trg ON company;
    DROP FUNCTION IF EXISTS company_sync_salary_report_required();

    DROP TABLE IF EXISTS report_comment;
    DROP TABLE IF EXISTS report_event;
    DROP TABLE IF EXISTS config;
    DROP TABLE IF EXISTS public_report;
    DROP TABLE IF EXISTS report_role_result;
    DROP TABLE IF EXISTS report_result;
    DROP TABLE IF EXISTS report_employee_personal_criterion_step;
    DROP TABLE IF EXISTS report_employee_role_criterion_step;
    DROP TABLE IF EXISTS report_employee_deviation;
    DROP TABLE IF EXISTS report_employee;
    DROP TABLE IF EXISTS report_sub_criterion_step;
    DROP TABLE IF EXISTS report_sub_criterion;
    DROP TABLE IF EXISTS report_criterion;
    DROP TABLE IF EXISTS company_report;
    DROP TABLE IF EXISTS report;
    DROP TABLE IF EXISTS report_employee_role;
    DROP TABLE IF EXISTS company;
    DROP TABLE IF EXISTS doe_user;

    DROP TYPE IF EXISTS comment_author_kind_enum;
    DROP TYPE IF EXISTS comment_visibility_enum;
    DROP TYPE IF EXISTS report_event_type_enum;
    DROP TYPE IF EXISTS report_type_enum;
    DROP TYPE IF EXISTS report_status_enum;
    DROP TYPE IF EXISTS education_enum;
    DROP TYPE IF EXISTS report_criterion_type_enum;
    DROP TYPE IF EXISTS report_provider_enum;
    DROP TYPE IF EXISTS gender_enum;

    DROP EXTENSION IF EXISTS "uuid-ossp";

    COMMIT;
    `)
  },
}

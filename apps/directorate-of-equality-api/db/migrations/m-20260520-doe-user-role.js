'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- doe_user.role
    --
    -- Distinguishes ADMIN (full CRUD on users + reviewer actions) from
    -- EDITOR (reviewer actions only — no user management). Existing rows
    -- backfill to ADMIN: the current reviewer team retains full access,
    -- and new users created via POST /users must specify a role
    -- explicitly. The column default exists purely for the backfill;
    -- application-layer code is expected to set role on every insert.
    -- ============================================================

    CREATE TYPE doe_user_role_enum AS ENUM ('ADMIN', 'EDITOR');

    ALTER TABLE doe_user
      ADD COLUMN role doe_user_role_enum NOT NULL DEFAULT 'ADMIN';

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE doe_user DROP COLUMN role;
    DROP TYPE doe_user_role_enum;

    COMMIT;
    `)
  },
}

'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    CREATE TABLE config (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      key TEXT NOT NULL,
      value TEXT NOT NULL,
      description TEXT DEFAULT NULL,
      superseded_at TIMESTAMPTZ DEFAULT NULL
    );

    -- Only one active (non-superseded) entry per key at any time
    CREATE UNIQUE INDEX config_active_key_idx
      ON config (key)
      WHERE superseded_at IS NULL;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP TABLE IF EXISTS config;

    COMMIT;
    `)
  },
}

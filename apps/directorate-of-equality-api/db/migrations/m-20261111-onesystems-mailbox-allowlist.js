'use strict'

/**
 * The `onesystems_mailbox_allowlist` config row: the companies that may
 * receive notices in their island.is mailbox. `ONESYSTEMS_ENABLED` switches
 * the mailbox on for an environment; this row narrows it to named companies,
 * and every other company is treated as though the flag were off.
 *
 * Starts at `none`, so no environment sends anything to One until an admin
 * names a company. Dev talks to production One, so this is what keeps a dev
 * database's companies out of real mailboxes. Format: see
 * `libs/directorate-of-equality/modules/src/config/lib/mailbox-allowlist.ts`.
 *
 * A row rather than an env var so it can be changed through
 * `PATCH /config/onesystems_mailbox_allowlist` without a deploy.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO config (key, value, description)
      SELECT
        'onesystems_mailbox_allowlist',
        'none',
        'Companies that may receive notices in their island.is mailbox through OneSystems: none, * (all), or comma-separated kennitölur. Others get email, as with ONESYSTEMS_ENABLED off.'
      WHERE NOT EXISTS (
        SELECT 1 FROM config
         WHERE key = 'onesystems_mailbox_allowlist'
           AND superseded_at IS NULL
      );
    `)
  },

  async down(queryInterface) {
    // Every row of the key, history included: without the key the code reads
    // nobody, which is what `none` means.
    await queryInterface.sequelize.query(`
      DELETE FROM config WHERE key = 'onesystems_mailbox_allowlist';
    `)
  },
}

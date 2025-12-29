'use strict'

/**
 * Migration: Alter subscriber_payments table
 *
 * Changes:
 * - Remove: UNIQUE constraint on subscriber_id (to allow multiple payments per subscriber for renewals)
 * - Add: activated_by_national_id column (to track who initiated the subscription)
 */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Remove UNIQUE constraint on subscriber_id to allow multiple payments (renewals)
      ALTER TABLE subscriber_payments
      DROP CONSTRAINT IF EXISTS subscriber_payments_subscriber_id_key;

      -- Add activated_by_national_id column (NOT NULL)
      -- This tracks who initiated the subscription (may differ from subscriber when acting via delegation)
      ALTER TABLE subscriber_payments
      ADD COLUMN IF NOT EXISTS activated_by_national_id TEXT NOT NULL;

      -- Add comment for documentation
      COMMENT ON COLUMN subscriber_payments.activated_by_national_id IS
        'National ID of the actor who initiated the subscription. May differ from subscriber when acting via delegation.';

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Remove the activated_by_national_id column
      ALTER TABLE subscriber_payments
      DROP COLUMN IF EXISTS activated_by_national_id;

      -- Re-add UNIQUE constraint on subscriber_id
      -- Note: This may fail if there are duplicate subscriber_ids
      ALTER TABLE subscriber_payments
      ADD CONSTRAINT subscriber_payments_subscriber_id_key UNIQUE (subscriber_id);

      COMMIT;
    `)
  },
}

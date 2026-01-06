'use strict'

/**
 * Migration for C-4 and C-5 Critical Issues: Orphaned TBR Claims Prevention
 *
 * Adds status tracking columns to subscriber_payment and tbr_transaction tables
 * to enable "create before TBR call" pattern that prevents orphaned claims.
 *
 * New columns:
 * - status: 'PENDING' | 'CONFIRMED' | 'FAILED' - tracks TBR call state
 * - tbr_reference: Reference returned from TBR API (for correlation)
 * - tbr_error: Error message if TBR call failed (for debugging/retry)
 */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Add status columns to subscriber_payment table (C-4)
      ALTER TABLE subscriber_payment
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS tbr_reference TEXT,
        ADD COLUMN IF NOT EXISTS tbr_error TEXT;

      -- Create index for finding pending/failed payments that need processing
      CREATE INDEX IF NOT EXISTS idx_subscriber_payment_status
        ON subscriber_payment(status)
        WHERE status IN ('PENDING', 'FAILED');

      -- Add status columns to tbr_transaction table (C-5)
      ALTER TABLE tbr_transaction
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS tbr_reference TEXT,
        ADD COLUMN IF NOT EXISTS tbr_error TEXT;

      -- Create index for finding pending/failed transactions that need processing
      CREATE INDEX IF NOT EXISTS idx_tbr_transaction_status
        ON tbr_transaction(status)
        WHERE status IN ('PENDING', 'FAILED');

      -- Update existing records to CONFIRMED status (they were created successfully before this change)
      UPDATE subscriber_payment SET status = 'CONFIRMED' WHERE status = 'PENDING';
      UPDATE tbr_transaction SET status = 'CONFIRMED' WHERE status = 'PENDING';

      -- Add comments for documentation
      COMMENT ON COLUMN subscriber_payment.status IS 'TBR payment status: PENDING (before TBR call), CONFIRMED (TBR succeeded), FAILED (TBR error)';
      COMMENT ON COLUMN subscriber_payment.tbr_reference IS 'Reference ID returned from TBR API for payment correlation';
      COMMENT ON COLUMN subscriber_payment.tbr_error IS 'Error message from TBR API if payment creation failed';

      COMMENT ON COLUMN tbr_transaction.status IS 'TBR transaction status: PENDING (before TBR call), CONFIRMED (TBR succeeded), FAILED (TBR error)';
      COMMENT ON COLUMN tbr_transaction.tbr_reference IS 'Reference ID returned from TBR API for transaction correlation';
      COMMENT ON COLUMN tbr_transaction.tbr_error IS 'Error message from TBR API if transaction creation failed';

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Remove columns from subscriber_payment
      DROP INDEX IF EXISTS idx_subscriber_payment_status;
      ALTER TABLE subscriber_payment
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS tbr_reference,
        DROP COLUMN IF EXISTS tbr_error;

      -- Remove columns from tbr_transaction
      DROP INDEX IF EXISTS idx_tbr_transaction_status;
      ALTER TABLE tbr_transaction
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS tbr_reference,
        DROP COLUMN IF EXISTS tbr_error;

      COMMIT;
    `)
  },
}

'use strict'

/**
 * Migration: TBR Transaction Table Consolidation
 *
 * This migration consolidates subscriber_payment into tbr_transaction table and
 * creates a proper relationship structure:
 *
 * 1. tbr_transaction - unified transaction table for adverts and subscriptions
 * 2. subscriber_transaction - junction table linking subscribers to their transactions
 * 3. advert.transaction_id - direct FK for advert's transaction
 *
 * Phases:
 * 1. Prepare tbr_transaction table (add columns, remove constraints)
 * 2. Create subscriber_transaction junction table
 * 3. Add transaction_id to advert table
 * 4. Ensure subscription fee code exists
 * 5. Migrate subscriber_payment data
 * 6. Cleanup (drop old columns/tables)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      // ============================================================
      // PHASE 1: Prepare tbr_transaction table
      // ============================================================

      // 1.1 Add transaction_type column
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        ADD COLUMN IF NOT EXISTS transaction_type TEXT NOT NULL DEFAULT 'ADVERT';
        `,
        { transaction },
      )

      // 1.2 Add debtor_national_id column
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        ADD COLUMN IF NOT EXISTS debtor_national_id TEXT;
        `,
        { transaction },
      )

      // 1.2b Add status, tbr_reference, tbr_error columns (from C-5 orphan prevention)
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS tbr_reference TEXT,
        ADD COLUMN IF NOT EXISTS tbr_error TEXT;
        `,
        { transaction },
      )

      // 1.2c Update existing records to CREATED status (they were created before this change)
      await queryInterface.sequelize.query(
        `
        UPDATE tbr_transaction SET status = 'CREATED' WHERE status = 'PENDING';
        `,
        { transaction },
      )

      // 1.3 Remove UNIQUE constraint from advert_id (if exists)
      // First find the constraint name
      const [constraints] = await queryInterface.sequelize.query(
        `
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'tbr_transaction'
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%advert_id%';
        `,
        { transaction },
      )

      for (const constraint of constraints) {
        await queryInterface.sequelize.query(
          `ALTER TABLE tbr_transaction DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}";`,
          { transaction },
        )
      }

      // 1.4 Make advert_id nullable
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        ALTER COLUMN advert_id DROP NOT NULL;
        `,
        { transaction },
      )

      // 1.5 Make fee_code_id nullable (temporarily for migration)
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        ALTER COLUMN fee_code_id DROP NOT NULL;
        `,
        { transaction },
      )

      // 1.6 Backfill debtor_national_id from advert for existing records
      await queryInterface.sequelize.query(
        `
        UPDATE tbr_transaction t
        SET debtor_national_id = a.created_by_national_id
        FROM advert a
        WHERE t.advert_id = a.id
          AND t.debtor_national_id IS NULL;
        `,
        { transaction },
      )

      // 1.7 Add index on transaction_type
      await queryInterface.sequelize.query(
        `
        CREATE INDEX IF NOT EXISTS idx_tbr_transaction_type
        ON tbr_transaction(transaction_type);
        `,
        { transaction },
      )

      // ============================================================
      // PHASE 2: Create subscriber_transaction junction table
      // ============================================================

      await queryInterface.sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS subscriber_transaction (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subscriber_id UUID NOT NULL REFERENCES legal_gazette_subscribers(id) ON DELETE CASCADE,
          transaction_id UUID NOT NULL REFERENCES tbr_transaction(id) ON DELETE CASCADE,
          activated_by_national_id TEXT NOT NULL,
          is_current BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          deleted_at TIMESTAMP WITH TIME ZONE
        );
        `,
        { transaction },
      )

      // Add indexes
      await queryInterface.sequelize.query(
        `
        CREATE INDEX IF NOT EXISTS idx_subscriber_transaction_subscriber_id
        ON subscriber_transaction(subscriber_id);

        CREATE INDEX IF NOT EXISTS idx_subscriber_transaction_transaction_id
        ON subscriber_transaction(transaction_id);

        CREATE INDEX IF NOT EXISTS idx_subscriber_transaction_is_current
        ON subscriber_transaction(subscriber_id, is_current) WHERE is_current = true;
        `,
        { transaction },
      )

      // ============================================================
      // PHASE 3: Add transaction_id to advert table
      // ============================================================

      await queryInterface.sequelize.query(
        `
        ALTER TABLE advert
        ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES tbr_transaction(id);
        `,
        { transaction },
      )

      // Backfill advert.transaction_id from existing tbr_transaction records
      await queryInterface.sequelize.query(
        `
        UPDATE advert a
        SET transaction_id = t.id
        FROM tbr_transaction t
        WHERE t.advert_id = a.id
          AND a.transaction_id IS NULL;
        `,
        { transaction },
      )

      // Add index
      await queryInterface.sequelize.query(
        `
        CREATE INDEX IF NOT EXISTS idx_advert_transaction_id
        ON advert(transaction_id);
        `,
        { transaction },
      )

      // ============================================================
      // PHASE 4: Ensure subscription fee code exists
      // ============================================================

      // Check if subscription fee code exists, create if not
      const subscriptionFeeCode = process.env.LG_SUBSCRIPTION_FEE_CODE || 'RL401'
      const subscriptionAmount = parseInt(
        process.env.LG_SUBSCRIPTION_AMOUNT || '4500',
        10,
      )

      // Check if subscription fee code already exists
      const [existingFeeCode] = await queryInterface.sequelize.query(
        `
        SELECT id FROM tbr_fee_code WHERE fee_code = :feeCode LIMIT 1;
        `,
        {
          transaction,
          replacements: { feeCode: subscriptionFeeCode },
        },
      )

      if (existingFeeCode.length === 0) {
        await queryInterface.sequelize.query(
          `
          INSERT INTO tbr_fee_code (id, fee_code, description, value, is_multiplied, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            :feeCode,
            'Áskrift að Lögbirtingablaðinu',
            :amount,
            false,
            NOW(),
            NOW()
          );
          `,
          {
            transaction,
            replacements: {
              feeCode: subscriptionFeeCode,
              amount: subscriptionAmount,
            },
          },
        )
      }

      // ============================================================
      // PHASE 5: Migrate subscriber_payment data
      // ============================================================

      // 5.0 Add status columns to subscriber_payments if they don't exist
      // (These would have been added by orphan prevention migration, but we're consolidating)
      await queryInterface.sequelize.query(
        `
        ALTER TABLE subscriber_payments
          ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'CREATED',
          ADD COLUMN IF NOT EXISTS tbr_reference TEXT,
          ADD COLUMN IF NOT EXISTS tbr_error TEXT;
        `,
        { transaction },
      )

      // 5.1 Get the fee_code_id for subscriptions
      const [[feeCodeResult]] = await queryInterface.sequelize.query(
        `
        SELECT id FROM tbr_fee_code WHERE fee_code = :feeCode;
        `,
        {
          transaction,
          replacements: { feeCode: subscriptionFeeCode },
        },
      )

      if (feeCodeResult) {
        // 5.2 Insert subscriber_payment records into tbr_transaction
        await queryInterface.sequelize.query(
          `
          INSERT INTO tbr_transaction (
            id,
            transaction_type,
            fee_code_id,
            fee_code_multiplier,
            total_price,
            charge_base,
            charge_category,
            debtor_national_id,
            paid_at,
            status,
            tbr_reference,
            tbr_error,
            created_at,
            updated_at
          )
          SELECT
            sp.id,
            'SUBSCRIPTION',
            :feeCodeId,
            1,
            sp.amount,
            sp.charge_base,
            sp.charge_category,
            s.national_id,
            sp.paid_at,
            sp.status,
            sp.tbr_reference,
            sp.tbr_error,
            sp.created_at,
            sp.updated_at
          FROM subscriber_payments sp
          JOIN legal_gazette_subscribers s ON sp.subscriber_id = s.id
          ON CONFLICT (id) DO NOTHING;
          `,
          {
            transaction,
            replacements: { feeCodeId: feeCodeResult.id },
          },
        )

        // 5.3 Create subscriber_transaction junction records
        await queryInterface.sequelize.query(
          `
          INSERT INTO subscriber_transaction (
            subscriber_id,
            transaction_id,
            activated_by_national_id,
            is_current,
            created_at,
            updated_at
          )
          SELECT
            sp.subscriber_id,
            sp.id,
            sp.activated_by_national_id,
            false,
            sp.created_at,
            sp.updated_at
          FROM subscriber_payments sp
          ON CONFLICT DO NOTHING;
          `,
          { transaction },
        )

        // 5.4 Mark the latest transaction as current for each subscriber
        await queryInterface.sequelize.query(
          `
          WITH latest_transactions AS (
            SELECT DISTINCT ON (subscriber_id)
              id
            FROM subscriber_transaction
            ORDER BY subscriber_id, created_at DESC
          )
          UPDATE subscriber_transaction st
          SET is_current = true
          FROM latest_transactions lt
          WHERE st.id = lt.id;
          `,
          { transaction },
        )
      }

      // ============================================================
      // PHASE 6: Cleanup
      // ============================================================

      // 6.1 Drop advert_id column from tbr_transaction
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        DROP COLUMN IF EXISTS advert_id;
        `,
        { transaction },
      )

      // 6.2 Make fee_code_id NOT NULL again (all records should have it now)
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        ALTER COLUMN fee_code_id SET NOT NULL;
        `,
        { transaction },
      )

      // 6.3 Make debtor_national_id NOT NULL
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        ALTER COLUMN debtor_national_id SET NOT NULL;
        `,
        { transaction },
      )

      // 6.4 Drop subscriber_payments table
      await queryInterface.sequelize.query(
        `
        DROP TABLE IF EXISTS subscriber_payments;
        `,
        { transaction },
      )

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      // Recreate subscriber_payments table
      await queryInterface.sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS subscriber_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subscriber_id UUID NOT NULL REFERENCES legal_gazette_subscribers(id),
          activated_by_national_id TEXT NOT NULL,
          amount NUMERIC NOT NULL,
          charge_base TEXT NOT NULL,
          charge_category TEXT NOT NULL,
          fee_code TEXT NOT NULL,
          paid_at TIMESTAMP WITH TIME ZONE,
          status TEXT NOT NULL DEFAULT 'PENDING',
          tbr_reference TEXT,
          tbr_error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          deleted_at TIMESTAMP WITH TIME ZONE
        );
        `,
        { transaction },
      )

      // Migrate data back from tbr_transaction to subscriber_payments
      await queryInterface.sequelize.query(
        `
        INSERT INTO subscriber_payments (
          id,
          subscriber_id,
          activated_by_national_id,
          amount,
          charge_base,
          charge_category,
          fee_code,
          paid_at,
          status,
          tbr_reference,
          tbr_error,
          created_at,
          updated_at
        )
        SELECT
          t.id,
          st.subscriber_id,
          st.activated_by_national_id,
          t.total_price,
          t.charge_base,
          t.charge_category,
          fc.fee_code,
          t.paid_at,
          t.status,
          t.tbr_reference,
          t.tbr_error,
          t.created_at,
          t.updated_at
        FROM tbr_transaction t
        JOIN subscriber_transaction st ON st.transaction_id = t.id
        JOIN tbr_fee_code fc ON fc.id = t.fee_code_id
        WHERE t.transaction_type = 'SUBSCRIPTION';
        `,
        { transaction },
      )

      // Add advert_id back to tbr_transaction
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        ADD COLUMN advert_id UUID REFERENCES advert(id);
        `,
        { transaction },
      )

      // Backfill advert_id from advert.transaction_id
      await queryInterface.sequelize.query(
        `
        UPDATE tbr_transaction t
        SET advert_id = a.id
        FROM advert a
        WHERE a.transaction_id = t.id;
        `,
        { transaction },
      )

      // Remove SUBSCRIPTION transactions from tbr_transaction
      await queryInterface.sequelize.query(
        `
        DELETE FROM tbr_transaction
        WHERE transaction_type = 'SUBSCRIPTION';
        `,
        { transaction },
      )

      // Drop subscriber_transaction table
      await queryInterface.sequelize.query(
        `
        DROP TABLE IF EXISTS subscriber_transaction;
        `,
        { transaction },
      )

      // Drop transaction_id from advert
      await queryInterface.sequelize.query(
        `
        ALTER TABLE advert
        DROP COLUMN IF EXISTS transaction_id;
        `,
        { transaction },
      )

      // Drop new columns from tbr_transaction
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        DROP COLUMN IF EXISTS transaction_type,
        DROP COLUMN IF EXISTS debtor_national_id;
        `,
        { transaction },
      )

      // Make advert_id NOT NULL and UNIQUE again
      await queryInterface.sequelize.query(
        `
        ALTER TABLE tbr_transaction
        ALTER COLUMN advert_id SET NOT NULL;

        ALTER TABLE tbr_transaction
        ADD CONSTRAINT tbr_transaction_advert_id_unique UNIQUE (advert_id);
        `,
        { transaction },
      )

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
}

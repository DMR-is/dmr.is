# Mailbox delivery

Delivers a notice to a company's island.is Stafrænt pósthólf through
Jafnréttisstofa's case system, One: CreateCase, then CreateDocument, then
SendDocToIslandIs. Each delivery is one row in `mailbox_delivery`.

Nothing calls this yet. Every notice kind is unconfigured (see
`mailbox-delivery.kinds.ts`), so `deliverToMailbox` throws before it writes a
row. It also does nothing unless `ONESYSTEMS_ENABLED` is `true`. That flag is
checked here, not in the OneSystems client: the client is not gated, so any new
consumer of the client must check the flag itself.

## For callers

- Build the key with `buildMailboxDeliveryIdempotencyKey`. Its format is
  `mailbox-delivery:v1:<kind>:<companyId>:<discriminator>`. The company id is
  lowercased and the discriminator upper-cased (1-64 letters, digits, `.`,
  `_` or `-`), so `salary-20270301` and `SALARY-20270301` give the same key.
  The discriminator must come from stored data, e.g. the report kind and its
  due date as `YYYYMMDD`. The key is the only guard against sending the same
  notice twice. `deliverToMailbox` refuses, before writing anything, a key
  that does not start with `mailbox-delivery:v1:<kind>:<companyId>:` for the
  call's own kind and company.
- Deliver **sequentially**: await one delivery before starting the next.
  Every state write takes its own pool connection (`transaction: null`), so it
  cannot be rolled back with the caller's work. Holding a transaction while
  calling it, such as the cron lock (`pg_try_advisory_xact_lock` inside
  `sequelize.transaction()`), is allowed and costs one extra pool connection.
  Deliveries run in parallel each take one more and can exhaust the pool
  (`max: 5`).
- The company must already be committed.
- A failure is recorded on the row (FAILED or UNCERTAIN) and rethrown.
- `last_error` is cut to 500 characters and may contain One's own
  `ErrorMessage`, which can echo the recipient's kennitala, name or the
  subject. Never put it in a log or show it in a UI unfiltered.
  `last_error_number` is One's `ErrorNumber` as `toLoggableErrorNumber` from
  `@dmr.is/clients-onesystems` returns it: the code itself, or
  `[not a code, withheld]` when it is not code-shaped or contains anything
  kennitala-shaped. The raw value is never stored.

## Statuses

| Status             | Meaning                                                                                                                                                         | What happens next                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `PENDING`          | Row written, nothing sent to One yet.                                                                                                                           | The next call starts it.                                                    |
| `CASE_CREATED`     | One has a case (`one_case_item_id`).                                                                                                                            | The next call creates the document.                                         |
| `DOCUMENT_CREATED` | The PDF is filed under the case (`one_document_item_id`).                                                                                                       | The next call sends it.                                                     |
| `SENT`             | One confirmed the send (`sent_at`). `island_is_document_id` is set too, unless One confirmed without an `ItemID`.                                               | Nothing. A repeat call returns SENT with `alreadySent: true`.               |
| `FAILED`           | One certainly did not act on the failed call: a CreateCase failure, a failed render, or a CreateDocument or send rejected before it reached One's action.       | The next call with the same key resumes from the saved ids.                 |
| `UNCERTAIN`        | Whether One acted is unknown: a timeout, a 5xx, a `Success: false`, a response with no usable id, or a process that died mid-call (`in_flight_step` still set). | **Nothing. No code path leaves UNCERTAIN.** A person reconciles it (below). |

The saved ids and `sent_at` decide what runs next, not `status`. A `FAILED`
row that already has `one_document_item_id` resumes at the send.

`Success: false` from CreateDocument or SendDocToIslandIs is UNCERTAIN, not
FAILED. One calls island.is itself inside SendDocToIslandIs, so a
`Success: false` may come back after island.is registered the document. Error
numbers that OneSystems confirms are raised before anything is filed or sent go
into `ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS` in the client, which makes them FAILED.
That list is empty until OneSystems confirms it.

CreateCase is retried after any failure, on the assumption that One
finds-or-creates the case. The spec does not document this
(TODO(OneSystems)). If the assumption is wrong, a retry leaves an orphan case in
One. It never causes a second send. A case id that loses the race to be saved
is logged (`discardedCaseItemId`).

## Reconciling an UNCERTAIN row

Every id One returns is logged with the `deliveryId` as soon as the call
returns, before it is saved. The log lines read
`Mailbox delivery <id>: <operation> returned`. So even when the save failed,
the id is in the logs.

1. List the rows. `in_flight_step` is always NULL on an UNCERTAIN row (a
   CHECK forces it), so the uncertain step is read off the saved ids instead:

   ```sql
   SELECT id, company_id, kind, idempotency_key,
          CASE WHEN one_document_item_id IS NULL
               THEN 'CREATE_DOCUMENT' ELSE 'SEND_DOC_TO_ISLAND_IS'
          END AS uncertain_step,
          one_case_item_id, one_document_item_id, island_is_document_id,
          sent_at, last_error_number, attempts, last_attempt_at
   FROM mailbox_delivery
   WHERE status = 'UNCERTAIN'
   ORDER BY last_attempt_at;
   ```

   `uncertain_step` = `SEND_DOC_TO_ISLAND_IS` can also mean the row was
   interrupted at CreateDocument and a late reply saved the document id
   afterwards: then the send may never have been attempted at all.
   `last_error` says which (`Interrupted during CREATE_DOCUMENT: ...`).

   `last_error` is left out on purpose: it may hold One's message, which can
   echo the recipient's details. Read it for one row at a time, and do not
   paste it into a ticket or a chat.

   Rows whose process died mid-call are not UNCERTAIN yet: they still have
   `in_flight_step` set, and become UNCERTAIN only when the next call with
   their key claims them. Find them with:

   ```sql
   SELECT id, company_id, kind, idempotency_key, status, in_flight_step,
          one_case_item_id, one_document_item_id, lease_expires_at,
          attempts, last_attempt_at
   FROM mailbox_delivery
   WHERE in_flight_step IS NOT NULL
     AND (lease_expires_at IS NULL OR lease_expires_at < now())
   ORDER BY last_attempt_at;
   ```

   A row with a live lease is still in its call; leave it alone. Treat each
   row this finds as UNCERTAIN. Either call `deliverToMailbox` again with the
   same key, which marks it UNCERTAIN without calling One, or mark it by hand,
   then reconcile it like any other UNCERTAIN row:

   ```sql
   UPDATE mailbox_delivery
   SET status = 'UNCERTAIN',
       in_flight_step = NULL,
       lease_token = NULL, lease_expires_at = NULL,
       last_error = 'Interrupted during ' || in_flight_step || ': marked by <name> on <date>'
   WHERE id = '<delivery id>'
     AND in_flight_step IS NOT NULL
     AND (lease_expires_at IS NULL OR lease_expires_at < now());
   ```

2. Find the ids. Use the saved columns. For any id that is missing, search the
   logs for the `deliveryId`.

   - `sent_at` set: a late reply confirmed the send after the row became
     UNCERTAIN. It was sent. Go to step 4, as SENT.
   - `one_document_item_id` NULL: the outcome of CreateDocument is unknown.
     Look in One under the case (`one_case_item_id`) for a document with the
     row's subject.
   - `one_document_item_id` set: the outcome of the send is unknown. Look up
     that document in One and check whether it was sent to island.is.

3. Ask Jafnréttisstofa or OneSystems to check in One, or check island.is,
   whenever One does not show it clearly.

4. Set the status by hand, each in its own statement. Match on `status` too,
   so a row that has changed since you looked is left alone. Clear the lease in
   the same statement.

   It was sent:

   ```sql
   UPDATE mailbox_delivery
   SET status = 'SENT',
       one_document_item_id = COALESCE(one_document_item_id, '<document ItemID>'),
       sent_at = COALESCE(sent_at, '<when it was sent>'),
       island_is_document_id = COALESCE(island_is_document_id, '<id, or leave NULL>'),
       lease_token = NULL, lease_expires_at = NULL,
       last_error = 'Reconciled by <name> on <date>: sent'
   WHERE id = '<delivery id>' AND status = 'UNCERTAIN';
   ```

   A row that went UNCERTAIN at CreateDocument has no
   `one_document_item_id`, and the SENT CHECK rejects a SENT row without one.
   Fill it with the document's `ItemID` from One: a document that was sent
   exists in One, so ask Jafnréttisstofa or OneSystems for it if you cannot see
   it yourself. Never make one up. If nobody can find it, leave the row
   UNCERTAIN. The `COALESCE` keeps an id the row already has.

   The document exists in One but was not sent. Save its id, so the next call
   sends it instead of filing a second copy:

   ```sql
   UPDATE mailbox_delivery
   SET status = 'FAILED',
       one_document_item_id = COALESCE(one_document_item_id, '<document ItemID>'),
       lease_token = NULL, lease_expires_at = NULL,
       last_error = 'Reconciled by <name> on <date>: filed, not sent'
   WHERE id = '<delivery id>' AND status = 'UNCERTAIN' AND sent_at IS NULL;
   ```

   One did nothing (no document, or not sent):

   ```sql
   UPDATE mailbox_delivery
   SET status = 'FAILED',
       lease_token = NULL, lease_expires_at = NULL,
       last_error = 'Reconciled by <name> on <date>: One did not act'
   WHERE id = '<delivery id>' AND status = 'UNCERTAIN' AND sent_at IS NULL;
   ```

   A `FAILED` row is resumed by the next `deliverToMailbox` call with **the
   same idempotency key**. The CHECK constraints reject a status that gets
   ahead of its ids. For example, SENT needs `one_case_item_id`,
   `one_document_item_id` and `sent_at`, and a row with `sent_at` can only be
   SENT or UNCERTAIN, never FAILED (which would be resumed and sent again).

### Never mint a new idempotency key to "retry"

The idempotency key is the only thing that stops a second delivery of the same
notice. A new key makes a new row with no ids, so it runs CreateCase,
CreateDocument and SendDocToIslandIs from scratch. If the UNCERTAIN call
actually succeeded, the company gets the statutory notice twice. Always
reconcile the existing row, then call again with the same key.

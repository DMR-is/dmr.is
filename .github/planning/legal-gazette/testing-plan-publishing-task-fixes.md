# Testing Plan: Publishing Task Event Emission Fixes

**Date**: January 14, 2026  
**Related**: [findings-publishing-task-cpu-spike.md](./findings-publishing-task-cpu-spike.md)  
**Status**: 🟡 **Ready for Execution**

---

## Overview

This document outlines comprehensive testing strategies for validating the fixes to `publishing.task.ts` that address the 100% CPU crash issue. Tests are organized into three tiers:

1. ✅ **Unit Tests** - Automated, fast feedback (already implemented)
2. 🔵 **Integration Tests** - Manual verification of end-to-end flows
3. 🟣 **Load Tests** - Stress testing under realistic production load

---

## 1. Unit Tests (✅ Implemented)

### Location
- `apps/legal-gazette-api/src/modules/advert/tasks/publishing/publishing.task.spec.ts`

### Coverage

| Test Suite | Test Count | Purpose |
|------------|------------|---------|
| Event Emission | 6 tests | Verify `emitAsync()` usage and error handling |
| Multiple Publications | 2 tests | Verify correct advert fetched per publication |
| Publication Number | 1 test | Verify no unnecessary locks |
| Publication Update | 2 tests | Verify `update()` pattern |
| Error Scenarios | 2 tests | Verify graceful failure handling |
| Transaction Semantics | 1 test | Verify events emit inside transaction |

### Running Unit Tests

```bash
# Run all publishing task tests
nx test legal-gazette-api --testFile=src/modules/advert/tasks/publishing/publishing.task.spec.ts

# Run specific test suite
nx test legal-gazette-api --testFile=src/modules/advert/tasks/publishing/publishing.task.spec.ts --testNamePattern="Event Emission"

# Run with coverage
nx test legal-gazette-api --testFile=src/modules/advert/tasks/publishing/publishing.task.spec.ts --coverage
```

### Expected Results
- ✅ All 14 tests pass
- ✅ No unhandled promise rejections
- ✅ `emitAsync` is called for `ADVERT_PUBLISHED` events
- ✅ Events emitted inside transaction, not in `afterCommit`

---

## 2. Integration Tests (🔵 Manual)

### Prerequisites

1. **Environment**: Dev or staging environment with:
   - Legal Gazette API running
   - PostgreSQL database
   - TBR mock service or actual TBR endpoint
   - S3 or mock S3 for PDF storage
   - Email service configured

2. **Test Data**:
   - Multiple adverts with different types
   - Publications scheduled for "today" (current date)
   - At least one advert without `publicationNumber` set

3. **Monitoring Tools**:
   - Container metrics (CPU, memory)
   - Application logs (filtered by `PublishingTaskService`)
   - Database query monitoring

### Test Scenarios

#### 2.1 Happy Path - Successful Publishing

**Objective**: Verify normal publishing flow works without CPU spike

**Setup**:
```sql
-- Create test adverts with publications scheduled for today
INSERT INTO ADVERT (id, title, status_id, type_id, category_id, ...) VALUES (...);
INSERT INTO ADVERT_PUBLICATION (id, advert_id, scheduled_at, version) 
VALUES ('pub-1', 'advert-1', NOW(), 'A');
```

**Steps**:
1. Ensure publications are scheduled for current day
2. Trigger cron job manually OR wait for hourly run:
   ```bash
   # Via API endpoint (if exposed)
   curl -X POST http://localhost:4100/api/v1/tasks/publishing/trigger
   
   # Or set system time to trigger cron
   ```
3. Monitor container CPU usage during execution
4. Check application logs for:
   - "Running publishing task"
   - "Found X publications to be published"
   - "Processing publication 1 of X"
   - "Published advert publication with ID: ..."

**Expected Results**:
- ✅ CPU stays below 50% during execution
- ✅ Container does not crash
- ✅ All publications marked as published (`publishedAt` populated)
- ✅ Adverts updated with `publicationNumber` and `statusId = PUBLISHED`
- ✅ TBR transactions created (if version A)
- ✅ PDFs generated in S3
- ✅ Emails sent to communication channels

**Validation Queries**:
```sql
-- Verify publications published
SELECT id, advert_id, scheduled_at, published_at 
FROM ADVERT_PUBLICATION 
WHERE published_at IS NOT NULL
ORDER BY published_at DESC
LIMIT 5;

-- Verify adverts updated
SELECT id, title, publication_number, status_id
FROM ADVERT
WHERE status_id = (SELECT id FROM STATUS WHERE slug = 'published')
ORDER BY updated_at DESC
LIMIT 5;

-- Verify TBR transactions created
SELECT id, advert_id, transaction_type, status, total_price
FROM TBR_TRANSACTION
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

#### 2.2 Error Handling - TBR Payment Failure

**Objective**: Verify transaction rollback when TBR payment fails

**Setup**:
```bash
# Configure TBR mock to fail
export TBR_MOCK_MODE=fail_on_next_payment

# Or temporarily disable TBR endpoint
```

**Steps**:
1. Create publication scheduled for today
2. Trigger publishing job
3. Monitor logs for TBR failure

**Expected Results**:
- ✅ Error logged: "TBR payment failed, marking transaction as FAILED"
- ✅ Transaction **rolled back** - publication NOT marked as published
- ✅ Advert status remains unchanged
- ✅ Container continues running (no crash)
- ✅ CPU returns to normal after error

**Validation Queries**:
```sql
-- Verify publication NOT published
SELECT id, published_at 
FROM ADVERT_PUBLICATION 
WHERE id = 'test-pub-id';
-- Should show published_at = NULL

-- Verify TBR transaction status
SELECT id, status, tbr_error
FROM TBR_TRANSACTION
WHERE status = 'FAILED'
ORDER BY created_at DESC
LIMIT 1;
```

---

#### 2.3 Multiple Publications, Different Adverts

**Objective**: Verify each publication gets its correct advert

**Setup**:
```sql
-- Create 3 different adverts
INSERT INTO ADVERT (id, title, ...) VALUES 
('advert-a', 'Skipti A', ...),
('advert-b', 'Skipti B', ...),
('advert-c', 'Skipti C', ...);

-- Create publications for each
INSERT INTO ADVERT_PUBLICATION (id, advert_id, scheduled_at, version) VALUES
('pub-a', 'advert-a', NOW(), 'A'),
('pub-b', 'advert-b', NOW(), 'A'),
('pub-c', 'advert-c', NOW(), 'A');
```

**Steps**:
1. Trigger publishing job
2. Check logs for each publication processing

**Expected Results**:
- ✅ Log shows "Processing publication 1 of 3" with advertId = 'advert-a'
- ✅ Log shows "Processing publication 2 of 3" with advertId = 'advert-b'
- ✅ Log shows "Processing publication 3 of 3" with advertId = 'advert-c'
- ✅ Each advert gets unique `publicationNumber`
- ✅ All three adverts marked as PUBLISHED

**Validation**:
```sql
SELECT 
  ap.id as publication_id,
  ap.advert_id,
  a.title,
  a.publication_number,
  ap.published_at
FROM ADVERT_PUBLICATION ap
JOIN ADVERT a ON a.id = ap.advert_id
WHERE ap.published_at > NOW() - INTERVAL '1 hour'
ORDER BY ap.published_at;
```

---

#### 2.4 CPU Spike Detection

**Objective**: Verify no CPU spike occurs (regression test)

**Setup**:
- Baseline CPU metrics before test
- Create 5-10 publications scheduled for today

**Steps**:
1. Start monitoring:
   ```bash
   # Monitor container CPU
   docker stats legal-gazette-api --no-stream --format "{{.CPUPerc}}"
   
   # Or via kubectl (if Kubernetes)
   kubectl top pod legal-gazette-api-xxx
   ```
2. Trigger publishing job
3. Continue monitoring for 2 minutes after job starts

**Expected Results**:
- ✅ CPU spike to 20-40% during processing (normal)
- ✅ CPU returns to <10% within 30 seconds after completion
- ✅ No sustained 100% CPU
- ✅ Container remains responsive

**Alert Thresholds**:
- 🟡 Warning: CPU >60% for >15 seconds
- 🔴 Failure: CPU >80% for >30 seconds
- 🔴 Critical: Container crash or OOM kill

---

#### 2.5 Concurrent Publishing Prevention

**Objective**: Verify distributed lock prevents concurrent execution

**Setup**:
- Two instances of Legal Gazette API running

**Steps**:
1. Trigger publishing job on both instances simultaneously:
   ```bash
   # Instance 1
   curl -X POST http://instance-1:4100/api/v1/tasks/publishing/trigger &
   
   # Instance 2
   curl -X POST http://instance-2:4100/api/v1/tasks/publishing/trigger &
   ```
2. Check logs on both instances

**Expected Results**:
- ✅ One instance logs: "Running publishing task at ..."
- ✅ Other instance logs: "PublishingTask skipped (lock held by another container)"
- ✅ Publications published only once (no duplicates)
- ✅ No race conditions in publication number generation

---

## 3. Load Tests (🟣 Stress Testing)

### Objective
Validate system stability under high load to ensure the CPU spike fix works at scale.

### Tools
- **k6** or **Apache JMeter** for load generation
- **Grafana + Prometheus** for metrics visualization
- **Seq or Datadog** for log aggregation

### Test Scenarios

#### 3.1 High Volume Publishing

**Configuration**:
- 100 publications scheduled simultaneously
- All scheduled for same time window
- Mix of advert types (some with TBR, some without)

**Load Profile**:
```javascript
// k6 load test configuration
export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '2m', target: 10 },   // Sustained load
    { duration: '30s', target: 0 },   // Ramp down
  ],
}
```

**Metrics to Monitor**:
| Metric | Healthy Range | Alert Threshold |
|--------|---------------|-----------------|
| CPU Usage | <50% | >70% for 30s |
| Memory Usage | <1GB | >2GB |
| DB Connection Pool | <50% capacity | >80% |
| Event Loop Lag | <10ms | >100ms |
| Request Latency (p95) | <2s | >5s |
| Error Rate | 0% | >1% |

**Expected Results**:
- ✅ All 100 publications processed successfully
- ✅ CPU stays below 70% throughout test
- ✅ No container restarts or crashes
- ✅ Event emission completes for all publications
- ✅ Transaction rollbacks work correctly for failures

#### 3.2 Sustained Load Over Time

**Configuration**:
- Simulate hourly cron job over 24-hour period
- 10-20 publications per hour
- Varying publication counts (peak hours vs off-hours)

**Load Profile**:
```
Hour 0-6:   5 publications/hour   (low traffic)
Hour 6-9:   20 publications/hour  (morning peak)
Hour 9-17:  10 publications/hour  (daytime)
Hour 17-20: 15 publications/hour  (evening peak)
Hour 20-24: 5 publications/hour   (night)
```

**Metrics to Monitor**:
- Memory leak detection (memory should be stable over 24h)
- Database connection pool exhaustion
- S3 upload success rate
- Email delivery rate
- TBR transaction success rate

**Expected Results**:
- ✅ Stable memory usage over 24 hours (no leaks)
- ✅ Consistent performance across all hours
- ✅ No degradation after multiple hours
- ✅ Database connections properly released

#### 3.3 Failure Recovery Testing

**Configuration**:
- Inject failures at different stages:
  - TBR service timeout (50% of requests)
  - S3 upload failure (20% of requests)
  - Database connection loss (5% of transactions)

**Steps**:
1. Configure chaos engineering tool (e.g., Chaos Monkey)
2. Run publishing job with 50 publications
3. Inject random failures
4. Monitor recovery behavior

**Expected Results**:
- ✅ Failed publications logged with context
- ✅ Transactions rolled back on failure
- ✅ Retries work for transient failures
- ✅ System continues processing remaining publications
- ✅ No cascading failures

---

## 4. Observability & Monitoring

### Logs to Monitor

**Success Path**:
```
[INFO] Running publishing task at 2026-01-14T10:00:00Z
[INFO] Found 5 publications to be published
[INFO] Processing publication 1 of 5 (advertId: xxx, publicationId: yyy)
[INFO] Published advert publication with ID: yyy
```

**Error Path**:
```
[ERROR] Error occurred while emitting ADVERT_PUBLISHED event
  context: PublicationService
  advertId: xxx
  publicationId: yyy
  error: TBR payment failed

[ERROR] Failed to publish advert publication
  publicationId: yyy
  advertId: xxx
  error: [error details]
```

### Metrics to Track

```yaml
# Prometheus metrics (example)
publishing_task_duration_seconds: Histogram of job execution time
publishing_task_publications_processed: Counter of successfully published
publishing_task_publications_failed: Counter of failed publications
publishing_task_event_emission_duration_seconds: Histogram of event emission time
publishing_task_cpu_usage_percent: Gauge of container CPU during execution
```

### Alerts to Configure

```yaml
# Alert when CPU spikes
- alert: PublishingTaskCPUSpike
  expr: container_cpu_usage_percent{container="legal-gazette-api"} > 80
  for: 30s
  annotations:
    summary: "Publishing task causing CPU spike"

# Alert when publications fail
- alert: PublishingTaskHighFailureRate
  expr: rate(publishing_task_publications_failed[5m]) > 0.1
  annotations:
    summary: "High failure rate in publishing task"

# Alert when task takes too long
- alert: PublishingTaskSlowExecution
  expr: publishing_task_duration_seconds > 300
  annotations:
    summary: "Publishing task taking longer than expected"
```

---

## 5. Rollback Plan

If issues are detected during testing:

### Immediate Actions
1. **Stop the job**: Disable the cron schedule
   ```sql
   UPDATE cron_jobs SET enabled = false WHERE job_name = 'publishing-job';
   ```

2. **Revert code**: Roll back to commit before changes
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Manual publishing**: Use `publication.service.ts` directly for urgent publications
   ```typescript
   // This uses the correct emitAsync pattern
   await publicationService.publishAdvertPublication(publicationId);
   ```

### Investigation
1. Export logs for analysis
2. Check database for partial transactions
3. Verify no publications marked as published incorrectly
4. Review CPU/memory metrics during incident

---

## 6. Success Criteria

| Criteria | Target | Measurement |
|----------|--------|-------------|
| **Unit Tests** | 100% pass | All 14 tests green |
| **CPU Usage** | <50% during normal load | Container metrics |
| **Container Stability** | Zero crashes in 24h test | Uptime monitoring |
| **Transaction Integrity** | 100% rollback on error | Database audit |
| **Correct Advert Mapping** | 100% accuracy | Log verification |
| **Event Emission** | `emitAsync` used | Code review + unit tests |
| **Error Handling** | Graceful degradation | Integration test 2.2 |
| **Load Performance** | 100 publications in <5 minutes | Load test 3.1 |
| **Memory Stability** | No leaks over 24h | Load test 3.2 |

---

## 7. Testing Timeline

| Phase | Duration | Owner | Status |
|-------|----------|-------|--------|
| **Phase 1: Unit Tests** | 1 hour | Developer | ✅ Complete |
| **Phase 2: Integration Tests** | 4 hours | Developer + QA | 🔵 Ready |
| **Phase 3: Load Tests** | 8 hours | DevOps + QA | 🟣 Ready |
| **Phase 4: Monitoring Setup** | 2 hours | DevOps | 🔵 Ready |
| **Phase 5: Production Rollout** | 1 hour | DevOps | ⏳ Pending |

**Total Estimated Time**: 16 hours (2 working days)

---

## 8. Post-Deployment Verification

After deploying to production:

### Day 1 (First 24 hours)
- [ ] Monitor first hourly cron execution
- [ ] Check CPU metrics every hour
- [ ] Review error logs every 2 hours
- [ ] Verify publications marked as published correctly

### Week 1
- [ ] Daily CPU trend analysis
- [ ] Review failure rate (should be <1%)
- [ ] Check for any TBR transaction issues
- [ ] Validate PDF generation success rate

### Week 2-4
- [ ] Weekly metrics review
- [ ] Performance regression check
- [ ] User feedback on published adverts

---

## 9. Documentation Updates

After successful testing:

- [ ] Update [findings-publishing-task-cpu-spike.md](./findings-publishing-task-cpu-spike.md) with test results
- [ ] Document any additional edge cases discovered
- [ ] Update API documentation if endpoints changed
- [ ] Create runbook for troubleshooting future issues

---

## 10. References

- **Original Issue**: [findings-publishing-task-cpu-spike.md](./findings-publishing-task-cpu-spike.md)
- **Unit Tests**: [publishing.task.spec.ts](../../apps/legal-gazette-api/src/modules/advert/tasks/publishing/publishing.task.spec.ts)
- **Implementation**: [publishing.task.ts](../../apps/legal-gazette-api/src/modules/advert/tasks/publishing/publishing.task.ts)
- **NestJS Event Emitter Docs**: https://docs.nestjs.com/techniques/events
- **EventEmitter2 async handling**: https://github.com/EventEmitter2/EventEmitter2#async-listeners

---

**Last Updated**: January 14, 2026  
**Next Review**: After Phase 3 completion

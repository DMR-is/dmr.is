# Manual Testing Plan: Legal Gazette Pre-Release Testing

## Purpose

Comprehensive manual testing plan for the Legal Gazette system to be executed 2 weeks before production release. This plan covers all critical paths across the three web applications and their shared API.

---

## Testing Environment Requirements

### Prerequisites
- [ ] Staging environment fully deployed with latest code
- [ ] Test database seeded with representative data
- [ ] TBR sandbox/test environment connected
- [ ] Island.is test authentication configured
- [ ] X-Road test connections available
- [ ] Test national IDs available for different user types
- [ ] Email delivery testable (staging SMTP or email preview)

### Test Accounts Needed
| Account Type | Description | National ID |
|--------------|-------------|-------------|
| Admin User | User in UserModel table | (configure in staging) |
| Regular User | Authenticated but not admin | (configure in staging) |
| Active Subscriber | Has active subscription | (configure in staging) |
| Expired Subscriber | Has expired subscription | (configure in staging) |
| New User | Never used system before | (configure in staging) |
| Company User | Company national ID | (configure in staging) |
| Delegated User | User with delegation access | (configure in staging) |

---

## Application URLs

| Application | URL | Purpose |
|-------------|-----|---------|
| legal-gazette-web | TBD | Editor/Admin interface |
| legal-gazette-application-web | TBD | Application submission |
| legal-gazette-public-web | TBD | Public/Subscriber access |

---

## Test Cases

### Module 1: Authentication & Authorization

#### TC-1.1: Admin Login (legal-gazette-web)
**Priority:** Critical  
**Preconditions:** User is in UserModel table as admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to legal-gazette-web URL | Redirected to login page |
| 2 | Click "Innskráning" | Redirected to Island.is auth |
| 3 | Complete Island.is authentication | Redirected back to app |
| 4 | Verify dashboard loads | Admin dashboard visible with navigation |
| 5 | Verify user info displayed | Name and national ID visible |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-1.2: Non-Admin Blocked (legal-gazette-web)
**Priority:** Critical  
**Preconditions:** User is NOT in UserModel table

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to legal-gazette-web URL | Redirected to login page |
| 2 | Complete Island.is authentication | Access denied message shown |
| 3 | Attempt to access /ritstjorn directly | Access denied or redirect to login |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-1.3: Application Web Login (legal-gazette-application-web)
**Priority:** Critical  
**Preconditions:** Any authenticated user

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to legal-gazette-application-web URL | Redirected to login page |
| 2 | Complete Island.is authentication | Dashboard loads successfully |
| 3 | Verify "Mínar umsóknir" accessible | My applications page loads |
| 4 | Verify user info displayed | Name visible in header |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-1.4: Public Web - Unauthenticated Access
**Priority:** High  
**Preconditions:** User is not logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to legal-gazette-public-web URL | Public homepage loads |
| 2 | Navigate to /sidur/about | About page loads |
| 3 | Navigate to /sidur/gjaldskra | Fee schedule page loads |
| 4 | Navigate to /auglysingar | Redirected to login |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-1.5: Public Web - Active Subscriber Access
**Priority:** Critical  
**Preconditions:** User has active subscription (isActive=true, subscribedTo > now)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /auglysingar | Login required |
| 2 | Complete Island.is authentication | Redirected to adverts listing |
| 3 | Verify adverts are visible | List of published adverts shown |
| 4 | Click on an advert | Advert detail page loads |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-1.6: Public Web - Expired Subscriber Access
**Priority:** Critical  
**Preconditions:** User has expired subscription (subscribedTo < now)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in and navigate to /auglysingar | Subscription expired message shown |
| 2 | Prompt to renew subscription | Renewal option visible |
| 3 | Verify cannot access advert details | Blocked with subscription required message |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-1.7: Delegation Access
**Priority:** High  
**Preconditions:** User A has delegation from User B

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as User A | User selection screen appears |
| 2 | Select to act as User B | Acting as User B indicator shown |
| 3 | Perform actions | Actions recorded under User B's account |
| 4 | Switch back to User A | Own account restored |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

### Module 2: Subscription Flow (legal-gazette-public-web)

#### TC-2.1: New Subscription Purchase
**Priority:** Critical  
**Preconditions:** User has no existing subscription

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in to public-web | Subscriber info fetched/created |
| 2 | Navigate to subscription page | Subscription fee (4,500 ISK) displayed |
| 3 | Click "Kaupa áskrift" | Confirmation dialog appears |
| 4 | Confirm purchase | Success message shown |
| 5 | Verify subscription active | isActive=true, subscribedTo=1 year from now |
| 6 | Verify TBR payment created | Check logs or TBR sandbox |
| 7 | Access /auglysingar | Adverts now accessible |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-2.2: Subscription Renewal
**Priority:** High  
**Preconditions:** User has subscription expiring soon

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in with soon-to-expire subscription | Renewal prompt shown |
| 2 | Click renew | Confirmation dialog appears |
| 3 | Confirm renewal | Success message |
| 4 | Verify subscribedTo extended | Additional year added |
| 5 | Verify subscribedFrom unchanged | Original date preserved |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-2.3: TBR Payment Failure Handling
**Priority:** High  
**Preconditions:** TBR service unavailable or returns error

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Attempt to purchase subscription | Error shown to user |
| 2 | Verify subscriber NOT activated | isActive remains false |
| 3 | Verify no orphan payment records | DB in clean state |
| 4 | Retry when TBR available | Successful purchase |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

### Module 3: Application Submission (legal-gazette-application-web)

#### TC-3.1: Create New Application
**Priority:** Critical  
**Preconditions:** Authenticated user

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to create application | Application type selection shown |
| 2 | Select application type | Form for selected type loads |
| 3 | Fill in required fields | Validation passes |
| 4 | Save as draft | Draft saved, visible in my applications |
| 5 | Return to drafts | Can continue editing |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-3.2: Submit Application for Review
**Priority:** Critical  
**Preconditions:** Application in draft state

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open draft application | Application form loads |
| 2 | Complete all required fields | Form valid |
| 3 | Click submit | Confirmation dialog shown |
| 4 | Confirm submission | Status changes to "Submitted" |
| 5 | Verify no longer editable | Edit controls disabled |
| 6 | Verify appears in editor queue | Application visible in legal-gazette-web |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-3.3: Recall/Withdraw Application
**Priority:** High  
**Preconditions:** Application in submitted state

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open submitted application | Application detail loads |
| 2 | Click "Afturkalla" (recall) | Confirmation dialog |
| 3 | Confirm recall | Status changes to "Withdrawn" |
| 4 | Verify removed from editor queue | Not visible in legal-gazette-web |
| 5 | Check if can resubmit | Depends on business rules |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-3.4: Application Validation
**Priority:** High  
**Preconditions:** Creating new application

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Leave required fields empty | Cannot submit, errors shown |
| 2 | Enter invalid national ID | Validation error for kennitala |
| 3 | Enter invalid email | Validation error for email |
| 4 | Enter text exceeding max length | Length warning shown |
| 5 | Submit with valid data | Submission successful |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

### Module 4: Editor Workflow (legal-gazette-web)

#### TC-4.1: View Submitted Applications
**Priority:** Critical  
**Preconditions:** Admin user, submitted applications exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as admin | Dashboard loads |
| 2 | Navigate to application queue | List of pending applications |
| 3 | Click on application | Application detail view |
| 4 | Verify all submitted data visible | All fields readable |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-4.2: Approve Application to Advert
**Priority:** Critical  
**Preconditions:** Submitted application

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open submitted application | Detail view loads |
| 2 | Review content | All content visible |
| 3 | Click approve/accept | Advert created from application |
| 4 | Verify advert in system | New advert visible in adverts list |
| 5 | Verify original application updated | Status = Approved |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-4.3: Reject Application
**Priority:** High  
**Preconditions:** Submitted application

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open submitted application | Detail view |
| 2 | Click reject | Reason input requested |
| 3 | Enter rejection reason | Reason saved |
| 4 | Confirm rejection | Status changes to Rejected |
| 5 | Verify applicant notified | Email sent (check logs) |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-4.4: Edit Advert Content
**Priority:** High  
**Preconditions:** Advert in editable state

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open advert in editor | Edit form loads |
| 2 | Modify content | Changes reflected |
| 3 | Save changes | Changes persisted |
| 4 | Refresh page | Changes still visible |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-4.5: Schedule Advert for Publication
**Priority:** Critical  
**Preconditions:** Approved advert

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open approved advert | Detail view |
| 2 | Set publication date | Date picker works |
| 3 | Assign to issue | Issue selection available |
| 4 | Schedule publication | Status = Scheduled |
| 5 | Verify in issue list | Advert appears in scheduled issue |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-4.6: Publish Advert
**Priority:** Critical  
**Preconditions:** Scheduled advert, publication date reached

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger publication (or wait for date) | Advert published |
| 2 | Verify status = Published | Status updated |
| 3 | Verify TBR payment created | Payment record in database |
| 4 | Verify email notification sent | Check logs/email system |
| 5 | Verify visible in public-web | Subscribers can see advert |
| 6 | Verify PDF generated | PDF available for download |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

### Module 5: External System Integrations

#### TC-5.1: Foreclosure Sale Creation (Machine Client)
**Priority:** High  
**Preconditions:** Valid machine client credentials

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST to /api/v1/foreclosures/sale | Foreclosure created |
| 2 | Verify advert created | Advert in system |
| 3 | Verify properties attached | Properties visible |
| 4 | Verify proper status | Correct initial status |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-5.2: Foreclosure Sale Deletion
**Priority:** High  
**Preconditions:** Existing foreclosure sale

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | DELETE /api/v1/foreclosures/sale/{id} | Success response |
| 2 | Verify advert marked withdrawn | Status = Withdrawn |
| 3 | Verify not visible to public | Hidden from public view |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-5.3: Island.is Application Submission
**Priority:** High  
**Preconditions:** Valid Island.is integration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit via Island.is forms | Application received |
| 2 | Verify data mapping | All fields correctly mapped |
| 3 | Verify appears in editor queue | Visible for review |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

### Module 6: Advert Viewing (legal-gazette-public-web)

#### TC-6.1: Browse Published Adverts
**Priority:** Critical  
**Preconditions:** Active subscriber

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /auglysingar | Advert list loads |
| 2 | Verify pagination works | Can navigate pages |
| 3 | Apply filters | Results filtered correctly |
| 4 | Search by keyword | Matching results shown |
| 5 | Sort results | Sorting works |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-6.2: View Advert Detail
**Priority:** Critical  
**Preconditions:** Active subscriber, published advert exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on advert in list | Detail page loads |
| 2 | Verify all content visible | Title, body, metadata shown |
| 3 | Verify PDF download works | PDF downloads correctly |
| 4 | Verify related adverts shown | Related section populated |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-6.3: View Advert Categories
**Priority:** Medium  
**Preconditions:** Published adverts in various categories

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to category page | Categories listed |
| 2 | Click on category | Filtered adverts shown |
| 3 | Verify breadcrumb navigation | Breadcrumbs work |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

### Module 7: Error Handling & Edge Cases

#### TC-7.1: Session Expiry
**Priority:** High  
**Preconditions:** Logged in user

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Let session expire (or manually invalidate) | Attempt action |
| 2 | Perform protected action | Redirected to login |
| 3 | Re-authenticate | Action can be completed |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-7.2: Network Error Recovery
**Priority:** Medium  
**Preconditions:** User performing action

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Simulate network disconnect | Error shown |
| 2 | Reconnect | Retry option available |
| 3 | Retry action | Action completes |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-7.3: 404 Page
**Priority:** Low  
**Preconditions:** None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to non-existent URL | 404 page shown |
| 2 | Verify helpful message | User-friendly error |
| 3 | Verify navigation available | Can return to valid page |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

#### TC-7.4: Invalid Advert/Application ID
**Priority:** Medium  
**Preconditions:** None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /ritstjorn/invalid-uuid | Not found page |
| 2 | Navigate to /application/invalid-uuid | Not found page |
| 3 | Verify no error stack exposed | Clean error message |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

### Module 8: Performance Checks

#### TC-8.1: Page Load Times
**Priority:** Medium  
**Preconditions:** Normal data volume

| Page | Target Load Time | Actual | Pass/Fail |
|------|-----------------|--------|-----------|
| legal-gazette-web dashboard | < 3s | | |
| Application list | < 2s | | |
| Advert detail | < 2s | | |
| Public advert list | < 3s | | |

**Notes:**

---

#### TC-8.2: Large Dataset Handling
**Priority:** Medium  
**Preconditions:** 1000+ records in database

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load advert list | Paginated, fast |
| 2 | Search across all adverts | Results < 5s |
| 3 | Filter by multiple criteria | Responsive UI |

**Notes:**
- [ ] Pass
- [ ] Fail - Issue:

---

## Testing Schedule

| Week | Focus Area | Testers |
|------|------------|---------|
| Week -2 (Day 1-2) | Auth, Subscription | |
| Week -2 (Day 3-4) | Application Flow | |
| Week -2 (Day 5) | Regression & Fixes | |
| Week -1 (Day 1-2) | Editor Workflow, Publishing | |
| Week -1 (Day 3-4) | External Integrations, Edge Cases | |
| Week -1 (Day 5) | Final Regression | |

---

## Bug Reporting Template

```markdown
**Bug ID:** BUG-XXX
**Severity:** Critical | High | Medium | Low
**Test Case:** TC-X.X
**Environment:** Staging/Production

**Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Logs:**
[Attach if applicable]

**Assigned To:**
**Status:** Open | In Progress | Fixed | Verified
```

---

## Sign-Off Criteria

Before production release, ALL of the following must be true:

- [ ] All Critical test cases pass
- [ ] All High priority test cases pass
- [ ] No open Critical or High severity bugs
- [ ] All Medium bugs have documented workarounds or scheduled fixes
- [ ] TBR integration verified in sandbox
- [ ] Authentication tested with production-like Island.is configuration
- [ ] Email notifications verified
- [ ] PDF generation verified
- [ ] Load testing completed (if applicable)
- [ ] Stakeholder sign-off obtained

---

## Contact Information

| Role | Name | Contact |
|------|------|---------|
| QA Lead | | |
| Dev Lead | | |
| Product Owner | | |
| DevOps | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-30 | | Initial draft |

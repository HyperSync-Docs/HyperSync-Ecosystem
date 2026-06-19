# Lend-IN-Z1 — Borrower Application Intake Listener

## Purpose

Lend-IN-Z1 serves as the entry point into the HyperSync Lender Intake Operating System.

This workflow receives borrower application submissions, validates licensing authorization, establishes intake tracking identifiers, creates the Intake State record, and generates audit evidence for downstream processing.

Lend-IN-Z1 is the only authorized entry point into the Intake Operating System.

---

# Workflow Summary

## Step 1 — Borrower Application Intake

Receives borrower application submissions through a webhook endpoint.

Captured data may include:

* First Name
* Last Name
* Email
* Phone
* Property Address
* Loan Information
* Borrower Financial Data

---

## Step 2 — License Authorization Context

Creates the execution context required for Intake OS authorization.

Configured values include:

* License_ID
* Environment
* Requested_Zap
* Workspace_Type

---

## Step 3 — License Authorization Lookup

Queries the HyperSync License Registry to verify that the license is authorized for execution.

Authoritative Source:

```text
HyperSync_License_Registry
```

---

## Step 4 — Authorization Gate

Execution continues only when:

```text
Authorized = TRUE
Valid = TRUE
Record Exists = TRUE
```

Unauthorized requests are blocked before intake processing begins.

---

## Step 5 — Intake Identity Spine

Generates unique tracking identifiers.

Examples:

```text
Lend_App_ID
Correlation_ID
Intake Timestamp
```

These identifiers are used throughout the Lender Ecosystem for operational traceability.

---

## Step 6 — Deduplication Preparation

Creates a Dedup_Key using normalized borrower information.

Example Components:

```text
Email
Phone
Postal Code
Property Address
```

The Dedup_Key supports downstream duplicate detection workflows.

---

## Step 7 — Intake State Creation

Creates or updates the authoritative borrower record within:

```text
Lender_Intake_State
```

This table serves as the operational controller for Intake workflow progression.

---

## Step 8 — Audit Logging

Creates intake event records and stores borrower application evidence.

Audit Repositories:

```text
Lender_Intake_Log
Borrower_Application_Raw
```

---

## Step 9 — Conveyor Handoff

When intake processing completes successfully, the Intake State record is updated to authorize Lend-IN-Z2.

State Transition:

```text
Current_Stage      = IN_Z2_READY
Stage_Status       = Ready
Processing_Lock    = Unlocked
Last_Completed_Zap = Lend-IN-Z1
Next_Zap           = Lend-IN-Z2
```

---

# State Spine Integration

Authoritative Table:

```text
Lender_Intake_State
```

Responsibilities:

* Workflow routing
* State progression
* Processing lock management
* Audit traceability
* Conveyor authorization

---

# Key Functions

* Borrower Intake Processing
* License Validation
* Intake Identity Generation
* Deduplication Preparation
* State Spine Management
* Audit Logging
* Conveyor Routing

---

# Outcome

Successful borrower applications are validated, recorded, audited, and routed into the next stage of the Intake Operating System.

The workflow establishes the operational foundation required for loan classification, duplicate detection, document validation, and downstream lending processes.


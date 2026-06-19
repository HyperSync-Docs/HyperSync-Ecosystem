# Lend-IN-Z2 — Auto-Tag Loan Type (FHA / VA / Conventional)

## Purpose

Lend-IN-Z2 is responsible for automatically classifying borrower applications into loan categories based on predefined lending rules.

This workflow operates as the second stage of the Lender Intake Operating System and executes only after authorization from the Intake State Spine.

The workflow evaluates borrower qualification data, applies loan classification rules, records audit evidence, and routes the application into the duplicate detection stage.

---

# Workflow Summary

## Step 1 — Monitor Intake State

Monitors:

```text
Lender_Intake_State
```

The workflow activates when a borrower record is authorized for loan classification.

---

## Step 2 — Validate Z2 Conveyor Readiness

The workflow continues only when:

```text
Current_Stage = IN_Z2_READY

Stage_Status = Ready

Processing_Lock = Unlocked

Next_Zap = Lend-IN-Z2
```

This ensures only properly routed records enter the classification workflow.

---

## Step 3 — Acquire Processing Lock

The workflow claims ownership of the record by updating:

```text
Current_Stage = IN_Z2_PROCESSING

Stage_Status = Processing

Processing_Lock = Locked
```

This prevents concurrent execution and duplicate processing.

---

## Step 4 — Application Validation

Validates borrower application data before classification logic is executed.

Examples:

* Required borrower information present
* Application flags valid
* Record eligible for classification

---

## Step 5 — Loan Type Classification

Applies business rules to determine the loan category.

Examples:

### FHA

```text
Credit Score < 680
```

### VA

```text
Loan Purpose contains "VA"
```

### Conventional

```text
Credit Score ≥ 720

AND

Down Payment ≥ $20,000
```

The workflow outputs the assigned loan type for downstream processing.

---

## Step 6 — Audit Logging

Creates an audit record documenting the classification decision.

Repository:

```text
LoanType_Tag_Log
```

This preserves classification traceability.

---

## Step 7 — Borrower Record Lookup

Locates the original borrower application using:

```text
Lend_App_ID
```

This ensures updates are applied to the correct application record.

---

## Step 8 — Update Borrower Application

Updates the borrower application record to indicate successful classification.

Responsibilities:

* Mark classification complete
* Update processing flags
* Preserve workflow traceability

---

## Step 9 — Release Lock and Route to Z3

Upon successful completion:

```text
Current_Stage = IN_Z3_READY

Stage_Status = Ready

Processing_Lock = Unlocked

Last_Completed_Zap = Lend-IN-Z2

Next_Zap = Lend-IN-Z3
```

The borrower application is then authorized for duplicate detection processing.

---

# State Spine Integration

Authoritative Table:

```text
Lender_Intake_State
```

Responsibilities:

* Workflow routing
* Lock management
* State progression
* Conveyor authorization
* Operational traceability

---

# Key Functions

* Loan Classification
* Conveyor State Validation
* Processing Lock Control
* Audit Logging
* Borrower Record Updates
* State Progression Management

---

# Evidence

## Architecture Screenshot

**File:**

```text
Screenshots/Lend-IN-Z2.png
```

**Purpose:**

Production Zapier workflow diagram for the Auto-Tag Loan Type workflow.

This screenshot provides visual evidence of:

* State-driven Intake trigger architecture
* Conveyor readiness validation
* Processing lock acquisition
* FHA / VA / Conventional classification logic
* Audit logging workflow
* Borrower record updates
* Conveyor handoff into Lend-IN-Z3

The screenshot serves as static architectural evidence supporting the documented workflow design and operational structure of Lend-IN-Z2.

---

# Outcome

Lend-IN-Z2 automatically classifies borrower applications, creates audit evidence, updates workflow state, and routes qualified applications into the duplicate detection stage of the HyperSync Lender Intake Operating System.

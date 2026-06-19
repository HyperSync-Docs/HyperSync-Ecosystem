# Lend-IN-Z3 — Duplicate Intake Detector + Status Router

## Purpose

Lend-IN-Z3 is responsible for identifying duplicate borrower applications and routing records based on deduplication results.

This workflow serves as the duplicate detection stage of the Lender Intake Operating System and ensures that only unique borrower applications continue through the intake conveyor while duplicate submissions are routed for review.

The workflow utilizes the Intake State Spine to manage processing ownership, routing decisions, and workflow progression.

---

# Workflow Summary

## Step 1 — Monitor Intake State

Monitors:

```text
Lender_Intake_State
```

The workflow activates when a borrower application has successfully completed loan classification and is authorized for duplicate evaluation.

---

## Step 2 — Validate Z3 Conveyor Readiness

The workflow continues only when:

```text
Current_Stage = IN_Z3_READY

Stage_Status = Ready

Processing_Lock = Unlocked

Next_Zap = Lend-IN-Z3
```

This ensures that only authorized records enter the duplicate detection process.

---

## Step 3 — Acquire Processing Lock

The workflow claims ownership of the borrower record by updating:

```text
Current_Stage = IN_Z3_PROCESSING

Stage_Status = Processing

Processing_Lock = Locked
```

This prevents duplicate execution and protects workflow integrity.

---

## Step 4 — Deduplication Search

Performs a duplicate evaluation using the borrower Dedup_Key.

Example Components:

```text
Email
Phone
Postal Code
Property Address
```

The workflow searches intake records for matching borrower submissions.

---

## Step 5 — Duplicate Routing Decision

The workflow branches into two possible outcomes.

### Path A — Unique Application

Conditions:

```text
No matching Dedup_Key found
```

Actions:

* Mark record as Unique
* Record duplicate evaluation results
* Route application to document validation
* Continue conveyor progression

---

### Path B — Duplicate Application

Conditions:

```text
Matching Dedup_Key found
```

Actions:

* Mark record as Duplicate
* Route record to manual review
* Prevent automatic progression
* Preserve duplicate audit evidence

---

## Step 6 — State Update

Updates borrower workflow status based on routing outcome.

Examples:

### Unique

```text
Current_Stage = IN_Z4_READY

Stage_Status = Ready

Processing_Lock = Unlocked

Last_Completed_Zap = Lend-IN-Z3

Next_Zap = Lend-IN-Z4
```

### Duplicate

```text
Stage_Status = Manual_Review

Processing_Lock = Unlocked
```

---

## Step 7 — Audit Logging

Creates audit records documenting duplicate evaluation outcomes.

Audit activities include:

* Duplicate detection results
* Routing decisions
* Workflow progression
* Manual review assignments

---

# State Spine Integration

Authoritative Table:

```text
Lender_Intake_State
```

Responsibilities:

* Workflow routing
* Duplicate review control
* Processing lock management
* State progression
* Operational traceability

---

# Key Functions

* Duplicate Detection
* Dedup_Key Evaluation
* Workflow Routing
* Manual Review Assignment
* Audit Logging
* State Progression Management

---

# Evidence

## Architecture Screenshot

**File:**

```text
Screenshots/Lend-IN-Z3.png
```

**Purpose:**

Production Zapier workflow diagram for the Duplicate Intake Detector + Status Router.

This screenshot provides visual evidence of:

* State-driven Intake trigger architecture
* Conveyor readiness validation
* Processing lock acquisition
* Deduplication search logic
* Unique vs Duplicate routing
* Audit logging workflow
* Conveyor handoff into Lend-IN-Z4

The screenshot serves as static architectural evidence supporting the documented workflow design and operational structure of Lend-IN-Z3.

---

# Outcome

Lend-IN-Z3 ensures that duplicate borrower submissions are identified and controlled before progressing through the lending workflow.

Unique applications continue through the Intake conveyor while duplicate applications are routed for review, preserving workflow integrity and maintaining complete operational traceability.

# Lender Intake Operating System (Lender Intake OS)

## Overview

The Lender Intake Operating System (Lender Intake OS) serves as the entry layer of the HyperSync Lender Ecosystem. Its purpose is to receive borrower applications, validate intake eligibility, classify loan opportunities, detect duplicate submissions, identify missing information, and prepare complete applications for handoff into the Process Operating System.

The Intake OS is built using a state-driven conveyor architecture where workflow progression is controlled by the Lender_Intake_State table. Each Zap completes a specific responsibility and authorizes the next stage through controlled state transitions.

---

# Architecture Summary

## Operating Model

```text
Borrower Submission
        ↓
Lend-IN-Z1
Borrower Application Intake Listener
        ↓
Lend-IN-Z2
Auto-Tag Loan Type
        ↓
Lend-IN-Z3
Duplicate Intake Detector + Status Router
        ↓
Lend-IN-Z4
Missing Field Detector + Document Request Prep
        ↓
Lend-PRC-Z1
Process OS Entry Point
```

---

# State Spine Authority

Authoritative Table:

```text
Lender_Intake_State
```

The Lender_Intake_State table serves as the operational control plane for the Intake OS.

Responsibilities include:

* Workflow routing
* Stage progression
* Processing lock management
* Replay support
* Audit traceability
* Handoff authorization

All Intake workflows use the State Spine as the authoritative source of execution state.

---

# Intake Conveyor States

Examples of conveyor progression:

```text
IN_Z1_RECEIVED
        ↓
IN_Z2_READY
        ↓
IN_Z2_PROCESSING
        ↓
IN_Z3_READY
        ↓
IN_Z3_PROCESSING
        ↓
IN_Z4_READY
        ↓
IN_Z4_PROCESSING
        ↓
PRC_Z1_READY
```

---

# Zap Inventory

## Lend-IN-Z1

### Borrower Application Intake Listener

Responsibilities:

* Receive borrower submissions
* Validate license authorization
* Generate intake identifiers
* Create intake state records
* Generate audit evidence
* Route applications to loan classification

---

## Lend-IN-Z2

### Auto-Tag Loan Type

Responsibilities:

* Classify FHA loans
* Classify VA loans
* Classify Conventional loans
* Log classification activity
* Route applications to duplicate review

---

## Lend-IN-Z3

### Duplicate Intake Detector + Status Router

Responsibilities:

* Evaluate Dedup_Key records
* Identify duplicate submissions
* Route duplicate applications for review
* Route unique applications forward
* Maintain audit evidence

---

## Lend-IN-Z4

### Missing Field Detector + Document Request Prep

Responsibilities:

* Identify missing borrower information
* Determine document readiness
* Route complete applications to Process OS
* Route incomplete applications for review
* Generate operational alerts

---

# Evidence Artifacts

This folder contains architecture documentation and workflow evidence for:

* Lend-IN-Z1.md
* Lend-IN-Z2.md
* Lend-IN-Z3.md
* Lend-IN-Z4.md

Each artifact documents workflow purpose, operational logic, state transitions, and conveyor responsibilities within the HyperSync Lender Intake Operating System.

---

# Outcome

The Lender Intake OS ensures borrower applications are validated, classified, deduplicated, and prepared for downstream processing while maintaining full operational traceability through the HyperSync State Spine architecture.


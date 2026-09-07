# MOLD-IN-Z1 — Molding Document Intake & GDP Checklist Initialization

## Overview

**MOLD-IN-Z1** is the entry workflow for the HyperSync Mold Intake OS.

The Zap monitors incoming molding-document records, validates required metadata, checks whether the document has already entered the GDP workflow, and routes the record into either:

- **Path 1 — Valid New Document**
- **Path 2 — Duplicate Document**

A valid new document receives a governed GDP Checklist State record and Mold Intake State record before being handed to **MOLD-IN-Z2**.

A duplicate document is prevented from re-entering the active workflow and is instead routed toward Quality escalation.

---

## Workflow Position

```text
Molding Document Source
        │
        ▼
┌──────────────────────┐
│     MOLD-IN-Z1       │
│ Intake + Validation  │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
New Document   Duplicate
     │           │
     ▼           ▼
GDP Checklist  Escalation
Initialization  Route
     │
     ▼
MOLD-IN-Z2

┌──────────────────────────────────────────────────────────────┐
│ STEP 1 — Google Sheets Trigger                              │
│ Watch Mold_Document_Intake for new or updated records       │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 2 — Python Metadata Validation                         │
│ Validate document identity, metadata, workflow state,       │
│ document type, processing controls, and eligibility         │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 3 — Search GDP Checklist State                         │
│ Search for an existing checklist using Document_ID          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
             NOT FOUND                FOUND
                 │                     │
                 ▼                     ▼
        ┌─────────────────┐    ┌─────────────────┐
        │ PATH 1          │    │ PATH 2          │
        │ Valid New       │    │ Duplicate       │
        │ Document        │    │ Document        │
        └────────┬────────┘    └────────┬────────┘
                 │                     │
                 ▼                     ▼
        Build GDP Checklist      Find Duplicate
        Record                   Escalation Route
                 │                     │
                 ▼                     ▼
        Create GDP Checklist     Validate Route
        State Record                   │
                 │                     ▼
                 ▼               Teams Alert
        Create Mold Intake       [Pending Auth]
        State Record
                 │
                 ▼
             MOLD-IN-Z2

Step 1 — Molding Document Intake Trigger
Application

Google Sheets

Source

Mold_Document_Intake

Purpose

Detect a new or updated molding-document intake record.

The source record provides document metadata required to establish the downstream GDP workflow.

Typical metadata includes:

Document_ID
Document_Number
Document_Name
Document_Type
Revision
Department
Owner
Approval_Status
workflow-control metadata

The trigger does not itself determine whether a document is eligible for enrollment.

Eligibility is established by Step 2.

Step 2 — Validate Required Metadata
Application

Code by Zapier — Python

Purpose

Create a deterministic validation boundary between the source repository and the active Mold Intake workflow.

The validation step checks required metadata before allowing the document to continue.

Validation includes document information such as:

Document ID
Document Number
Document Name
Document Type
Revision
Department
Owner
Approval Status

The code also evaluates relevant workflow controls, including:

document type eligibility
current lifecycle stage
processing lock
control flags
enrollment eligibility
Output

The validation layer produces structured information describing:

validation status
missing fields
eligibility
normalized workflow state

A source record therefore cannot enter the governed GDP lifecycle merely because it triggered the Zap.

Step 3 — Existing GDP Checklist Search
Application

Zapier Tables

Operation

Search GDP Checklist State

Search Key

Document_ID

Purpose

Determine whether the document has already been enrolled into the GDP workflow.

This provides the branching condition between a legitimate new intake and a duplicate submission.

Conditional Routing

The result of the checklist search establishes two independent paths.

Document Validated
       │
       ▼
Existing Checklist?
       │
   ┌───┴───┐
   │       │
  NO      YES
   │       │
   ▼       ▼
Path 1   Path 2
New      Duplicate
Path 1 — Valid New Document
Entry Condition

Path 1 represents a document that:

passed metadata validation
is eligible for enrollment
does not already have an active GDP Checklist record

The document can therefore enter the governed review lifecycle.

Step 6 — Build GDP Checklist Record
Application

Code by Zapier — Python

Purpose

Construct the initial GDP Checklist State payload.

The step generates a unique:

Checklist_ID

and initializes the GDP controls required for downstream review.

The initial checklist items are set to:

Pending Review

Architectural Role

This step transforms source-document metadata into a governed HyperSync workflow object.

Conceptually:

Source Document
      │
      ▼
Validated Metadata
      │
      ▼
Checklist Builder
      │
      ▼
Governed GDP Checklist

The source document and workflow state remain related but logically separate.

Step 7 — Create GDP Checklist State
Application

Zapier Tables

Purpose

Persist the newly generated GDP checklist.

The record contains:

document identity
checklist identity
document metadata
validation results
GDP review state
workflow-control state
downstream routing metadata

The GDP Checklist State becomes the principal operational record consumed by the downstream review workflow.

Step 8 — Create Mold Intake State
Application

Zapier Tables

Purpose

Initialize the molding-document workflow state and establish the downstream handoff.

The record identifies the next workflow as:

MOLD-IN-Z2

This creates the boundary between document enrollment and automated GDP review.

Z1 → Z2 Handoff

The successful Path 1 lifecycle can be summarized as:

Document Received
       │
       ▼
Metadata Validated
       │
       ▼
Duplicate Check Passed
       │
       ▼
Checklist_ID Generated
       │
       ▼
GDP Checklist State Created
       │
       ▼
Mold Intake State Created
       │
       ▼
Next_Zap = MOLD-IN-Z2

MOLD-IN-Z2 subsequently consumes the persisted checklist state.

The downstream workflow therefore depends on a governed state transition rather than simply depending on Step 8 having executed.

Path 2 — Duplicate Document
Entry Condition

Path 2 is selected when the search identifies an existing GDP Checklist associated with the incoming Document_ID.

The system does not create another checklist.

Instead, the duplicate is treated as an exception requiring escalation.

Step 9 — Find Duplicate Escalation Route
Application

Zapier Tables

Purpose

Search the notification-routing configuration for the appropriate duplicate-document escalation route.

The route provides the information required to identify the intended Quality recipient and notification destination.

Step 10 — Validate Escalation Route
Application

Filter by Zapier

Purpose

Prevent an incomplete or inactive notification configuration from being used.

The route is expected to satisfy controls including:

route is active
required notification destination exists
expected escalation priority is configured
intended recipient information exists

Only a valid route proceeds to notification.

Step 11 — Duplicate Intake Notification
Application

Microsoft Teams

Purpose

Notify the appropriate Quality owner that an incoming document already has an existing GDP Checklist record.

This creates a human escalation rather than allowing automatic duplicate enrollment.

Current Integration Status

Pending Enterprise Authentication

The Microsoft Teams action requires connection to an authorized enterprise work account.

The workflow structure is configured, but this external notification action is not represented as fully executed or production validated.

Duplicate-Control Principle

The duplicate branch implements the following control:

Incoming Document
       │
       ▼
Existing Checklist Found
       │
       X
No Automatic Re-enrollment
       │
       ▼
Escalation Route
       │
       ▼
Human Notification

This protects the workflow from creating parallel GDP lifecycles for the same document identity.

State and Identity Model

MOLD-IN-Z1 establishes several identities that become important downstream.

Document_ID
     │
     ▼
Checklist_ID
     │
     ▼
MOLD-IN-Z2
     │
     ▼
Review_ID
     │
     ▼
Report_ID

The document identity originates upstream.

The checklist identity is created when the document successfully enters the GDP workflow.

Subsequent Zaps extend this traceability chain rather than replacing it.

Control Boundaries

MOLD-IN-Z1 contains several independent controls:

Control	Purpose
Metadata validation	Reject incomplete or invalid source records
Document-type validation	Restrict workflow enrollment
Stage validation	Prevent invalid lifecycle entry
Processing controls	Prevent inappropriate execution
Duplicate search	Detect existing GDP enrollment
Path routing	Separate new intake from duplicate handling
Notification-route validation	Prevent malformed escalation
Persistent state	Establish downstream workflow contract

These controls provide defense in depth at the system-entry boundary.

Failure Containment

A document should not progress simply because the Google Sheets trigger fires.

The intended progression is:

Trigger
   │
   ▼
Validation
   │
   ▼
Identity Check
   │
   ▼
Route Decision
   │
   ▼
Persistent State

A failure at an earlier control prevents the document from silently entering downstream GDP processing.

Operational Repositories

MOLD-IN-Z1 currently interacts with multiple data surfaces.

Google Sheets

Acts as the mock source repository for molding-document intake.

Zapier Tables

Acts as the transactional workflow-state layer for:

GDP Checklist State
Mold Intake State
notification routing
Microsoft Teams

Acts as the intended human escalation channel for duplicate-document exceptions.

Validation Status

The MOLD-IN-Z1 architecture has undergone step-level configuration and workflow validation.

Validated areas include:

trigger configuration
metadata validation
eligibility logic
existing-checklist search
new-document routing
GDP Checklist payload generation
Checklist_ID generation
GDP Checklist State creation
Mold Intake State creation
MOLD-IN-Z2 handoff configuration
duplicate-path routing
escalation-route lookup and validation
Pending Validation

The following external action remains pending:

Microsoft Teams duplicate-document notification

Reason:

An authenticated enterprise Microsoft Teams account is required.

Therefore MOLD-IN-Z1 should currently be described as:

Configured / Step-Level Verified

rather than:

Complete Enterprise E2E Verified

Security and Governance Characteristics

MOLD-IN-Z1 establishes several controls relevant to reliable and governed automation:

Validate before enrollment
Persist state before downstream execution
Detect duplicate identities
Separate exception handling from normal processing
Require valid notification routes
Maintain document/checklist traceability
Use explicit downstream workflow ownership

These controls establish the trust boundary for the remainder of the Mold Intake OS.

Downstream Contract

The primary successful output of MOLD-IN-Z1 is not merely a newly created table row.

It is a governed transition:

Unenrolled Molding Document
            │
            ▼
Validated GDP Workflow Participant
            │
            ▼
MOLD-IN-Z2

MOLD-IN-Z2 then assumes responsibility for automated GDP review, AI-output validation, normalization, and preparation of the Z3 reporting handoff.

Summary

MOLD-IN-Z1 serves as the admission-control layer of the HyperSync Mold Intake OS.

It ensures that:

incoming documents are validated,
workflow eligibility is established,
duplicate enrollment is detected,
valid documents receive governed checklist identity,
operational state is persisted,
exceptions are routed toward human escalation, and
only valid new documents are prepared for MOLD-IN-Z2.

This prevents downstream AI review and compliance processing from operating directly on uncontrolled source events.

Overview

Lend-PRC-Z1 — Normalize Borrower Contact + Financial Fields

Lend-PRC-Z1 serves as the entry workflow of the Lender Process Operating System.

The workflow receives authorized borrower applications from the Intake OS handoff table, validates conveyor readiness, acquires processing ownership, creates the authoritative Process State Spine record, normalizes borrower contact and financial information, persists normalized data, and advances the application into the validation stage (Lend-PRC-Z2).

Key normalization activities include:

Name standardization
Phone formatting
Email normalization
Financial field extraction
Missing data identification
Process State Spine creation

This workflow establishes clean and consistent borrower data before underwriting validation begins.

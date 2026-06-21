Overview

The Lender State Tables serve as the authoritative state management layer of the HyperSync Lender Ecosystem. These tables control workflow progression, orchestration, replay safety, audit logging, alerting, operational metrics, and cross-operating-system handoffs.

Unlike workflow Zaps, which execute automation logic, the State Tables function as the persistent system of record that governs lifecycle state transitions throughout the lending pipeline.

The Lender State Layer is organized into four functional categories:

Intake Layer
     ↓
Processing Layer
     ↓
Outbound Layer
     ↓
System Governance Layer

The architecture uses state-driven conveyor patterns, deterministic locking, replay controls, audit trails, and operational metrics to ensure reliable and auditable loan processing.

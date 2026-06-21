Purpose

Stores replay records that exceeded retry limits or require manual intervention.

Governance Role

DeadLetter Governance

Key Columns
Field	Copilot Field Type
DeadLetter_ID	String
Replay_ID	String
License_ID	String
Requested_Zap	String
Failure_Reason	Long Text
DeadLetter_Status	Dropdown
Escalation_Status	Dropdown
Created_At	Datetime
Correlation_ID	String
Producing Zaps
SYS-LIC-GATE-Z2
Consuming Zaps
SYS-LIC-GATE-Z3
Operations Team

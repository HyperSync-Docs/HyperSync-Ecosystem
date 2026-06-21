Purpose

Stores failed Lead OS executions awaiting replay processing.

Governance Role

Replay Governance

Key Columns
Field	Copilot Field Type
Replay_ID	String
Lead_ID	String
Replay_Status	Dropdown
Attempt_Count	Number
Next_Replay_At	Datetime
Failure_Reason	Long Text
Correlation_ID	String
Producing Zaps
L-SYS-SZ3
Error Governance Processes
Consuming Zaps
L-SYS-SZ3

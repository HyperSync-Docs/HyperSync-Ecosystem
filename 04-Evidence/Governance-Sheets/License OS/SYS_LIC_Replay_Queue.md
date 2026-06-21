Purpose

Stores failed license operations awaiting replay.

Governance Role

Replay Governance

Key Columns
Field	Copilot Field Type
Replay_ID	String
License_ID	String
Replay_Status	Dropdown
Attempt_Count	Number
Next_Replay_At	Datetime
Failure_Reason	Long Text
Correlation_ID	String
Producing Zaps
SYS-LIC-RRM-Z1
Consuming Zaps
SYS-LIC-RRM-Z1

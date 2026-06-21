Purpose

Authoritative queue governing replay execution for blocked or failed gate-controlled requests.

Governance Role

Replay Governance

Key Columns
Field	Copilot Field Type
Replay_ID	String
License_ID	String
Requested_Zap	String
Workspace_Type	Dropdown
Replay_Status	Dropdown
Attempt_Count	Number
Next_Replay_At	Datetime
Correlation_ID	String
Last_Updated_At	Datetime
Producing Zaps
SYS-LIC-GATE-Z1
SYS-LIC-GATE-Z2
Consuming Zaps
SYS-LIC-GATE-Z2

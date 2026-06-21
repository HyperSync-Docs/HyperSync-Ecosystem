HyperSync: Lender_Intake_State (State Spine)

The Lender_Intake_State table serves as the authoritative intake state spine for the HyperSync Lender Ecosystem. It maintains a one-to-one relationship with loan applications and governs borrower intake progression from initial submission through normalization, validation, document collection, duplicate detection, routing, and loan officer assignment.

This table functions as the control layer for the entire Intake Operating System and authorizes movement into the Process Operating System.

Key Fields
Core Identifiers
Field	Copilot-Friendly Type
Lend_App_ID	Single Line Text
Correlation_ID	Single Line Text
Dedupe_Key	Single Line Text
Dedupe_Status	Dropdown
Intake Management
Field	Copilot-Friendly Type
Intake_Status	Dropdown
Intake_Lock	Dropdown
Intake_Lock_At	Date/Time
Received_At	Date/Time
Last_Seen_At	Date/Time
Intake_Source	Dropdown
Applicant Contact
Field	Copilot-Friendly Type
Email_Norm	Email
Phone_Norm	Phone
Loan Information
Field	Copilot-Friendly Type
Loan_Purpose	Dropdown
Loan_Amount_Norm	Currency
Down_Payment_Norm	Currency
Income_Norm	Number
Credit_Norm	Number
Processing Control
Field	Copilot-Friendly Type
Validation_Status	Dropdown
Normalize_Ready	Dropdown
Validate_Ready	Dropdown
Route_Result	Dropdown
Assigned_Queue	Dropdown
Processing_Lock	Dropdown
Loan Classification
Field	Copilot-Friendly Type
LoanType_Tag	Single Line Text
Result_LoanType	Dropdown
LoanType_Tag_Ready	Dropdown
Human Review
Field	Copilot-Friendly Type
Human_Review_Status	Dropdown
Human_Review_Notes	Long Text
Human_Override	Dropdown
Document Management
Field	Copilot-Friendly Type
Docs_Status	Dropdown
Docs_Ready	Dropdown
Missing_Fields	Long Text
Docs_Next_Action	Long Text
Workflow Orchestration
Field	Copilot-Friendly Type
Current_Stage	Dropdown
Stage_Status	Dropdown
Last_Completed_Zap	Single Line Text
Next_Zap	Single Line Text
Attempts_Current	Number
Attempts_Max	Number
Next_Replay_At	Date/Time
Monitoring
Field	Copilot-Friendly Type
Last_Error	Long Text
Ops_Alert_Sent	Dropdown
Updated_At	Date/Time
Last_Updated_At	Date/Time
3. Conveyor Function

The Lender_Intake_State table governs all Intake OS progression:

Lend-IN-Z1
Borrower Application Intake Listener
        ↓
Lend-IN-Z2
Loan Type Classification
        ↓
Lend-IN-Z3
Duplicate Detection + Status Routing
        ↓
Lend-IN-Z4
Missing Documents Detection
        ↓
Lender_Intake_to_Process_Handoff_State
        ↓
Lender Process OS

The table acts as the authoritative conveyor controller by maintaining:

State transitions
Processing locks
Replay controls
Duplicate prevention
Human review gates
Document collection status
Next Zap authorization

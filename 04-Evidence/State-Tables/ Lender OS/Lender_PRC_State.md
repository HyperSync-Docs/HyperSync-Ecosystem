The Lender_PRC_State table serves as the authoritative processing state spine for the HyperSync Lender Process Operating System.

This table governs:

Borrower normalization
Financial validation
DTI analysis
Credit validation
Document verification
Eligibility decisions
Routing outcomes
Process OS progression

The table functions as the system-of-record for underwriting preparation and determines whether records advance into the Outbound Operating System.

3. Key Fields
Core Identity
Field	Copilot-Friendly Type
Lend_App_ID	Single Line Text
Correlation_ID	Single Line Text
Created_At	Date/Time
PRC-Z1 Controls
Field	Type
Normalize_Ready	Dropdown
Normalize_Lock	Dropdown
Normalize_Status	Dropdown
PRC-Z2 Controls
Field	Type
Validation_Ready	Dropdown
Validation_Lock	Dropdown
Validation_Status	Dropdown
Financial Evaluation
Field	Type
Credit_Score	Number
DTI_Ratio	Number
Income_Verified	Dropdown
Docs_Verified	Dropdown
PRC-Z3 Controls
Field	Type
Routing_Ready	Dropdown
Routing_Lock	Dropdown
Routing_Status	Dropdown
Decisioning
Field	Type
Route_Result	Dropdown
PreApproval_Status	Dropdown
Pending_Docs_Status	Dropdown
Conveyor
Field	Type
Current_Stage	Dropdown
Stage_Status	Dropdown
Last_Completed_Zap	Single Line Text
Next_Zap	Single Line Text
Last_Updated_At	Date/Time
4. Conveyor Function
Lend-PRC-Z1
Normalize Borrower Data
        ↓
Lend-PRC-Z2
Validate DTI / Credit / Docs
        ↓
Lend-PRC-Z3
Route Decision
        ↓
Lender_Process_to_Outbound_Handoff_State
        ↓
Outbound OS

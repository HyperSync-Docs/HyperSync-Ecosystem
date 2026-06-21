This table governs the controlled transfer of borrower applications from the Intake Operating System into the Process Operating System.

It serves as the official handoff ledger between OS boundaries.

3. Key Fields
Field	Type
Handoff_ID	Single Line Text
Correlation_ID	Single Line Text
Lend_App_ID	Single Line Text
Source_OS	Dropdown
Target_OS	Dropdown
Handoff_Status	Dropdown
Handoff_Started_At	Date/Time
Handoff_Completed_At	Date/Time
Last_Error	Long Text
4. Conveyor Function
Intake OS
       ↓
Handoff State
       ↓
Process OS

Provides deterministic OS boundary control.

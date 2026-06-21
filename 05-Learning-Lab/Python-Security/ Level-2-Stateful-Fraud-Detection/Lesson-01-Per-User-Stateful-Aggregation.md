Purpose

Introduces per-user stateful aggregation, the foundational building block of behavioral fraud detection systems.

This lesson teaches how to maintain isolated state for each user, safely initialize state records, and accumulate behavioral metrics over time without contaminating data between identities.

Unlike Level 1, which evaluates individual events, this lesson introduces persistent behavioral state that evolves across multiple events.

Security Concept
Group
Per-User Stateful Aggregation
Subgroups
User Isolation
Each identity must maintain independent state.

User activity must never contaminate another user's state.
Safe Initialization
State must be created deterministically.

State should always exist before mutation occurs.
Accumulative Tracking
Behavioral metrics are accumulated over time.

Only events belonging to the current user contribute to that user's profile.

These concepts form the basis of secure behavioral analysis.

Explanation
record = state.setdefault(user_id, {"total": 0})

record["total"] += amount

This pattern safely initializes state and updates only the targeted user's behavioral profile.

HyperSync Alignment

Directly aligns with future HyperSync capabilities:

Behavior Monitoring

Fraud Detection

Risk Scoring

Bot Detection

Compliance Analytics

User Activity Tracking

HyperSync Principle:

Track Behavior

Before

Making Trust Decisions

This is the first step toward behavioral intelligence.

Protection Code Notes
Safe State Initialization
record = state.setdefault(user_id, {"total": 0})

Explanation:

Creates user state if missing.

Prevents runtime failures.

Guarantees deterministic initialization.
User-Specific Mutation
record["total"] += amount

Explanation:

Updates only the targeted user's state.

Prevents cross-user contamination.

Maintains behavioral integrity.
Combined Protection
Safe Initialization

+

User Isolation

+

Controlled Mutation

Provides reliable state aggregation for behavioral analysis.

Real-World Scenario

A bank tracks spending activity across multiple customer accounts.

Example:

User A

Total Spending = $500
User B

Total Spending = $1200

The bank must maintain:

Separate state

Separate totals

Separate behavioral history

for every customer.

Mixing these records would corrupt fraud detection accuracy.

Acronyms
TX
Transaction

ID
Identifier

KPI
Key Performance Indicator
Attack Examples
Cross-User Contamination Attempt
{
  "user_id": "U1",
  "amount": 100
}
{
  "user_id": "U2",
  "amount": 100
}

Fraud Risk:

Shared state causes incorrect totals.

Behavior profiles become corrupted.
Missing State Initialization
{
  "user_id": "NEW_USER",
  "amount": 500
}

Without initialization:

Runtime failure

Missing user record

Application crash

With setdefault():

User state created safely

Transaction processed normally
Build Exercise

Create a Python function that:

Accepts user_id

Accepts amount

Creates user state if missing

Updates user total

Returns current total

Example:

process_tx("U1", 100)

process_tx("U1", 50)

Returns:

150
Expected Outcome

Upon completion of this lesson the learner should understand:

Per-User State

Safe Initialization

Behavior Tracking

User Isolation

Controlled Mutation

Behavioral Aggregation

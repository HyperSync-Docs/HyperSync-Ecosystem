Purpose

Introduces event joining by key, the foundational mechanism used to correlate related events across independent streams.

This lesson teaches how fraud detection systems link transactions, logins, devices, and other event types through shared identifiers to build contextual intelligence before making security decisions.

Without joins, streams remain isolated. With joins, systems gain the ability to understand relationships between events.

Security Concept
Group
Event Joining by Key
Subgroups
Join Keys
Events are linked using shared identifiers.

Examples:

User_ID

Device_ID

Session_ID

Transaction_ID
Stateful Join Storage
Partial events must be stored until matching events arrive.

State must persist long enough to complete the join.

Incomplete joins cannot be evaluated.
Join Completeness Validation
Fraud logic executes only when all required join components exist.

Partial joins must never trigger decisions.

These controls ensure reliable event correlation.

Explanation
store[user_id]["login"] = login_event

store[user_id]["tx"] = tx_event

if "login" in store[user_id] and "tx" in store[user_id]:
    evaluate(store[user_id])

This pattern stores partial events and executes fraud detection only when both sides of the join are present.

HyperSync Alignment

Directly aligns with future HyperSync capabilities:

Login + Transaction Correlation

Device + User Correlation

Cross-System Fraud Detection

Behavior Monitoring

Risk Scoring

AI Security Monitoring

HyperSync Principle:

Join Before You Decide

A security decision should never occur on incomplete context.

Protection Code Notes
Login Event Storage
store[user_id]["login"] = login_event

Explanation:

Stores login event.

Creates partial join state.

Preserves context for future evaluation.
Transaction Event Storage
store[user_id]["tx"] = tx_event

Explanation:

Stores transaction event.

Completes join candidate.

Provides transaction context.
Join Completeness Check
if "login" in store[user_id] and "tx" in store[user_id]:

Explanation:

Verifies both streams exist.

Prevents partial evaluation.

Ensures deterministic joins.
Fraud Evaluation
evaluate(store[user_id])

Explanation:

Runs fraud logic.

Uses complete context.

Produces accurate decisions.
Combined Protection
Join Keys

+

State Storage

+

Completeness Validation

Creates reliable cross-stream event correlation.

Real-World Scenario

A banking fraud engine receives:

Login Event

User_ID = U100

Several seconds later:

Transaction Event

User_ID = U100

The shared:

User_ID

acts as the join key.

The fraud engine combines both events before evaluating risk.

Acronyms
PK
Primary Key

FK
Foreign Key

UID
Unique Identifier
Attack Examples
Transaction Without Login
{
  "user_id": "U1",
  "tx_only": true
}

Problem:

Transaction exists.

Login missing.

Fraud evaluation blocked.
Login Without Transaction
{
  "user_id": "U1",
  "login_only": true
}

Problem:

Join incomplete.

Evaluation delayed.
Mismatched Join Keys
{
  "login_user": "U1",
  "tx_user": "U2"
}

Problem:

Events belong to different identities.

Join rejected.
Build Exercise

Create a Python function that:

Accepts login events

Accepts transaction events

Stores partial joins

Detects join completion

Runs evaluation only when complete

Returns JOINED or WAITING

Example:

add_login("U1")

add_transaction("U1")

Result:

JOINED
Expected Outcome

Upon completion of this lesson the learner should understand:

Join Keys

Stateful Joins

Join Completeness

Cross-Stream Correlation

Contextual Fraud Detection

Event Correlation

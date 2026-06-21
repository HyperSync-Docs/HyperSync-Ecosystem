Purpose

Introduces time-windowed joins, a core fraud detection technique used to correlate events only when they occur within an approved time interval.

This lesson teaches how fraud detection systems enforce temporal relationships between streams and prevent stale or unrelated events from being incorrectly joined.

Without time constraints, systems can create false correlations and inaccurate fraud decisions.

Security Concept
Group
Time-Windowed Joins
Subgroups
Temporal Alignment
Events must occur within a defined time interval.

Related events should be temporally connected.

Time is part of the trust model.
Join Expiration
Unmatched events cannot remain forever.

Stale records must be removed.

Expired events lose join eligibility.
Window Enforcement
Only events inside the approved time window may be joined.

Events outside the window are rejected.

These controls establish timing integrity across streams.

Explanation
if abs(tx_ts - login_ts) <= 10:
    return "JOINED"

This pattern measures the time difference between events and only permits joins when the difference falls within the approved interval.

HyperSync Alignment

Directly aligns with future HyperSync capabilities:

Login + Transaction Correlation

Session Validation

Fraud Detection

Replay Detection

Behavior Monitoring

AI Security Monitoring

HyperSync Principle:

Related Events

Must Be

Related In Time

Timing becomes a security control.

Protection Code Notes
Time Difference Calculation
abs(tx_ts - login_ts)

Explanation:

Calculates temporal distance.

Measures event separation.

Provides timing validation.
Window Enforcement
<= 10

Explanation:

Defines maximum join interval.

Rejects stale joins.

Preserves temporal accuracy.
Join Authorization
return "JOINED"

Explanation:

Approves valid join.

Allows downstream evaluation.

Maintains timing integrity.
Combined Protection
Temporal Alignment

+

Join Expiration

+

Window Enforcement

Creates secure time-based event correlation.

Real-World Scenario

A banking fraud engine receives:

Login Event

Timestamp = 12:00:00

Several seconds later:

Transaction Event

Timestamp = 12:00:06

Time Difference:

6 Seconds

Join Result:

JOINED

The events are considered related.

Acronyms
SLA
Service Level Agreement

TTL
Time To Live

UTC
Coordinated Universal Time
Attack Examples
Stale Join Attack
Login

t = 0
Transaction

t = 1000

Problem:

Events occur too far apart.

Join rejected.
Replay Timing Attack
Old login replayed.

New transaction submitted.

Problem:

Replay falls outside approved window.

Join blocked.
Delayed Correlation Attempt
Login

8:00 AM
Transaction

5:00 PM

Problem:

Temporal relationship invalid.

Join denied.
Build Exercise

Create a Python function that:

Accepts login timestamp

Accepts transaction timestamp

Calculates time difference

Enforces 10-second window

Returns JOINED or EXPIRED

Example:

join(login_ts=0, tx_ts=5)

Result:

JOINED
join(login_ts=0, tx_ts=20)

Result:

EXPIRED
Expected Outcome

Upon completion of this lesson the learner should understand:

Temporal Alignment

Time Windows

Join Expiration

Timing Integrity

Replay Protection

Time-Based Correlation

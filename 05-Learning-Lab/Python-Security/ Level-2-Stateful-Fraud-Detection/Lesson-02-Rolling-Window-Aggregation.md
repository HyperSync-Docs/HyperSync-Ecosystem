Purpose

Introduces rolling window aggregation, a foundational fraud detection technique used to evaluate user behavior within a specific period of time.

This lesson teaches how to maintain time-bounded state, remove stale events, and calculate accurate behavioral metrics using only relevant activity.

Unlike simple accumulation, rolling windows ensure that detection logic reflects recent behavior rather than historical activity.

Security Concept
Group
Rolling Window Aggregation
Subgroups
Time-Bounded State
Only recent events inside the active window are relevant.

Historical events outside the window should no longer influence detection.
Memory Control
Old events must be continuously removed.

This prevents unbounded memory growth and stale behavioral analysis.
Accurate Rolling Totals
Totals must automatically adjust as events enter and exit the window.

Metrics must always reflect the current behavioral state.

These concepts create time-aware fraud detection systems.

Explanation
window_start = now - 5

while record["events"] and record["events"][0][0] < window_start:
    _, amt = record["events"].popleft()
    record["total"] -= amt

record["events"].append((now, amount))
record["total"] += amount

This pattern continuously removes stale events while maintaining an accurate rolling total.

HyperSync Alignment

Directly aligns with future HyperSync capabilities:

Velocity Detection

Bot Detection

Traffic Monitoring

Fraud Analytics

Risk Scoring

Behavior Monitoring

HyperSync Principle:

Measure Recent Behavior

Not Historical Noise
Protection Code Notes
Window Cleanup
while record["events"] and record["events"][0][0] < window_start:

Explanation:

Identifies stale events.

Ensures only current events remain in the active window.
Total Correction
record["total"] -= amt

Explanation:

Removes expired values.

Preserves accurate rolling totals.
Event Registration
record["events"].append((now, amount))

record["total"] += amount

Explanation:

Adds current event.

Updates current behavioral profile.
Combined Protection
Window Cleanup

+

Total Reconciliation

+

Current Event Registration

Provides time-correct behavioral aggregation.

Real-World Scenario

An online retailer wants to detect rapid purchasing activity.

Example:

12:00:01

Purchase = $100
12:00:03

Purchase = $100
12:00:04

Purchase = $100

The system evaluates:

Last 5 Seconds

Total Value

Purchase Frequency

to determine if suspicious activity exists.

Acronyms
TTL
Time To Live

TX
Transaction

QoS
Quality of Service
Attack Examples
Burst Purchase Attack
{
  "amount": 100,
  "ts": 0
}
{
  "amount": 100,
  "ts": 1
}
{
  "amount": 100,
  "ts": 2
}

Fraud Risk:

High transaction velocity.

Potential automation or abuse.
Stale Event Pollution
Event occurred 2 hours ago.

Still included in total.

Behavior becomes inaccurate.

Window cleanup prevents this issue.

Build Exercise

Create a Python function that:

Stores timestamped events

Maintains a 5-second window

Removes stale events

Calculates rolling total

Returns current total

Example:

add_event(100)

add_event(200)

add_event(150)

Returns:

450

assuming all events remain inside the active window.

Expected Outcome

Upon completion of this lesson the learner should understand:

Rolling Windows

Time-Bounded State

Window Cleanup

Behavior Tracking

Velocity Detection

Memory Management

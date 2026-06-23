Purpose

Introduces sliding-window velocity detection used to identify bursts of activity occurring within short time intervals.

Security Concept
Group
Sliding Window Velocity Detection
Subgroups
Time-Bound Event Tracking

Memory-Bounded State

Burst Detection
HyperSync Alignment
Bot Detection

Lead Flood Detection

Lender Abuse Detection

Behavior Monitoring

Risk Scoring
Core Pattern
window_start = now - timedelta(seconds=5)

events = [t for t in record["events"] if t >= window_start]

if len(events) > threshold:
    raise ValueError("Velocity fraud detected")

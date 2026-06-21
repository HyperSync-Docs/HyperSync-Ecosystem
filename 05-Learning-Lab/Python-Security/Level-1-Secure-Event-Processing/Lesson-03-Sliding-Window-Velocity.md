Purpose

Introduces velocity detection techniques used to identify abnormal event activity over time.

Security Concept
Group
Sliding Window Velocity Detection
Subgroups
Rate Limiting

Burst Detection

Traffic Monitoring
HyperSync Alignment
Webhook Protection

Gate OS

License Validation

Bot Detection
Core Python Pattern
from collections import deque

events = deque()

def add_event(ts):
    events.append(ts)

    while events and ts - events[0] > 60:
        events.popleft()

    return len(events)
Attack Example
100 requests arrive in 10 seconds.

Normal behavior:
5 requests.

System detects burst activity.
Build Exercise

Create a velocity detector that:

Tracks events

Maintains a 60-second window

Alerts when threshold exceeded

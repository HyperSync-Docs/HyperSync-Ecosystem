Purpose

Introduces multi-metric fraud detection by combining behavioral indicators into a unified decision engine. This lesson teaches how count-based and value-based metrics can be evaluated together to detect patterns that single metrics would miss.

Security Concept
Group
Multi-Metric Stateful Detection
Subgroups
Count Tracking

Total Tracking

Synchronized Metrics
HyperSync Alignment
Risk Scoring

Fraud Detection

Bot Detection

Behavior Monitoring
Core Python Pattern
count = len(record["events"])

if count > 3 and record["total"] > 500:
    return "FRAUD"
Build Exercise
Track transaction count

Track transaction total

Trigger fraud when both thresholds exceed limits

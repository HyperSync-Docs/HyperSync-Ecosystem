Purpose

Introduces baseline-driven anomaly detection. This lesson teaches how systems learn expected behavior and identify significant deviations before state updates occur.

Security Concept
Group
Baseline Anomaly Detection
Subgroups
Behavior Baseline

Anomaly Detection

Stable Reference Models
Core Python Pattern
if amount > record["avg"] * 3:
    return "FRAUD"

record["avg"] = ((record["avg"] * count) + amount) / (count + 1)

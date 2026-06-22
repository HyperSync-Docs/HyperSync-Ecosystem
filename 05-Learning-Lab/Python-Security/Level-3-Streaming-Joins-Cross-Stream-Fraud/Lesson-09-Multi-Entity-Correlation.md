Purpose

Introduces multi-entity correlation, the process of identifying relationships between users, devices, IP addresses, sessions, accounts, and transactions.

This lesson teaches how modern fraud detection systems move beyond individual events and behavioral profiles to detect coordinated activity across interconnected entities.

While anomaly detection evaluates behavior, correlation detection evaluates relationships.

Security Concept
Group
Multi-Entity Correlation
Subgroups
Entity Relationships
Users connect to devices.

Devices connect to IPs.

IPs connect to sessions.

Relationships create security intelligence.
Shared Infrastructure Detection
Multiple entities sharing infrastructure may indicate fraud.

Shared devices and IP addresses create correlation signals.
Correlation Graphs
Entities become nodes.

Relationships become edges.

Security decisions emerge from graph patterns.

These controls establish graph-based fraud detection.

Explanation
graph[ip].add(user)

if len(graph[ip]) > 5:
    return "CORRELATED"

This pattern tracks relationships between entities and detects abnormal sharing behavior.

HyperSync Alignment

Directly aligns with future HyperSync capabilities:

Fraud Detection

Bot Detection

Risk Scoring

Identity Intelligence

Device Intelligence

AI Security Monitoring

HyperSync Principle:

Observe Relationships

Not Just Events

Security intelligence emerges from connected behavior.

Protection Code Notes
Entity Registration
graph[ip].add(user)

Explanation:

Creates relationship.

Links entities together.

Builds correlation graph.
Shared Resource Detection
len(graph[ip])

Explanation:

Counts connected entities.

Measures relationship density.

Detects suspicious sharing.
Correlation Threshold
if len(graph[ip]) > 5

Explanation:

Defines risk threshold.

Identifies unusual relationships.

Triggers investigation.
Combined Protection
Relationship Mapping

+

Shared Infrastructure Detection

+

Correlation Thresholds

Creates graph-based security intelligence.

Real-World Scenario

Fraud Engine observes:

IP Address

192.168.1.100

Connected Users:

User A

User B

User C

User D

User E

User F

Result:

6 users

1 IP

Correlation threshold exceeded

Investigation triggered.

Acronyms
IOC
Indicator of Compromise

UEBA
User Entity Behavior Analytics

IAM
Identity and Access Management
Attack Examples
Fraud Ring
Multiple accounts

Single IP

Shared infrastructure

Problem:

Correlation graph identifies relationship cluster.
Device Sharing Network
One device

Multiple accounts

Problem:

Shared device creates risk signal.
Bot Farm
Hundreds of accounts

Small IP range

Problem:

Entity relationships reveal coordinated activity.
Build Exercise

Create a Python function that:

Accepts user

Accepts device

Accepts IP

Builds relationship graph

Counts shared entities

Returns NORMAL or CORRELATED

Example:

register("U1", "D1", "IP1")

register("U2", "D2", "IP1")

Result:

Shared IP detected
Expected Outcome

Upon completion of this lesson the learner should understand:

Entity Correlation

Relationship Mapping

Graph Detection

Shared Infrastructure Analysis

Fraud Ring Detection

Security Intelligence
